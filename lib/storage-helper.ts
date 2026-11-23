import { supabase } from './supabase';

// Reads the signed-in user from the session saved in the browser. This avoids a round trip
// to the login server on every load and save, which made the app feel slow.
async function currentUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

// ID mapping: old numeric ID -> new UUID
const idMapping = new Map<string, string>();

// What this browser last loaded or saved. Used to send only what changed and to detect conflicts.
let knownBlocks = new Map<string, string>();        // block id -> JSON of its saved row
let knownBlockVersion = new Map<string, number>();  // block id -> version of its saved row
let knownBlockData = new Map<string, string>();     // block id -> JSON of its saved data
let knownBlockDataObj = new Map<string, any>();     // block id -> its saved data (for history)
let knownDataVersion = new Map<string, number>();   // block id -> version of its saved data
let archivedHere = new Set<string>();               // blocks archived in this browser (never written back)

// Human names for the sections and fields shown in the history
const SECTION_LABELS: Record<string, string> = {
  tasks: 'Tasks',
  documents: 'Documents',
  hsItems: 'Health & Safety',
  utilities: 'Utilities',
  insurance: 'Insurance',
  issues: 'Issues/complaints',
  jobs: 'Jobs/projects',
  units: 'Units',
  correspondence: 'Correspondence',
};
const FIELD_LABELS: Record<string, string> = {
  name: 'name',
  short_name: 'short name',
  address: 'address',
  height: 'height',
  managing_agent: 'managing agent',
};

type HistoryEntry = {
  block_id: string | null;
  block_name: string;
  action: string;
  section?: string | null;
  summary: string;
  detail?: any;
};

// Turns an app block into the database row (same field order every time)
function toRow(block: any) {
  const oldId = block.id;
  let blockId = oldId;
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blockId);

  if (!blockId || !isValidUUID) {
    blockId = crypto.randomUUID();
    // Store mapping from old numeric ID to new UUID
    if (oldId) {
      idMapping.set(String(oldId), blockId);
    }
  }

  return {
    id: blockId,
    name: block.name || '',
    short_name: block.shortName || block.short_name || '',
    address: block.address || '',
    height: block.height || 'Under 11m',
    managing_agent: block.managingAgent || block.managing_agent || {},
    created_at: block.created_at || new Date().toISOString(),
  };
}

function displayValue(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 80);
  return String(v).slice(0, 80);
}

// The name that identifies one item in a list, such as a document's name
function itemLabel(item: any): string {
  if (item === null || item === undefined) return '';
  if (typeof item !== 'object') return String(item).slice(0, 80);
  const v =
    item.name ?? item.title ?? item.description ?? item.item ?? item.subject ?? item.issue ?? item.label ??
    Object.values(item).find((x) => typeof x === 'string' && x.trim() !== '');
  return v ? String(v).slice(0, 80) : '(untitled)';
}

function quoteList(list: string[]): string {
  const shown = list.slice(0, 3).map((x) => `"${x}"`).join(', ');
  return list.length > 3 ? `${shown} and ${list.length - 3} more` : shown;
}

const isEmpty = (v: any) => v === undefined || v === null || (Array.isArray(v) && v.length === 0);

// Describes what changed inside one section, naming the items added, removed and edited
function describeSection(section: string, oldVal: any, newVal: any): { summary: string; detail: any } | null {
  const label = SECTION_LABELS[section] ?? section;
  if (!Array.isArray(oldVal) && !Array.isArray(newVal)) {
    return { summary: `${label}: updated`, detail: {} };
  }
  const oldList: any[] = Array.isArray(oldVal) ? oldVal : [];
  const newList: any[] = Array.isArray(newVal) ? newVal : [];
  const oldLabels = oldList.map(itemLabel);
  const newLabels = newList.map(itemLabel);

  const added = Array.from(new Set(newLabels.filter((l) => !oldLabels.includes(l))));
  const removed = Array.from(new Set(oldLabels.filter((l) => !newLabels.includes(l))));
  const edited = Array.from(new Set(
    newList
      .filter((item) => {
        const before = oldList.find((x) => itemLabel(x) === itemLabel(item));
        return before !== undefined && JSON.stringify(before) !== JSON.stringify(item);
      })
      .map(itemLabel)
  ));

  const parts: string[] = [];
  if (added.length) parts.push(`added ${quoteList(added)}`);
  if (removed.length) parts.push(`removed ${quoteList(removed)}`);
  if (edited.length) parts.push(`edited ${quoteList(edited)}`);

  if (parts.length === 0) {
    if (JSON.stringify(oldList) === JSON.stringify(newList)) return null;
    return { summary: `${label}: reordered`, detail: {} };
  }
  return {
    summary: `${label}: ${parts.join('; ')}`,
    detail: { added: added.slice(0, 50), removed: removed.slice(0, 50), edited: edited.slice(0, 50) },
  };
}

// One history entry per section that changed in a block
function sectionHistory(blockId: string, blockName: string, oldObj: any, newObj: any): HistoryEntry[] {
  const out: HistoryEntry[] = [];
  const sections = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));
  sections.forEach((s) => {
    const o = oldObj[s];
    const n = newObj[s];
    if (JSON.stringify(o ?? null) === JSON.stringify(n ?? null)) return;
    if (isEmpty(o) && isEmpty(n)) return;
    const change = describeSection(s, o, n);
    if (!change) return;
    out.push({
      block_id: blockId,
      block_name: blockName,
      action: 'changed',
      section: SECTION_LABELS[s] ?? s,
      summary: change.summary,
      detail: change.detail,
    });
  });
  return out;
}

// Writes history entries for the signed-in person. Never blocks a save if it fails.
async function writeHistory(user: any, entries: HistoryEntry[]) {
  if (entries.length === 0) return;
  const rows = entries.map((e) => ({
    block_id: e.block_id,
    block_name: e.block_name,
    action: e.action,
    section: e.section ?? null,
    summary: e.summary,
    detail: e.detail ?? {},
    user_id: user.id,
    user_email: user.email ?? '',
  }));
  const { error } = await supabase.from('block_history').insert(rows);
  if (error) console.warn('History not saved:', error.message);
}

// Lets the page show a clear message when a save fails
function notifyError(message: string) {
  try {
    window.dispatchEvent(new CustomEvent('bps-save-error', { detail: message }));
  } catch {
    // Not in a browser: nothing to show
  }
}

// Turns a save error into a plain message. A conflict says who changed the block last.
async function failureMessage(error: any, blockId: string): Promise<string> {
  const msg = String(error?.message || error || '');
  if (msg.includes('CONFLICT')) {
    let who = '';
    if (blockId) {
      const { data } = await supabase
        .from('block_history')
        .select('user_email, created_at')
        .eq('block_id', blockId)
        .order('created_at', { ascending: false })
        .limit(1);
      const row = data?.[0];
      if (row) {
        const name = (row.user_email || 'Someone').split('@')[0];
        const time = new Date(row.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        who = `${name} changed this block at ${time}. `;
      }
    }
    return `${who}Your change was not saved. Reload the page to see their changes, then make your change again.`;
  }
  if (msg.includes('Not signed in')) return 'Your change was not saved because you are signed out. Sign in again and retry.';
  return `Your change was not saved. ${msg}`;
}

async function saveBlocks(user: any, value: string, shared?: boolean) {
  const rows = JSON.parse(value).map(toRow).filter((r: any) => !archivedHere.has(r.id));
  const edits = rows.filter((r: any) => knownBlocks.has(r.id) && knownBlocks.get(r.id) !== JSON.stringify(r));
  const creations = rows.filter((r: any) => !knownBlocks.has(r.id));
  const history: HistoryEntry[] = [];
  let currentId = '';
  let failure: any = null;

  try {
    for (const r of edits) {
      currentId = r.id;
      const oldRow = JSON.parse(knownBlocks.get(r.id) || '{}');
      const { data: newVersion, error } = await supabase.rpc('save_block', {
        p_id: r.id,
        p_fields: {
          name: r.name,
          short_name: r.short_name,
          address: r.address,
          height: r.height,
          managing_agent: r.managing_agent,
        },
        p_expected: knownBlockVersion.get(r.id) ?? 1,
      });
      if (error) throw error;
      knownBlockVersion.set(r.id, Number(newVersion));
      knownBlocks.set(r.id, JSON.stringify(r));

      const changedFields = Object.keys(FIELD_LABELS).filter(
        (f) => JSON.stringify(oldRow[f]) !== JSON.stringify((r as any)[f])
      );
      if (changedFields.length > 0) {
        const parts = changedFields.map((f) =>
          f === 'managing_agent'
            ? 'managing agent'
            : `${FIELD_LABELS[f]} from "${displayValue(oldRow[f])}" to "${displayValue((r as any)[f])}"`
        );
        history.push({
          block_id: r.id,
          block_name: r.name,
          action: 'updated',
          section: 'Block details',
          summary: `Changed ${parts.join('; ')}`,
          detail: {
            changes: changedFields.map((f) => ({
              field: FIELD_LABELS[f],
              from: displayValue(oldRow[f]),
              to: displayValue((r as any)[f]),
            })),
          },
        });
      }
    }

    if (creations.length > 0) {
      currentId = creations[0].id;
      const payload = creations.map((r: any) => ({
        ...r,
        version: 1,
        user_id: user.id,
        created_by: user.id,
        created_by_email: user.email ?? '',
      }));
      const { error } = await supabase.from('blocks').insert(payload);
      if (error) throw error;
      creations.forEach((r: any) => {
        knownBlocks.set(r.id, JSON.stringify(r));
        knownBlockVersion.set(r.id, 1);
        history.push({ block_id: r.id, block_name: r.name, action: 'created', section: null, summary: `Created block "${r.name}"`, detail: {} });
      });
    }
  } catch (e) {
    failure = e;
  }

  await writeHistory(user, history);
  if (failure) {
    const msg = await failureMessage(failure, currentId);
    notifyError(msg);
    throw new Error(msg);
  }
  return { key: 'bps_pro_blocks', value, shared: shared || false };
}

async function saveBlockData(user: any, value: string, shared?: boolean) {
  const blockDataObj = JSON.parse(value);

  // Only save the block data that changed
  const changed: { dbId: string; json: string; data: any }[] = [];
  Object.keys(blockDataObj).forEach((blockId) => {
    const dbId = idMapping.get(String(blockId)) || blockId;
    if (archivedHere.has(dbId)) return;
    const json = JSON.stringify(blockDataObj[blockId]);
    if (knownBlockData.get(dbId) !== json) {
      changed.push({ dbId, json, data: blockDataObj[blockId] });
    }
  });

  const history: HistoryEntry[] = [];
  let currentId = '';
  let failure: any = null;

  try {
    for (const c of changed) {
      currentId = c.dbId;
      const { data: newVersion, error } = await supabase.rpc('save_block_data', {
        p_block: c.dbId,
        p_data: c.data,
        p_expected: knownDataVersion.get(c.dbId) ?? 0,
      });
      if (error) throw error;

      const knownRow = knownBlocks.get(c.dbId);
      const blockName = knownRow ? JSON.parse(knownRow).name || '' : '';
      history.push(...sectionHistory(c.dbId, blockName, knownBlockDataObj.get(c.dbId) || {}, c.data));

      knownDataVersion.set(c.dbId, Number(newVersion));
      knownBlockData.set(c.dbId, c.json);
      knownBlockDataObj.set(c.dbId, c.data);
    }
  } catch (e) {
    failure = e;
  }

  await writeHistory(user, history);
  if (failure) {
    const msg = await failureMessage(failure, currentId);
    notifyError(msg);
    throw new Error(msg);
  }
  return { key: 'bps_pro_block_data', value, shared: shared || false };
}

export const storageHelper = {
  async get(key: string) {
    try {
      const user = await currentUser();
      if (!user) return null;

      if (key === 'bps_pro_blocks') {
        // Shared team list of active (not archived) blocks
        const { data, error } = await supabase
          .from('blocks')
          .select('id, name, short_name, address, height, managing_agent, created_at, created_by, created_by_email, version')
          .is('archived_at', null)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching blocks:', error);
          return null;
        }

        knownBlocks = new Map();
        knownBlockVersion = new Map();
        (data || []).forEach((r: any) => {
          knownBlocks.set(
            r.id,
            JSON.stringify({
              id: r.id,
              name: r.name,
              short_name: r.short_name,
              address: r.address,
              height: r.height,
              managing_agent: r.managing_agent,
              created_at: r.created_at,
            })
          );
          knownBlockVersion.set(r.id, r.version ?? 1);
        });

        return { key, value: JSON.stringify(data || []), shared: false };
      }

      if (key === 'bps_pro_block_data') {
        const { data, error } = await supabase
          .from('block_data')
          .select('block_id, data, version');

        if (error) {
          console.error('Error fetching block data:', error);
          return null;
        }

        const blockDataObj: any = {};
        knownBlockData = new Map();
        knownBlockDataObj = new Map();
        knownDataVersion = new Map();
        (data || []).forEach((item: any) => {
          if (item.block_id && item.data) {
            blockDataObj[item.block_id] = item.data;
            knownBlockData.set(item.block_id, JSON.stringify(item.data));
            knownBlockDataObj.set(item.block_id, item.data);
            knownDataVersion.set(item.block_id, item.version ?? 1);
          }
        });

        return { key, value: JSON.stringify(blockDataObj), shared: false };
      }

      return null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async set(key: string, value: string, shared?: boolean) {
    const user = await currentUser();
    if (!user) return null;

    if (key === 'bps_pro_blocks') return saveBlocks(user, value, shared);
    if (key === 'bps_pro_block_data') return saveBlockData(user, value, shared);
    return null;
  },

  // Blocks are archived one at a time (see archiveBlock), never deleted in bulk
  async delete(_key: string, _shared?: boolean) {
    return null;
  },

  async list(prefix?: string, shared?: boolean) {
    return {
      keys: ['bps_pro_blocks', 'bps_pro_block_data'],
      prefix,
      shared: shared || false,
    };
  },

  // Hides a block for everyone. Only its creator can do this. It can be restored for 30 days.
  async archiveBlock(id: string) {
    const user = await currentUser();
    if (!user) throw new Error('Not signed in');

    const known = knownBlocks.get(id);
    const name = known ? JSON.parse(known).name || '' : '';

    const { error } = await supabase.rpc('archive_block', { p_id: id });
    if (error) {
      const msg = String(error.message).includes('creator')
        ? 'Only the person who created this block can archive it.'
        : `Could not archive the block: ${error.message}`;
      notifyError(msg);
      throw new Error(msg);
    }

    archivedHere.add(id);
    knownBlocks.delete(id);
    knownBlockVersion.delete(id);
    knownBlockData.delete(id);
    knownBlockDataObj.delete(id);
    knownDataVersion.delete(id);

    await writeHistory(user, [{ block_id: id, block_name: name, action: 'archived', section: null, summary: `Archived block "${name}"`, detail: {} }]);
  },

  // Brings back one of this person's archived blocks (within 30 days)
  async restoreBlock(id: string, name?: string) {
    const user = await currentUser();
    if (!user) throw new Error('Not signed in');

    const { error } = await supabase.rpc('restore_block', { p_id: id });
    if (error) {
      const msg = `Could not restore the block: ${error.message}`;
      notifyError(msg);
      throw new Error(msg);
    }

    archivedHere.delete(id);
    await writeHistory(user, [{ block_id: id, block_name: name || '', action: 'restored', section: null, summary: `Restored block "${name || ''}"`, detail: {} }]);
  },

  // This person's archived blocks, newest first
  async listArchived() {
    const user = await currentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('blocks')
      .select('id, name, short_name, address, archived_at')
      .not('archived_at', 'is', null)
      .eq('created_by', user.id)
      .order('archived_at', { ascending: false });

    if (error) {
      console.error('Error fetching archived blocks:', error);
      return [];
    }
    return data || [];
  },
};

// Create a window.storage polyfill
if (typeof window !== 'undefined') {
  (window as any).storage = storageHelper;
}
