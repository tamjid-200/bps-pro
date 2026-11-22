import { supabase } from './supabase';

// ID mapping: old numeric ID -> new UUID
const idMapping = new Map<string, string>();

// What this browser last loaded or saved. Saves only send what changed, and only
// delete blocks this person removed. Blocks added by other people are never touched.
let knownBlocks = new Map<string, string>(); // block id -> JSON of its saved row
let knownBlockData = new Map<string, string>(); // block id -> JSON of its saved data
let knownBlockDataObj = new Map<string, any>(); // block id -> its saved data (for history)

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

// Writes history entries for the signed-in person. Never blocks a save if it fails.
async function writeHistory(user: any, entries: { block_id: string | null; block_name: string; action: string; summary: string }[]) {
  if (entries.length === 0) return;
  const rows = entries.map((e) => ({ ...e, user_id: user.id, user_email: user.email ?? '' }));
  const { error } = await supabase.from('block_history').insert(rows);
  if (error) console.warn('History not saved:', error.message);
}

// Describes what changed in one section of a block, e.g. "Documents: added 2 (now 5)"
function describeSection(key: string, oldVal: any, newVal: any): string {
  const label = SECTION_LABELS[key] ?? key;
  if (Array.isArray(oldVal) || Array.isArray(newVal)) {
    const a = Array.isArray(oldVal) ? oldVal.length : 0;
    const b = Array.isArray(newVal) ? newVal.length : 0;
    if (a === b) return `${label}: edited`;
    if (b > a) return `${label}: added ${b - a} (now ${b})`;
    return `${label}: removed ${a - b} (now ${b})`;
  }
  return `${label}: updated`;
}

export const storageHelper = {
  async get(key: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      if (key === 'bps_pro_blocks') {
        // Shared team list: every signed-in user sees all blocks
        const { data, error } = await supabase
          .from('blocks')
          .select('id, name, short_name, address, height, managing_agent, created_at, created_by, created_by_email')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching blocks:', error);
          return null;
        }

        knownBlocks = new Map(
          (data || []).map((r: any) => [
            r.id,
            JSON.stringify({
              id: r.id,
              name: r.name,
              short_name: r.short_name,
              address: r.address,
              height: r.height,
              managing_agent: r.managing_agent,
              created_at: r.created_at,
            }),
          ])
        );

        return {
          key,
          value: JSON.stringify(data || []),
          shared: false
        };
      }

      if (key === 'bps_pro_block_data') {
        // Shared team data: every signed-in user sees all block data
        const { data, error } = await supabase
          .from('block_data')
          .select('block_id, data');

        if (error) {
          console.error('Error fetching block data:', error);
          return null;
        }

        // Convert array to object keyed by block_id
        const blockDataObj: any = {};
        knownBlockData = new Map();
        knownBlockDataObj = new Map();
        (data || []).forEach((item: any) => {
          if (item.block_id && item.data) {
            blockDataObj[item.block_id] = item.data;
            knownBlockData.set(item.block_id, JSON.stringify(item.data));
            knownBlockDataObj.set(item.block_id, item.data);
          }
        });

        return {
          key,
          value: JSON.stringify(blockDataObj),
          shared: false
        };
      }

      return null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async set(key: string, value: string, shared?: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      if (key === 'bps_pro_blocks') {
        const blocks = JSON.parse(value);
        const rows = blocks.map(toRow);
        const incoming = new Set(rows.map((r: any) => r.id));
        const history: any[] = [];

        // Delete only blocks this browser knew about that were removed here
        const removed = Array.from(knownBlocks.keys()).filter((id) => !incoming.has(id));
        if (removed.length > 0) {
          const { error } = await supabase.from('blocks').delete().in('id', removed);
          if (error) {
            console.error('Error deleting blocks:', error);
            throw error;
          }
          removed.forEach((id) => {
            const old = JSON.parse(knownBlocks.get(id) || '{}');
            history.push({ block_id: id, block_name: old.name || '', action: 'deleted', summary: `Deleted block "${old.name || ''}"` });
          });
        }

        // Save only the blocks that changed
        const changed = rows.filter((r: any) => knownBlocks.get(r.id) !== JSON.stringify(r));
        if (changed.length > 0) {
          const payload = changed.map((r: any) => {
            if (knownBlocks.has(r.id)) {
              // Existing block: record who saved it last
              return { ...r, user_id: user.id };
            }
            // New block: record who created it
            return { ...r, user_id: user.id, created_by: user.id, created_by_email: user.email ?? '' };
          });
          const { error } = await supabase.from('blocks').upsert(payload, { onConflict: 'id' });
          if (error) {
            console.error('Error saving blocks:', error);
            throw error;
          }

          changed.forEach((r: any) => {
            if (!knownBlocks.has(r.id)) {
              history.push({ block_id: r.id, block_name: r.name, action: 'created', summary: `Created block "${r.name}"` });
              return;
            }
            const old = JSON.parse(knownBlocks.get(r.id) || '{}');
            const fields = Object.keys(FIELD_LABELS).filter((f) => JSON.stringify(old[f]) !== JSON.stringify((r as any)[f]));
            if (fields.length > 0) {
              const names = fields.map((f) => FIELD_LABELS[f]).join(', ');
              history.push({ block_id: r.id, block_name: r.name, action: 'updated', summary: `Changed ${names}` });
            }
          });
        }

        knownBlocks = new Map(rows.map((r: any) => [r.id, JSON.stringify(r)]));
        await writeHistory(user, history);
        return { key, value, shared: shared || false };
      }

      if (key === 'bps_pro_block_data') {
        const blockDataObj = JSON.parse(value);
        const history: any[] = [];

        // Only save the block data that changed, so one person's save
        // cannot overwrite another person's changes to other blocks
        const changed: { dbId: string; json: string; row: any; data: any }[] = [];
        Object.keys(blockDataObj).forEach((blockId) => {
          const dbId = idMapping.get(String(blockId)) || blockId; // Use mapped UUID if available
          const json = JSON.stringify(blockDataObj[blockId]);
          if (knownBlockData.get(dbId) !== json) {
            changed.push({
              dbId,
              json,
              data: blockDataObj[blockId],
              row: {
                block_id: dbId,
                user_id: user.id, // last person who saved this block's data
                data: blockDataObj[blockId],
                updated_at: new Date().toISOString(),
              },
            });
          }
        });

        if (changed.length > 0) {
          const { error } = await supabase
            .from('block_data')
            .upsert(changed.map((c) => c.row), { onConflict: 'block_id' });

          if (error) {
            // Don't throw here - blocks are already saved, this is secondary data
            console.error('Error saving block data:', error);
            console.warn('Block data save failed, but blocks are saved');
          } else {
            // Work out what changed inside each block, for the history
            changed.forEach((c) => {
              const oldObj = knownBlockDataObj.get(c.dbId) || {};
              const newObj = c.data || {};
              const blockName = (() => {
                const old = knownBlocks.get(c.dbId);
                return old ? JSON.parse(old).name || '' : '';
              })();
              const sections = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));
              sections.forEach((section) => {
                const o = oldObj[section];
                const n = newObj[section];
                if (JSON.stringify(o ?? null) === JSON.stringify(n ?? null)) return;
                // Empty to empty is not a change
                if ((o === undefined || (Array.isArray(o) && o.length === 0)) && (n === undefined || (Array.isArray(n) && n.length === 0))) return;
                history.push({
                  block_id: c.dbId,
                  block_name: blockName,
                  action: 'changed',
                  summary: describeSection(section, o, n),
                });
              });
              knownBlockData.set(c.dbId, c.json);
              knownBlockDataObj.set(c.dbId, c.data);
            });
          }
        }

        await writeHistory(user, history);
        return { key, value, shared: shared || false };
      }

      return null;
    } catch (error) {
      console.error('Storage set error:', error);
      throw error; // Re-throw to see the actual error
    }
  },

  async delete(key: string, shared?: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      if (key === 'bps_pro_blocks') {
        // Only the blocks this browser knows about, never the whole team's list by user
        const ids = Array.from(knownBlocks.keys());
        if (ids.length > 0) {
          await supabase.from('blocks').delete().in('id', ids);
        }
        knownBlocks = new Map();

        // Clear ID mapping when blocks are deleted
        idMapping.clear();

        return { key, deleted: true, shared: shared || false };
      }

      if (key === 'bps_pro_block_data') {
        const ids = Array.from(knownBlockData.keys());
        if (ids.length > 0) {
          await supabase.from('block_data').delete().in('block_id', ids);
        }
        knownBlockData = new Map();
        knownBlockDataObj = new Map();

        return { key, deleted: true, shared: shared || false };
      }

      return null;
    } catch (error) {
      console.error('Storage delete error:', error);
      return null;
    }
  },

  async list(prefix?: string, shared?: boolean) {
    return {
      keys: ['bps_pro_blocks', 'bps_pro_block_data'],
      prefix,
      shared: shared || false
    };
  }
};

// Create a window.storage polyfill
if (typeof window !== 'undefined') {
  (window as any).storage = storageHelper;
}
