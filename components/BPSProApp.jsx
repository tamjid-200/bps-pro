import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import ToastStack from './ToastStack';
import { computeAlerts } from '../lib/bps-context';
import { analyzeInsuranceFile } from '../lib/ai-client';
import { fetchPlannerStatus, connectMicrosoft, disconnectMicrosoft } from '../lib/planner-client';
import PlannerStatus from './PlannerStatus';
import { Building, Home, FileText, Zap, Shield, MapPin, Users, Settings, Plus, Upload, Calendar, AlertCircle, CheckCircle, Edit2, Trash2, Download, X, Info, Menu, Wrench, MessageSquare, DoorOpen, Mail, Search, RefreshCw, ChevronDown, GraduationCap, Eye, EyeOff, History, Paperclip, Bell } from 'lucide-react';

const FILE_BUCKET = 'block-files';
const MAX_BLOCK_FILE_MB = 25;
const COMMENT_BUCKET = 'item-files';
const MAX_FILE_MB = 10;
const ALLOWED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.csv,.txt';

// Comments and file attachments on one item (an issue, job, letter, document or insurance item).
// Every comment is also written to the block's history.
function ItemComments({ blockId, blockName, itemKey, itemTitle, currentUserId, currentEmail }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(null);
  const [rows, setRows] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0); // changing this clears the file picker
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadCount = async () => {
    const { count: n } = await supabase
      .from('item_comments')
      .select('id', { count: 'exact', head: true })
      .eq('block_id', blockId)
      .eq('item_key', itemKey);
    setCount(n ?? 0);
  };

  const loadRows = async () => {
    const { data, error: err } = await supabase
      .from('item_comments')
      .select('id, body, attachments, user_id, user_email, created_at')
      .eq('block_id', blockId)
      .eq('item_key', itemKey)
      .order('created_at', { ascending: true });
    if (err) {
      setError(err.message);
      return;
    }
    setRows(data || []);
    setCount((data || []).length);
  };

  useEffect(() => { loadCount(); }, [blockId, itemKey]);

  useEffect(() => {
    if (!open) return;
    loadRows();
    const timer = setInterval(loadRows, 20000); // keeps the list fresh while it is open
    return () => clearInterval(timer);
  }, [open, blockId, itemKey]);

  const logHistory = (action, summary) =>
    supabase.from('block_history').insert({
      block_id: blockId,
      block_name: blockName || '',
      user_id: currentUserId,
      user_email: currentEmail || '',
      action,
      section: 'Comments',
      summary,
      detail: {},
    });

  const post = async () => {
    const body = text.trim();
    if (!body && !file) return;
    setBusy(true);
    setError('');
    try {
      let attachments = [];
      if (file) {
        if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`That file is larger than ${MAX_FILE_MB} MB.`);
        const safeName = file.name.replace(/[^\w.\- ]+/g, '_');
        const path = `${blockId}/${itemKey.replace(/[^\w-]+/g, '_')}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from(COMMENT_BUCKET)
          .upload(path, file, { contentType: file.type || undefined });
        if (upErr) throw upErr;
        attachments = [{ name: file.name, path, size: file.size, type: file.type || '' }];
      }

      const { error: insErr } = await supabase.from('item_comments').insert({
        block_id: blockId,
        item_key: itemKey,
        item_title: itemTitle,
        user_id: currentUserId,
        user_email: currentEmail || '',
        body,
        attachments,
      });
      if (insErr) throw insErr;

      await logHistory(
        'commented',
        `Commented on "${itemTitle}"${body ? `: ${body.slice(0, 120)}` : ''}${attachments.length ? ' (attached a file)' : ''}`
      );
      setText('');
      setFile(null);
      setFileInputKey((k) => k + 1);
      await loadRows();
    } catch (e) {
      setError(e.message || 'Could not post the comment.');
    } finally {
      setBusy(false);
    }
  };

  const openFile = async (a) => {
    const { data, error: err } = await supabase.storage.from(COMMENT_BUCKET).createSignedUrl(a.path, 300);
    if (err || !data?.signedUrl) {
      setError(err?.message || 'Could not open the file.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener');
  };

  const removeComment = async (row) => {
    if (!confirm('Delete this comment? It will be removed for everyone, including any attached file.')) return;
    const { error: delErr } = await supabase.from('item_comments').delete().eq('id', row.id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    const paths = (row.attachments || []).map((a) => a.path);
    if (paths.length > 0) await supabase.storage.from(COMMENT_BUCKET).remove(paths);
    await logHistory('comment deleted', `Deleted a comment on "${itemTitle}"`);
    loadRows();
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-slate-700 hover:text-slate-900 flex items-center gap-1.5"
      >
        <MessageSquare className="w-4 h-4" />
        {open ? 'Hide comments' : `Comments${count ? ` (${count})` : ''}`}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {rows.length === 0 && <p className="text-xs text-slate-500">No comments yet.</p>}

          {rows.map((r) => (
            <div key={r.id} className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                <span>
                  <span className="font-medium text-slate-700">{(r.user_email || 'Unknown').split('@')[0]}</span>
                  {' · '}
                  {new Date(r.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                {r.user_id === currentUserId && (
                  <button type="button" onClick={() => removeComment(r)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                )}
              </div>
              {r.body && <p className="text-sm text-slate-900 whitespace-pre-wrap break-words">{r.body}</p>}
              {(r.attachments || []).map((a) => (
                <button
                  key={a.path}
                  type="button"
                  onClick={() => openFile(a)}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline max-w-full"
                >
                  <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{a.name}</span>
                </button>
              ))}
            </div>
          ))}

          <div className="space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder="Write a comment… (type @name to notify someone)"
              className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-900"
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                key={fileInputKey}
                type="file"
                accept={ALLOWED_FILE_TYPES}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-700 max-w-full"
              />
              <button
                type="button"
                onClick={post}
                disabled={busy || (!text.trim() && !file)}
                className="bps-blue px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 ml-auto"
              >
                {busy ? 'Posting…' : 'Post comment'}
              </button>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BPSPro() {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [activeSection, setActiveSection] = useState('all-tasks');
  const [activeSubItem, setActiveSubItem] = useState(null);
  const [activeSubSubItem, setActiveSubSubItem] = useState(null);
  const [activeClaim, setActiveClaim] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAllBlocks, setShowAllBlocks] = useState(false);
  const [blockData, setBlockData] = useState({});
  const [plannerStatus, setPlannerStatus] = useState({});
  const [plannerItems, setPlannerItems] = useState({});
  const [plannerConnected, setPlannerConnected] = useState(null); // null = not checked yet
  const [plannerNotice, setPlannerNotice] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [plannerRefreshing, setPlannerRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [shownChoices, setShownChoices] = useState({}); // blockId -> true/false (this person's own choice)
  const [showChooser, setShowChooser] = useState(false);
  const [historyFor, setHistoryFor] = useState(null); // null = closed; blockId null = all blocks
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Shows which login is signed in (useful when testing with two users)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentEmail(data?.user?.email || '');
      setCurrentUserId(data?.user?.id || '');
    }).catch(() => {});
  }, []);
  
  // Mobile menu states
  const [showMainNav, setShowMainNav] = useState(false);
  const [showSubNav, setShowSubNav] = useState(false);
  const [showHelpSection, setShowHelpSection] = useState(false); // For collapsible Help & Support
  const [showTrainingSection, setShowTrainingSection] = useState(false); // For collapsible Training
  const [showModule1, setShowModule1] = useState(false); // For collapsible Module 1
  const [showTrainingModal, setShowTrainingModal] = useState(false); // For training module modal
  const [selectedModule, setSelectedModule] = useState(null); // Selected training module
  const [selectedVideo, setSelectedVideo] = useState(null); // Selected video within module
  const [uploadingFile, setUploadingFile] = useState(false); // File upload in progress
  
  // Info modal state (for Pres. mode, Feature, Help buttons)
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState({ title: '', message: '' });
  
  const [newBlockForm, setNewBlockForm] = useState({
    name: '',
    shortName: '',
    address: '',
    height: 'Under 11m'
  });
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    dueDate: '',
    priority: 'Medium',
    category: 'General',
    description: ''
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');
  const [setupForm, setSetupForm] = useState({
    frequency: 'Annual',
    lastCompleted: '',
    nextDue: '',
    assignedTo: '',
    autoChase: 'Disabled'
  });
  const [currentSetupKey, setCurrentSetupKey] = useState(null);
  const [rpForm, setRpForm] = useState({
    name: '',
    role: '',
    email: '',
    phone: ''
  });
  const [meterReadingForm, setMeterReadingForm] = useState({
    date: '',
    reading: '',
    notes: ''
  });
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    location: ''
  });
  const [settingsTab, setSettingsTab] = useState('assets');
  const [assetSearch, setAssetSearch] = useState('');
  const [hsViewType, setHsViewType] = useState('surveys');
  const [editBlockForm, setEditBlockForm] = useState({
    name: '',
    shortName: '',
    alsoKnownAs: '',
    address: '',
    height: 'Under 11m'
  });
  const [editAgentForm, setEditAgentForm] = useState({
    name: '',
    address: '',
    manager: '',
    email: ''
  });
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    type: 'Maintenance',
    contractor: '',
    cost: '',
    startDate: '',
    completionDate: '',
    status: 'Quote requested',
    location: '',
    notes: ''
  });
  const [unitForm, setUnitForm] = useState({
    type: 'Flat',
    number: '',
    floor: '',
    bedrooms: '',
    residentName: '',
    residentEmail: '',
    residentPhone: '',
    moveInDate: '',
    isOwner: false,
    notes: ''
  });
  const [bulkImportPreview, setBulkImportPreview] = useState([]);
  const [bulkImportError, setBulkImportError] = useState('');
  const [bulkImportFileName, setBulkImportFileName] = useState('');
  const [correspondenceForm, setCorrespondenceForm] = useState({
    type: 'Email',
    direction: 'Outgoing',
    subject: '',
    recipientName: '',
    recipientEmail: '',
    unitNumber: '',
    date: '',
    content: '',
    status: 'Sent',
    notes: ''
  });
  const [correspondenceFilter, setCorrespondenceFilter] = useState('all');
  const [correspondenceSearch, setCorrespondenceSearch] = useState('');
  
  // Custom modal state
  const [customModal, setCustomModal] = useState({ show: false, title: '', message: '' });

  // Backup system state
  const [backups, setBackups] = useState([]);
  const [showBackupPanel, setShowBackupPanel] = useState(false);
  const [autoBackups, setAutoBackups] = useState([]);

  // Badges only count open tasks that are overdue or due within 14 days.
  // Tasks with no due date, or due later than 14 days away, are not counted.
  const REMINDER_DAYS = 14;
  // Open Microsoft Planner tasks for a block that are overdue or due within 14 days
  const plannerDueCount = (blockId) =>
    (plannerItems[blockId] || []).filter(t => !t.done && t.daysLeft !== null && t.daysLeft <= REMINDER_DAYS).length;

  const countDueTasks = (tasks = []) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = today.getTime() + REMINDER_DAYS * 24 * 60 * 60 * 1000;
    return tasks.filter(t => {
      if (t.completed || !t.dueDate) return false;
      const d = new Date(`${String(t.dueDate).slice(0, 10)}T00:00:00`);
      return !isNaN(d) && d.getTime() <= limit;
    }).length;
  };

  // Helper functions for task counting and status
  const getTotalTasksForBlock = (blockId) => {
    const currentBlockData = blockData[blockId] || { tasks: [], issues: [] };
    const taskCount = countDueTasks(currentBlockData.tasks) + plannerDueCount(blockId);
    const issueCount = currentBlockData.issues?.length || 0;
    return taskCount + issueCount;
  };

  // Memoized calculation of total tasks across all blocks (performance optimization)
  // Deadline and insurance alerts (pop-up toasts)
  // Load this person's own choice of blocks to show
  useEffect(() => {
    if (!currentUserId) return;
    supabase
      .from('block_visibility')
      .select('block_id, shown')
      .eq('user_id', currentUserId)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((r) => { map[r.block_id] = r.shown; });
        setShownChoices(map);
      });
  }, [currentUserId]);

  // A block is shown if this person chose it. Without a choice, only blocks they created are shown.
  const isBlockShown = (block) => {
    const choice = shownChoices[block.id];
    if (choice !== undefined) return choice;
    return !!currentUserId && block.created_by === currentUserId;
  };
  const visibleBlocks = useMemo(
    () => blocks.filter((b) => isBlockShown(b)),
    [blocks, shownChoices, currentUserId]
  );
  const creatorName = (block) => (block.created_by_email || '').split('@')[0] || 'Unknown';

  // Saves this person's choice for one or more blocks
  const setManyShown = async (list, shown) => {
    if (list.length === 0) return;
    setShownChoices((prev) => {
      const next = { ...prev };
      list.forEach((b) => { next[b.id] = shown; });
      return next;
    });
    const { error } = await supabase
      .from('block_visibility')
      .upsert(
        list.map((b) => ({ user_id: currentUserId, block_id: b.id, shown, updated_at: new Date().toISOString() })),
        { onConflict: 'user_id,block_id' }
      );
    if (error) setPlannerNotice(`Could not save your choice: ${error.message}`);
  };

  // Loads the change history when it is opened
  useEffect(() => {
    if (!historyFor) return;
    setHistoryLoading(true);
    let query = supabase
      .from('block_history')
      .select('id, block_id, block_name, user_email, action, section, summary, detail, created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (historyFor.blockId) query = query.eq('block_id', historyFor.blockId);
    query
      .then(({ data, error }) => {
        if (error) setPlannerNotice(`Could not load history: ${error.message}`);
        setHistoryRows(data || []);
      })
      .finally(() => setHistoryLoading(false));
  }, [historyFor]);

  // Archive, restore and conflict notices
  const [viewers, setViewers] = useState([]); // other people who have this block open
  const [saveError, setSaveError] = useState('');
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [archivedRows, setArchivedRows] = useState([]);
  const [clearOpen, setClearOpen] = useState(false);
  const [histPerson, setHistPerson] = useState('');
  const [histSection, setHistSection] = useState('');
  const [histFrom, setHistFrom] = useState('');
  const [histTo, setHistTo] = useState('');

  // Shows who else has the open block (a soft notice; nobody is locked out)
  useEffect(() => {
    setViewers([]);
    if (!selectedBlock || !currentUserId) return;
    const myName = (currentEmail || 'Someone').split('@')[0];
    const channel = supabase.channel(`block-${selectedBlock}`, { config: { presence: { key: currentUserId } } });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const names = [];
        Object.entries(state).forEach(([key, metas]) => {
          if (key === currentUserId) return;
          metas.forEach((m) => names.push(m.name));
        });
        setViewers(Array.from(new Set(names)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ name: myName });
      });
    return () => { supabase.removeChannel(channel); };
  }, [selectedBlock, currentUserId, currentEmail]);

  // Shows a clear message when a save fails (for example, someone else changed the block first)
  useEffect(() => {
    const onError = (e) => setSaveError(e.detail || 'Your change was not saved.');
    window.addEventListener('bps-save-error', onError);
    return () => window.removeEventListener('bps-save-error', onError);
  }, []);

  // Archives only the blocks this person created. They are hidden for everyone and can be restored for 30 days.
  const archiveMyBlocks = async (mine) => {
    const archived = new Set();
    const failed = [];
    for (const b of mine) {
      try {
        await window.storage.archiveBlock(b.id);
        archived.add(b.id);
      } catch (e) {
        failed.push(b.shortName || b.name);
      }
    }
    const keep = blocks.filter((b) => !archived.has(b.id));
    const keepData = { ...blockData };
    archived.forEach((id) => { delete keepData[id]; });
    setBlocks(keep);
    setBlockData(keepData);
    setSelectedBlock((s) => (s && archived.has(s) ? null : s));
    setClearOpen(false);
    if (failed.length > 0) setPlannerNotice(`Could not archive: ${failed.join(', ')}`);
  };

  // Restores one of this person's archived blocks and reloads the list
  const restoreArchived = async (row) => {
    try {
      await window.storage.restoreBlock(row.id, row.short_name || row.name);
      const b = await window.storage.get('bps_pro_blocks');
      const d = await window.storage.get('bps_pro_block_data');
      setBlocks(JSON.parse(b?.value || '[]'));
      setBlockData(JSON.parse(d?.value || '{}'));
      setArchivedRows((rows) => rows.filter((r) => r.id !== row.id));
    } catch (e) {
      setPlannerNotice(e.message);
    }
  };

  const openArchived = async () => {
    setArchivedOpen(true);
    setArchivedRows(await window.storage.listArchived());
  };

  // Notifications: comments that mention you, or that are added to an item you have commented on
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadNotifications = async () => {
    if (!currentUserId) return;
    const { data, error } = await supabase
      .from('comment_notifications')
      .select('id, block_id, item_key, item_title, from_email, excerpt, reason, read_at, created_at')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error) setNotifications(data || []);
  };

  useEffect(() => {
    if (!currentUserId) return;
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
  }, [currentUserId]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markRead = async (ids) => {
    const now = new Date().toISOString();
    setNotifications((list) => list.map((n) => (ids.includes(n.id) && !n.read_at ? { ...n, read_at: now } : n)));
    await supabase.from('comment_notifications').update({ read_at: now }).in('id', ids).is('read_at', null);
  };

  const markAllRead = () => {
    const ids = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (ids.length > 0) markRead(ids);
  };

  // Opens the block and the item a notification is about
  const openNotification = (n) => {
    markRead([n.id]);
    setShowNotifications(false);
    const [section, id, sub] = String(n.item_key).split(':');
    setSelectedBlock(n.block_id);
    setShowAllBlocks(false);
    setActiveTab('home');
    setActiveClaim(null);
    setActiveSection(section);
    setActiveSubSubItem(null);

    let found = null;
    if (section === 'hs') {
      found = hsItems.find((i) => String(i.id) === id) || null;
      const subItem = found?.subItems?.find((s) => String(s.id) === sub);
      if (subItem) setActiveSubSubItem(subItem);
    } else if (section === 'utilities') {
      found = utilityItems.find((i) => String(i.id) === id) || null;
    } else if (section === 'insurance') {
      found = [...insuranceCategories.policy, ...insuranceCategories.other].find((i) => String(i.id) === id) || null;
    } else if (section === 'documents') {
      found = documentCategories.flatMap((c) => c.items || []).find((i) => String(i.id) === id) || null;
    }
    setActiveSubItem(found);
  };

  const alerts = useMemo(() => computeAlerts(visibleBlocks, blockData), [visibleBlocks, blockData]);

  // Shows a short message when Microsoft's sign-in page sends the user back to the app
  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get('microsoft');
    if (!result) return;
    window.history.replaceState({}, '', window.location.pathname);
    setPlannerNotice(
      result === 'connected' ? 'Microsoft 365 connected. Your Planner tasks will load shortly.'
        : result === 'denied' ? 'Microsoft sign-in was cancelled.'
        : 'Could not connect Microsoft 365. Please try again.'
    );
  }, []);

  // Reloads Planner tasks now, skipping the server's saved copy. Blocks are not reloaded.
  const refreshPlanner = () => {
    if (plannerRefreshing || plannerConnected !== true || visibleBlocks.length === 0) return;
    setPlannerRefreshing(true);
    fetchPlannerStatus(visibleBlocks, true)
      .then(({ connected, status, items }) => {
        setPlannerConnected(connected);
        setPlannerStatus(status);
        setPlannerItems(items);
      })
      .catch((err) => setPlannerNotice(err.message || 'Could not refresh Planner'))
      .finally(() => setPlannerRefreshing(false));
  };

  // Only re-check Planner when the set of visible blocks really changes, not on every render
  const visibleKey = visibleBlocks.map((b) => b.id).join(',');

  // Confirmation Statement status from Microsoft Planner, for this user's own plans.
  // Checks when the page opens, then again every 6 hours while it stays open.
  useEffect(() => {
    // Runs even with no blocks yet, so the Connect Microsoft button always shows
    const check = () =>
      fetchPlannerStatus(visibleBlocks)
        .then(({ connected, status, items }) => {
          setPlannerConnected(connected);
          setPlannerStatus(status);
          setPlannerItems(items);
        })
        .catch((err) => console.error('Planner status:', err));
    check();
    const timer = setInterval(check, 6 * 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, [visibleKey, currentUserId]);

  const totalTasksAllBlocks = useMemo(() => {
    return visibleBlocks.reduce((sum, block) => {
      const currentBlockData = blockData[block.id] || { tasks: [], issues: [] };
      const taskCount = countDueTasks(currentBlockData.tasks) + plannerDueCount(block.id) + (currentBlockData.issues?.length || 0);
      return sum + taskCount;
    }, 0);
  }, [visibleBlocks, blockData, plannerItems]);

  const hasOverdueTasks = (blockId) => {
    const currentBlockData = blockData[blockId] || { tasks: [] };
    const tasks = currentBlockData.tasks || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.some(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });
  };

  // Check if all tasks are completed for a block
  const areAllTasksCompleted = (blockId) => {
    const currentBlockData = blockData[blockId] || { tasks: [] };
    const tasks = currentBlockData.tasks || [];
    
    if (tasks.length === 0) return false; // No tasks = no green checkmark
    
    // All tasks must be completed
    return tasks.every(task => task.completed === true);
  };

  // Get count for each navigation section
  const getNavCount = (sectionId) => {
    if (!selectedBlock || !blockData[selectedBlock]) return 0;
    const currentBlockData = blockData[selectedBlock];
    
    switch(sectionId) {
      case 'documents':
        return (currentBlockData.documents || []).length;
      case 'hs':
        return (currentBlockData.hsItems || []).length;
      case 'insurance':
        return (currentBlockData.insurance || []).length;
      case 'utilities':
        return (currentBlockData.utilities || []).length;
      case 'jobs':
        return (currentBlockData.jobs || []).length;
      case 'issues':
        return (currentBlockData.issues || []).length;
      case 'units':
        return (currentBlockData.units || []).length;
      case 'correspondence':
        return (currentBlockData.correspondence || []).length;
      case 'all-tasks':
        const taskCount = countDueTasks(currentBlockData.tasks) + plannerDueCount(selectedBlock);
        const issueCount = (currentBlockData.issues || []).length;
        return taskCount + issueCount;
      default:
        return 0;
    }
  };

  // Check if section has no overdue/incomplete items (show green checkmark)
  const isNavComplete = (sectionId) => {
    if (!selectedBlock || !blockData[selectedBlock]) return true;
    const count = getNavCount(sectionId);
    return count === 0;
  };

  // ============ BACKUP SYSTEM FUNCTIONS ============

  // Save backup to Supabase
  const saveBackupToSupabase = async (backupName = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const backupData = {
        blocks: blocks,
        blockData: blockData,
        timestamp: new Date().toISOString()
      };

      const name = backupName || `Auto Backup - ${new Date().toLocaleString()}`;

      const { error } = await supabase
        .from('backups')
        .insert({
          user_id: user.id,
          backup_data: backupData,
          backup_name: name
        });

      if (error) {
        console.error('Backup error:', error);
      } else {
        console.log('✅ Backup saved successfully');
        loadBackups();
      }
    } catch (error) {
      console.error('Backup error:', error);
    }
  };

  // Load all backups
  const loadBackups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('backups')
        .select('id, backup_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Load backups error:', error);
      } else {
        setBackups(data || []);
      }

      // Automatic 6-hour snapshots (only this user's data is returned)
      const { data: autoList, error: autoErr } = await supabase.rpc('list_auto_backups');
      if (autoErr) console.error('Load auto backups error:', autoErr);
      else setAutoBackups(autoList || []);
    } catch (error) {
      console.error('Load backups error:', error);
    }
  };

  // Restore from backup
  const restoreAutoBackup = async (snapshotId, createdAt) => {
    if (!confirm(`Restore your data from the backup taken ${new Date(createdAt).toLocaleString('en-GB')}? This replaces your current blocks and data.`)) return;
    const { error } = await supabase.rpc('restore_auto_backup', { p_id: snapshotId });
    if (error) {
      console.error('Restore error:', error);
      alert('Restore failed: ' + error.message);
      return;
    }
    alert('Restored. The page will now reload.');
    window.location.reload();
  };

  const restoreFromBackup = async (backupId) => {
    if (!confirm('⚠️ This will replace ALL current data with the backup. Are you sure?')) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('backups')
        .select('backup_data')
        .eq('id', backupId)
        .single();

      if (error) {
        console.error('Restore error:', error);
        alert('Failed to restore backup');
        return;
      }

      const restoredData = data.backup_data;
      
      // Update state
      setBlocks(restoredData.blocks);
      setBlockData(restoredData.blockData);
      
      // Save to localStorage
      await window.storage.set('bps_pro_blocks', JSON.stringify(restoredData.blocks));
      await window.storage.set('bps_pro_block_data', JSON.stringify(restoredData.blockData));
      
      alert('✅ Data restored successfully!');
      setShowBackupPanel(false);
    } catch (error) {
      console.error('Restore error:', error);
      alert('Failed to restore backup');
    }
  };

  // Delete old backups (keep only last 7)
  const cleanupOldBackups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: allBackups } = await supabase
        .from('backups')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (allBackups && allBackups.length > 7) {
        const backupsToDelete = allBackups.slice(7).map(b => b.id);
        
        await supabase
          .from('backups')
          .delete()
          .in('id', backupsToDelete);

        console.log('✅ Cleaned up old backups');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  // ============ END BACKUP SYSTEM FUNCTIONS ============

  // File upload and management functions
  // Uploaded files live in Supabase Storage. Block data keeps only each file's name and location.
  const filePathFor = (blockId, sectionKey, fileName) => {
    const safeName = fileName.replace(/[^\w.\- ]+/g, '_');
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return `${blockId}/${sectionKey.replace(/[^\w-]+/g, '_')}/${unique}-${safeName}`;
  };

  // A short-lived link to a stored file (expires after 5 minutes)
  const signedFileUrl = async (path, downloadName = null) => {
    const { data, error } = await supabase.storage
      .from(FILE_BUCKET)
      .createSignedUrl(path, 300, downloadName ? { download: downloadName } : undefined);
    if (error || !data?.signedUrl) throw new Error(error?.message || 'File not found');
    return data.signedUrl;
  };

  // The file's contents as a data URL (used by the insurance reader)
  const fileAsDataUrl = async (file) => {
    if (file.data) return file.data;
    const blob = await (await fetch(await signedFileUrl(file.path))).blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  };

  const handleFileUpload = async (section, subSection = null) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.gif';
    input.multiple = true;

    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      setUploadingFile(true);

      try {
        const currentData = blockData[selectedBlock] || {};
        const uploadedFiles = currentData.uploadedFiles || {};

        // Section key (e.g., "insurance-building" or "documents-fire-doors")
        const sectionKey = subSection ? `${section}-${subSection}` : section;
        const sectionFiles = uploadedFiles[sectionKey] || [];

        const added = [];
        for (const file of files) {
          if (file.size > MAX_BLOCK_FILE_MB * 1024 * 1024) {
            throw new Error(`"${file.name}" is larger than ${MAX_BLOCK_FILE_MB} MB.`);
          }
          const path = filePathFor(selectedBlock, sectionKey, file.name);
          const { error: upErr } = await supabase.storage
            .from(FILE_BUCKET)
            .upload(path, file, { contentType: file.type || undefined });
          if (upErr) throw upErr;
          added.push({ name: file.name, type: file.type, size: file.size, uploadedAt: new Date().toISOString(), path });
        }

        const updatedData = {
          ...currentData,
          uploadedFiles: { ...uploadedFiles, [sectionKey]: [...sectionFiles, ...added] }
        };

        setBlockData(prev => ({
          ...prev,
          [selectedBlock]: updatedData
        }));

        await window.storage.set('bps_pro_block_data', JSON.stringify({
          ...blockData,
          [selectedBlock]: updatedData
        }));

        // Read insurance documents with AI to find cover dates
        if (sectionKey.startsWith('insurance-')) {
          const covers = { ...(updatedData.insuranceCover || {}) };
          for (const f of added) {
            if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(f.type)) continue;
            try {
              covers[sectionKey] = await analyzeInsuranceFile({ ...f, data: await fileAsDataUrl(f) });
            } catch (err) {
              console.error('Insurance read failed:', err);
              alert(`Could not read "${f.name}" automatically: ${err.message}`);
            }
          }
          const withCovers = { ...updatedData, insuranceCover: covers };
          setBlockData(prev => ({ ...prev, [selectedBlock]: withCovers }));
          await window.storage.set('bps_pro_block_data', JSON.stringify({
            ...blockData,
            [selectedBlock]: withCovers
          }));
        }

      } catch (error) {
        console.error('File upload error:', error);
        alert(`Could not upload the file. ${error.message || 'Please try again.'}`);
      } finally {
        setUploadingFile(false);
      }
    };

    input.click();
  };

  const handleFileDelete = async (section, subSection, fileIndex) => {
    const sectionKeyForName = subSection ? `${section}-${subSection}` : section;
    const fileToDelete = (blockData[selectedBlock]?.uploadedFiles?.[sectionKeyForName] || [])[fileIndex];
    const label = fileToDelete?.name ? `"${fileToDelete.name}"` : 'this file';
    if (!confirm(`Delete ${label}? It will be removed for everyone and cannot be undone. The deletion is recorded in the block's history.`)) return;

    try {
      const currentData = blockData[selectedBlock] || {};
      const uploadedFiles = { ...(currentData.uploadedFiles || {}) };
      const sectionKey = subSection ? `${section}-${subSection}` : section;
      const sectionFiles = [...(uploadedFiles[sectionKey] || [])];
      const removed = sectionFiles[fileIndex];

      sectionFiles.splice(fileIndex, 1);
      uploadedFiles[sectionKey] = sectionFiles;

      const updatedData = {
        ...currentData,
        uploadedFiles
      };

      setBlockData(prev => ({
        ...prev,
        [selectedBlock]: updatedData
      }));

      await window.storage.set('bps_pro_block_data', JSON.stringify({
        ...blockData,
        [selectedBlock]: updatedData
      }));

      if (removed?.path) {
        await supabase.storage.from(FILE_BUCKET).remove([removed.path]);
      }

    } catch (error) {
      console.error('File delete error:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  const handleFileDownload = async (fileData) => {
    try {
      const link = document.createElement('a');
      link.href = fileData.path ? await signedFileUrl(fileData.path, fileData.name) : fileData.data;
      link.download = fileData.name;
      link.click();
    } catch (err) {
      alert(`Could not download the file. ${err.message}`);
    }
  };

  // Preview: open the file in a new tab (works for PDFs, images and other browser-viewable files)
  const handleFilePreview = async (fileData) => {
    try {
      if (fileData.path) {
        // Open the tab first so the browser allows it, then point it at the file
        const win = window.open('', '_blank');
        if (!win) {
          alert('Please allow pop-ups for this site to preview files.');
          return;
        }
        win.location = await signedFileUrl(fileData.path);
        return;
      }
      // Files uploaded before storage was added are still stored inside the block data
      const [header, b64] = String(fileData.data).split(',');
      const mime = (header.match(/data:(.*?);base64/) || [])[1] || fileData.type || 'application/octet-stream';
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      const win = window.open(url, '_blank');
      if (!win) alert('Please allow pop-ups for this site to preview files.');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error('Preview failed:', err);
      alert('This file cannot be previewed here. Use Download instead.');
    }
  };

  // Moves files uploaded before storage was added out of the block data and into Storage.
  // Runs once after load; files that cannot be moved are left as they are and retried next time.
  const migrateLegacyFiles = async (loaded) => {
    const next = { ...loaded };
    let changed = false;
    for (const blockId of Object.keys(loaded)) {
      const uploaded = loaded[blockId]?.uploadedFiles;
      if (!uploaded) continue;
      const moved = {};
      for (const [sectionKey, files] of Object.entries(uploaded)) {
        moved[sectionKey] = [];
        for (const f of files || []) {
          if (!f.data) {
            moved[sectionKey].push(f);
            continue;
          }
          try {
            const blob = await (await fetch(f.data)).blob();
            const path = filePathFor(blockId, sectionKey, f.name || 'file');
            const { error } = await supabase.storage
              .from(FILE_BUCKET)
              .upload(path, blob, { contentType: f.type || undefined });
            if (error) throw error;
            const { data, ...rest } = f;
            moved[sectionKey].push({ ...rest, path });
            changed = true;
          } catch (e) {
            console.warn('Could not move a file to storage yet:', e.message);
            moved[sectionKey].push(f);
          }
        }
      }
      next[blockId] = { ...loaded[blockId], uploadedFiles: moved };
    }
    if (!changed) return;
    setBlockData(next);
    try {
      await window.storage.setSilent('bps_pro_block_data', JSON.stringify(next));
    } catch (e) {
      console.warn('Saving moved files failed; they will be moved again next time:', e.message);
    }
  };

  const getUploadedFiles = (section, subSection = null) => {
    if (!selectedBlock || !blockData[selectedBlock]) return [];
    const uploadedFiles = blockData[selectedBlock].uploadedFiles || {};
    const sectionKey = subSection ? `${section}-${subSection}` : section;
    return uploadedFiles[sectionKey] || [];
  };

  // Main navigation
  const mainNav = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'all-tasks', name: 'All tasks', icon: Menu },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'hs', name: 'H&S', icon: Shield },
    { id: 'insurance', name: 'Insurance', icon: AlertCircle },
    { id: 'utilities', name: 'Utilities', icon: Zap },
    { id: 'jobs', name: 'Jobs/projects', icon: Wrench },
    { id: 'issues', name: 'Issues/complaints', icon: MessageSquare },
    { id: 'portal', name: 'Portal', icon: DoorOpen }
  ];

  const residentNav = [
    { id: 'units', name: 'Units', icon: Building },
    { id: 'correspondence', name: 'Correspondence', icon: Mail }
  ];

  const blockInfoNav = [
    { id: 'block-info', name: 'Block info', icon: Info },
    { id: 'oms', name: 'O&Ms', icon: FileText }
  ];

  const settingsNav = [
    { id: 'block-settings', name: 'Block settings', icon: Settings }
  ];

  // H&S items with complete sub-structure
  const hsItems = [
    { 
      id: 'asbestos', 
      name: 'Asbestos survey',
      subItems: [
        { id: 'survey', name: 'Survey' },
        { id: 'remedials', name: 'Remedials' }
      ]
    },
    { 
      id: 'combined-fire', 
      name: 'Combined fire/general',
      subItems: [
        { id: 'survey', name: 'Survey' },
        { id: 'remedials', name: 'Remedials' }
      ]
    },
    { 
      id: 'dry-riser', 
      name: 'Dry riser(s)',
      subItems: [
        { id: 'annual-test', name: 'Annual pressure test' },
        { id: 'monthly-inspections', name: '6-monthly inspections' },
        { id: 'callouts', name: 'Callouts' }
      ]
    },
    { 
      id: 'eicr', 
      name: 'EICR (communal)',
      subItems: [
        { id: 'inspection', name: 'Inspection' },
        { id: 'remedials', name: 'Remedials' }
      ]
    },
    { 
      id: 'fire-alarm', 
      name: 'Fire alarm',
      subItems: [
        { id: 'weekly-test', name: 'Weekly test' },
        { id: 'annual-service', name: 'Annual service' }
      ]
    },
    { 
      id: 'fire-risk', 
      name: 'Fire risk assessment',
      subItems: [
        { id: 'assessment', name: 'Assessment' },
        { id: 'remedials', name: 'Remedials' }
      ]
    },
    { 
      id: 'general-hs', 
      name: 'General H&S assessment',
      subItems: [
        { id: 'assessment', name: 'Assessment' },
        { id: 'remedials', name: 'Remedials' }
      ]
    }
  ];

  // Utilities
  const utilityItems = [
    { id: 'electricity-comm', name: 'Electricity (comm)', fullName: 'Electricity (communal) meter read' },
    { id: 'water-comm', name: 'Water (comm)', fullName: 'Water (communal) meter read' },
    { id: 'gas-comm', name: 'Gas (comm)', fullName: 'Gas (communal) meter read' }
  ];

  // Insurance categories
  const insuranceCategories = {
    policy: [
      { id: 'building', name: 'Building insurance' },
      { id: 'terrorism-1', name: 'Terrorism insurance' }
    ],
    other: [
      { id: 'reinstatement', name: 'Reinstatement cost assessment' }
    ],
    claims: []
  };

  // Insurance claim workflow
  const claimWorkflow = [
    { id: 'notify', name: 'Notify insurer/ broker', badge: 1 },
    { id: 'identify', name: 'Identify source', badge: 1 },
    { id: 'fix', name: 'Fix source', badge: 1 },
    { id: 'compile', name: 'Compile quotes', badge: 1 },
    { id: 'send', name: 'Send quotes to insurer', badge: 1 },
    { id: 'approved', name: 'Quotes approved', badge: 1 },
    { id: 'instructed', name: 'Remedials instructed', badge: 1 },
    { id: 'complete', name: 'Remedials complete', badge: 1 },
    { id: 'received', name: 'Invoice(s) received', badge: 1 },
    { id: 'submitted', name: 'Invoice(s) submitted', badge: 1 },
    { id: 'funds', name: 'Funds received', badge: 1 },
    { id: 'settled', name: 'Invoice(s) settled', badge: 1 }
  ];

  // Documents categories
  const documentCategories = [
    {
      section: 'Fire Safety (England) Regulations 2022',
      items: [
        { id: 'fire-doors', name: 'Fire doors (annual advice)' },
        { id: 'fire-instructions', name: 'Fire safety instructions' }
      ]
    }
  ];

  // Block settings assets
  const blockAssets = [
    { id: 'aov', name: 'AOV(s)', active: false },
    { id: 'asbestos', name: 'Asbestos survey', active: true },
    { id: 'bin-chute', name: 'Bin chute', active: false },
    { id: 'building-condition', name: 'Building condition survey', active: false },
    { id: 'car-park', name: 'Car park ventilation system', active: false },
    { id: 'combined-risk', name: 'Risk assessment (combined fire/general H&S)', active: true },
    { id: 'compartmentation', name: 'Compartmentation survey', active: false },
    { id: 'disabled-refuge', name: 'Disabled refuge system', active: false },
    { id: 'dry-riser', name: 'Dry riser(s)', active: true },
    { id: 'dsear', name: 'DSEAR Risk Assessment', active: false },
    { id: 'edge-protection', name: 'Edge protection', active: false },
    { id: 'eicr', name: 'EICR (communal)', active: true },
    { id: 'emergency-lighting', name: 'Emergency lighting', active: false },
    { id: 'fire-alarm', name: 'Fire alarm', active: true },
    { id: 'fire-doors', name: 'Fire doors', active: false },
    { id: 'fire-extinguishers', name: 'Fire extinguishers', active: false },
    { id: 'fire-risk', name: 'Fire risk assessment', active: true },
    { id: 'general-hs', name: 'General H&S assessment', active: true }
  ];

  // Issues/Complaints
  const issuesItems = [];

  useEffect(() => {
    async function loadData() {
      try {
        // Blocks and block data load at the same time, not one after the other
        const [blocksResult, dataPrefetch] = await Promise.all([
          window.storage.get('bps_pro_blocks'),
          window.storage.get('bps_pro_block_data'),
        ]);
        
        if (blocksResult) {
          const loadedBlocks = JSON.parse(blocksResult.value);
          setBlocks(loadedBlocks);
          setShowAllBlocks(true);
          setActiveSection('home');
          
          const dataResult = dataPrefetch;
          if (dataResult) {
            const loadedData = JSON.parse(dataResult.value);
            setBlockData(loadedData);
            // Move any files still stored inside the data into Storage, after the page has loaded
            setTimeout(() => migrateLegacyFiles(loadedData), 3000);
          } else {
            const initialData = {};
            loadedBlocks.forEach(block => {
              initialData[block.id] = {
                tasks: [],
                documents: [],
                hsItems: [],
                utilities: [],
                insurance: [],
                issues: []
              };
            });
            setBlockData(initialData);
            await window.storage.set('bps_pro_block_data', JSON.stringify(initialData));
          }
        } else {
          const sampleBlocks = [
            { 
              id: '1', 
              name: 'Jack Hardy Close - Castledine Court (Demo Block)',
              shortName: 'Jack Hardy Clo',
              address: 'Demo Street, DEM 01',
              height: 'Under 11m',
              evacuationStrategy: 'stay-put',
              managingAgent: {
                name: 'Block Property Solutions',
                address: 'Mansfield Innovation Centre, Hamilton Way, Mansfield, Nottinghamshire, NG18 5BR',
                manager: 'Keanu Billones',
                email: 'keanu@blockpropertysolutions.co.uk'
              }
            },
            { 
              id: '2', 
              name: 'Riverside Apartments - Building A',
              shortName: 'Riverside Apt',
              address: '123 River Road, London, SW1A 1AA',
              height: '11m - 18m',
              evacuationStrategy: 'stay-put',
              managingAgent: {
                name: 'Block Property Solutions',
                address: 'Mansfield Innovation Centre, Hamilton Way, Mansfield, Nottinghamshire, NG18 5BR',
                manager: 'Keanu Billones',
                email: 'keanu@blockpropertysolutions.co.uk'
              }
            },
            { 
              id: '3', 
              name: 'Oak Tree Gardens - Phase 1',
              shortName: 'Oak Tree Gdn',
              address: '45 Oak Street, Manchester, M1 1AA',
              height: 'Under 11m',
              evacuationStrategy: 'simultaneous',
              managingAgent: {
                name: 'Block Property Solutions',
                address: 'Mansfield Innovation Centre, Hamilton Way, Mansfield, Nottinghamshire, NG18 5BR',
                manager: 'Keanu Billones',
                email: 'keanu@blockpropertysolutions.co.uk'
              }
            }
          ];
          setBlocks(sampleBlocks);
          setShowAllBlocks(true);
          setActiveSection('home');
          
          const initialData = {};
          sampleBlocks.forEach(block => {
            initialData[block.id] = {
              tasks: [],
              documents: [],
              hsItems: [],
              utilities: [],
              insurance: [],
              issues: []
            };
          });
          setBlockData(initialData);
          
          await window.storage.set('bps_pro_blocks', JSON.stringify(sampleBlocks));
          await window.storage.set('bps_pro_block_data', JSON.stringify(initialData));
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMainNav) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showMainNav]);

  // Automatic backup system - runs every 12 hours
  // Backup list: names and dates only. A full backup is loaded only when restoring one.
  useEffect(() => { loadBackups(); }, []);

  useEffect(() => {
    // Set up automatic backup every 12 hours
    const backupInterval = setInterval(() => {
      console.log('🔄 Running automatic 12-hour backup...');
      saveBackupToSupabase(`Auto Backup - ${new Date().toLocaleString()}`);
      cleanupOldBackups();
    }, 12 * 60 * 60 * 1000); // 12 hours in milliseconds

    return () => clearInterval(backupInterval);
  }, [blocks, blockData]);

  const renderSubNav = () => {
    if (activeSection === 'hs') return hsItems;
    if (activeSection === 'utilities') return utilityItems;
    if (activeSection === 'documents') return documentCategories[0].items;
    if (activeSection === 'issues') return issuesItems;
    
    if (activeSection === 'insurance') {
      const items = [];
      insuranceCategories.policy.forEach(i => items.push({ ...i, category: 'Policy documents' }));
      insuranceCategories.other.forEach(i => items.push({ ...i, category: 'Other' }));
      insuranceCategories.claims.forEach(i => items.push({ ...i, category: 'Claims' }));
      return items;
    }
    return [];
  };

  const renderContent = () => {
    const currentBlock = blocks.find(b => b.id === selectedBlock);

    // HOME - ALL BLOCKS VIEW
    if (activeSection === 'home' || showAllBlocks) {
      return (
        <div className="p-4 md:p-8">
          <div className="max-w-6xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">All blocks</h2>
                {totalTasksAllBlocks > 0 && (
                  <span className="bg-red-500 text-white text-sm px-2.5 py-1 rounded-full font-medium">
                    {totalTasksAllBlocks}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setClearOpen(true)}
                  className="border border-red-500 text-red-500 px-4 py-2.5 rounded-lg hover:bg-red-50 text-sm placeholder:text-slate-500 font-medium w-full sm:w-auto"
                >
                  Archive my blocks
                </button>
                <button 
                  onClick={() => {
                    setModalType('add-block');
                    setShowModal(true);
                  }}
                  className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add new block
                </button>
                <button
                  onClick={() => setShowChooser(true)}
                  className="border border-slate-300 text-slate-900 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-sm font-medium w-full sm:w-auto"
                >
                  Choose blocks
                </button>
                <button
                  onClick={openArchived}
                  className="border border-slate-300 text-slate-900 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-sm font-medium w-full sm:w-auto"
                >
                  Archived blocks
                </button>
                <button
                  onClick={() => { setHistoryRows([]); setHistoryFor({ blockId: null, title: 'All blocks' }); }}
                  className="border border-slate-300 text-slate-900 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-sm font-medium w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <History className="w-4 h-4" />
                  History
                </button>
              </div>
            </div>

            {plannerNotice && (
              <div className="mb-4 text-sm bg-blue-50 border border-blue-200 text-slate-900 rounded-lg px-4 py-3 flex items-start justify-between gap-3">
                <span>{plannerNotice}</span>
                <button onClick={() => setPlannerNotice('')} className="text-slate-500 hover:text-slate-900" aria-label="Dismiss">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {plannerConnected === false && (
              <div className="mb-6 bg-white border border-slate-200 rounded-xl px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">Connect your Microsoft 365 account</p>
                  <p className="text-sm text-slate-700">Your Planner tasks will show here. You only see the plans your own Microsoft account can access.</p>
                </div>
                <button
                  onClick={async () => {
                    try { await connectMicrosoft(); } catch (e) { setPlannerNotice(e.message); }
                  }}
                  className="bps-blue px-4 py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
                >
                  Connect Microsoft
                </button>
              </div>
            )}
            {plannerConnected === true && (
              <div className="mb-6 text-right">
                <button
                  onClick={async () => {
                    if (!confirm('Disconnect your Microsoft 365 account? Planner tasks will stop showing.')) return;
                    try {
                      await disconnectMicrosoft();
                      setPlannerConnected(false);
                      setPlannerStatus({});
                      setPlannerItems({});
                    } catch (e) { setPlannerNotice(e.message); }
                  }}
                  className="text-sm text-slate-700 underline hover:text-slate-900"
                >
                  Disconnect Microsoft 365
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {visibleBlocks.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500">
                  <Building className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg text-slate-900 mb-2">{blocks.length === 0 ? 'No blocks yet' : 'No blocks on your dashboard'}</p>
                  <p className="text-sm text-slate-900">{blocks.length === 0 ? 'Click "Add new block" to get started' : 'Click "Choose blocks" to pick which blocks to show'}</p>
                </div>
              ) : (
                visibleBlocks.map(block => {
                const currentBlockData = blockData[block.id] || { tasks: [], issues: [] };
                const taskCount = countDueTasks(currentBlockData.tasks) + plannerDueCount(block.id) + (currentBlockData.issues?.length || 0);
                
                return (
                  <div
                    key={block.id}
                    className="bg-white border-2 border-slate-200 rounded-lg p-4 md:p-6 hover:bps-blue-border hover:shadow-lg transition-all relative"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setManyShown([block], false); }}
                      title="Hide from my dashboard"
                      className="absolute top-3 right-20 text-slate-500 hover:bg-slate-100 p-2 rounded"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setHistoryRows([]); setHistoryFor({ blockId: block.id, title: block.shortName || block.name }); }}
                      title="View change history"
                      className="absolute top-3 right-12 text-slate-500 hover:bg-slate-100 p-2 rounded"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (block.created_by !== currentUserId) {
                          setPlannerNotice('Only the person who created this block can delete it. Use the eye button to hide it from your dashboard.');
                          return;
                        }
                        if (confirm(`Archive ${block.name}? It will be hidden from every user, including you. You can restore it from Archived blocks within 30 days.`)) {
                          await window.storage.archiveBlock(block.id);
                          const updatedBlocks = blocks.filter(b => b.id !== block.id);
                          setBlocks(updatedBlocks);
                          
                          const updatedBlockData = { ...blockData };
                          delete updatedBlockData[block.id];
                          setBlockData(updatedBlockData);
                          
                          await window.storage.set('bps_pro_blocks', JSON.stringify(updatedBlocks));
                          await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                        }
                      }}
                      className="absolute top-3 right-3 text-red-500 hover:bg-red-50 p-2 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedBlock(block.id);
                        setShowAllBlocks(false);
                        setActiveSection('all-tasks');
                        setActiveSubItem(null);
                        setActiveSubSubItem(null);
                        setActiveClaim(null);
                        setActiveTab('home');
                      }}
                      className="w-full text-left"
                    >
                    <div className="flex items-start gap-3 md:gap-4 mb-4">
                      <div className="w-12 h-12 md:w-16 md:h-16 bps-blue-bg-circle rounded-full flex items-center justify-center flex-shrink-0">
                        <Building className="w-6 h-6 md:w-8 md:h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-base md:text-lg mb-1 truncate">{block.shortName || block.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2">{block.address}</p>
                        <p className="text-[11px] text-slate-500/70 mt-1">Created by {creatorName(block)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                      {/* Small badge: green checkmark if all done, red count if incomplete */}
                      {taskCount > 0 && (
                        areAllTasksCompleted(block.id) ? (
                          <div className="flex-shrink-0 bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                            {taskCount}
                          </div>
                        )
                      )}
                    </div>
                    <div className="mt-2">
                      <PlannerStatus item={plannerStatus[block.id]} />
                    </div>
                    </button>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      );
    }

    // ALL TASKS
    if (activeSection === 'all-tasks') {
      const currentBlockData = blockData[selectedBlock] || { tasks: [], setups: {} };
      const allTasks = currentBlockData.tasks || [];
      const today = new Date().toISOString().split('T')[0];
      
      const upcomingTasks = allTasks.filter(t => 
        !t.completed && 
        t.dueDate && 
        t.dueDate >= today &&
        t.priority !== 'High'
      );
      
      const overdueOrHighPriorityTasks = allTasks.filter(t => 
        !t.completed && 
        ((t.dueDate && t.dueDate < today) || t.priority === 'High')
      );
      
      const setups = currentBlockData.setups || {};
      const allSetupKeys = [];
      
      hsItems.forEach(item => {
        if (item.subItems) {
          item.subItems.forEach(sub => {
            allSetupKeys.push(`hs-${item.id}-${sub.id}`);
          });
        }
      });
      utilityItems.forEach(item => {
        allSetupKeys.push(`utilities-${item.id}`);
      });
      [...insuranceCategories.policy, ...insuranceCategories.other].forEach(item => {
        allSetupKeys.push(`insurance-${item.id}`);
      });
      documentCategories[0].items.forEach(item => {
        allSetupKeys.push(`documents-${item.id}`);
      });
      
      const setupRequiredCount = allSetupKeys.filter(key => !setups[key]?.completed).length;
      
      const getSetupItemName = (key) => {
        const parts = key.split('-');
        const section = parts[0];
        const itemId = parts.slice(1).join('-');
        let itemName = '';
        let sectionName = '';
        
        if (section === 'hs') {
          sectionName = 'H&S';
          const parentItem = hsItems.find(h => itemId.startsWith(h.id + '-'));
          if (parentItem) {
            const subItemId = itemId.substring(parentItem.id.length + 1);
            const sub = parentItem.subItems?.find(s => s.id === subItemId);
            itemName = `${parentItem.name} → ${sub?.name || subItemId}`;
          }
        } else if (section === 'utilities') {
          sectionName = 'Utilities';
          const item = utilityItems.find(u => u.id === itemId);
          itemName = item?.fullName || itemId;
        } else if (section === 'insurance') {
          sectionName = 'Insurance';
          const allInsurance = [...insuranceCategories.policy, ...insuranceCategories.other];
          const item = allInsurance.find(i => i.id === itemId);
          itemName = item?.name || itemId;
        } else if (section === 'documents') {
          sectionName = 'Documents';
          const item = documentCategories[0].items.find(d => d.id === itemId);
          itemName = item?.name || itemId;
        }
        return { itemName, sectionName, section, itemId };
      };
      
      const overdueSetups = Object.entries(setups)
        .filter(([key, setup]) => setup.completed && setup.nextDue && setup.nextDue < today)
        .map(([key, setup]) => {
          const { itemName, sectionName, section, itemId } = getSetupItemName(key);
          return {
            id: `setup-${key}`,
            key,
            section,
            itemId,
            title: itemName,
            sectionName,
            dueDate: setup.nextDue,
            isOverdueSetup: true
          };
        });
      
      const allOverdueItems = [
        ...overdueOrHighPriorityTasks,
        ...overdueSetups
      ];
      
      let filteredTasks = allTasks;
      if (taskFilter === 'upcoming') {
        filteredTasks = upcomingTasks;
      } else if (taskFilter === 'overdue') {
        filteredTasks = allOverdueItems;
      } else if (taskFilter === 'setup') {
        filteredTasks = [];
      }
      
      if (taskSearch) {
        filteredTasks = filteredTasks.filter(t => 
          t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(taskSearch.toLowerCase())) ||
          (t.category && t.category.toLowerCase().includes(taskSearch.toLowerCase()))
        );
      }

      return (
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">All tasks</h2>
            <button 
              onClick={() => {
                setEditingTaskId(null);
                setModalType('add-task');
                setShowModal(true);
              }}
              className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              New task
            </button>
          </div>
          
          <div className="flex gap-3 md:gap-6 mb-4 md:mb-6 border-b overflow-x-auto pb-0">
            <button 
              onClick={() => setTaskFilter('all')}
              className={`pb-3 px-1 text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                taskFilter === 'all' ? 'border-b-2 bps-blue-border font-medium bps-blue-text' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setTaskFilter('upcoming')}
              className={`pb-3 px-1 text-xs md:text-sm flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                taskFilter === 'upcoming' ? 'border-b-2 bps-blue-border font-medium bps-blue-text' : 'text-slate-600'
              }`}
            >
              Upcoming
              {upcomingTasks.length > 0 && (
                <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {upcomingTasks.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setTaskFilter('overdue')}
              className={`pb-3 px-1 text-xs md:text-sm flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                taskFilter === 'overdue' ? 'border-b-2 bps-blue-border font-medium bps-blue-text' : 'text-slate-600'
              }`}
            >
              Overdue
              {allOverdueItems.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {allOverdueItems.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setTaskFilter('setup')}
              className={`pb-3 px-1 text-xs md:text-sm flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                taskFilter === 'setup' ? 'border-b-2 bps-blue-border font-medium bps-blue-text' : 'text-slate-600'
              }`}
            >
              Set-up
              {setupRequiredCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {setupRequiredCount}
                </span>
              )}
            </button>
          </div>
          
          <div className="mb-4 md:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                type="text" 
                placeholder="Search" 
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm placeholder:text-slate-500" 
              />
            </div>
          </div>
          
          {taskFilter !== 'setup' && (plannerItems[selectedBlock] || []).length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">From Microsoft Planner</p>
              <div className="space-y-2">
                {(plannerItems[selectedBlock] || [])
                  .filter(t => !taskSearch || t.title.toLowerCase().includes(taskSearch.toLowerCase()))
                  .map(t => (
                    <a key={t.id} href={t.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 border border-slate-200 rounded-lg px-4 py-3 bg-white hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${t.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</p>
                        <p className="text-xs text-slate-500">{t.planTitle}{t.dueDate ? ` · due ${t.dueDate}` : ' · no due date'}</p>
                      </div>
                      <span className={`text-xs font-medium whitespace-nowrap ${
                        t.done ? 'text-green-700' : t.daysLeft === null ? 'text-slate-500' : t.daysLeft < 0 ? 'text-red-600' : t.daysLeft <= 14 ? 'text-amber-600' : 'text-slate-600'
                      }`}>
                        {t.done ? 'Done' : t.daysLeft === null ? 'No date' : t.daysLeft < 0 ? `${-t.daysLeft} day${-t.daysLeft === 1 ? '' : 's'} overdue` : `${t.daysLeft} day${t.daysLeft === 1 ? '' : 's'} left`}
                      </span>
                    </a>
                  ))}
              </div>
            </div>
          )}

          {taskFilter === 'setup' ? (
            setupRequiredCount === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
                <p className="font-medium text-slate-900">All items are set up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 mb-4">The following items require setup:</p>
                {allSetupKeys.filter(key => !setups[key]?.completed).map(key => {
                  const parts = key.split('-');
                  const section = parts[0];
                  const itemId = parts.slice(1).join('-');
                  
                  let itemName = '';
                  let sectionName = '';
                  
                  if (section === 'hs') {
                    sectionName = 'H&S';
                    const subParts = itemId.split('-');
                    const parentItem = hsItems.find(h => itemId.startsWith(h.id + '-'));
                    if (parentItem) {
                      const subItemId = itemId.substring(parentItem.id.length + 1);
                      const sub = parentItem.subItems?.find(s => s.id === subItemId);
                      itemName = `${parentItem.name} → ${sub?.name || subItemId}`;
                    }
                  } else if (section === 'utilities') {
                    sectionName = 'Utilities';
                    const item = utilityItems.find(u => u.id === itemId);
                    itemName = item?.fullName || itemId;
                  } else if (section === 'insurance') {
                    sectionName = 'Insurance';
                    const allInsurance = [...insuranceCategories.policy, ...insuranceCategories.other];
                    const item = allInsurance.find(i => i.id === itemId);
                    itemName = item?.name || itemId;
                  } else if (section === 'documents') {
                    sectionName = 'Documents';
                    const item = documentCategories[0].items.find(d => d.id === itemId);
                    itemName = item?.name || itemId;
                  }
                  
                  if (taskSearch && !itemName.toLowerCase().includes(taskSearch.toLowerCase())) {
                    return null;
                  }
                  
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        if (section === 'hs') {
                          const parentItem = hsItems.find(h => itemId.startsWith(h.id + '-'));
                          if (parentItem) {
                            setActiveSection('hs');
                            setActiveSubItem(parentItem);
                            const subItemId = itemId.substring(parentItem.id.length + 1);
                            const sub = parentItem.subItems?.find(s => s.id === subItemId);
                            if (sub) setActiveSubSubItem(sub);
                          }
                        } else if (section === 'utilities') {
                          const item = utilityItems.find(u => u.id === itemId);
                          if (item) {
                            setActiveSection('utilities');
                            setActiveSubItem(item);
                          }
                        } else if (section === 'insurance') {
                          const allInsurance = [
                            ...insuranceCategories.policy.map(i => ({...i, category: 'Policy documents'})),
                            ...insuranceCategories.other.map(i => ({...i, category: 'Other'}))
                          ];
                          const item = allInsurance.find(i => i.id === itemId);
                          if (item) {
                            setActiveSection('insurance');
                            setActiveSubItem(item);
                          }
                        } else if (section === 'documents') {
                          const item = documentCategories[0].items.find(d => d.id === itemId);
                          if (item) {
                            setActiveSection('documents');
                            setActiveSubItem(item);
                          }
                        }
                        setActiveTab('home');
                      }}
                      className="bg-white border rounded-lg p-4 flex items-center justify-between w-full text-left hover:bps-blue-border hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 group-hover:bps-blue-text truncate">{itemName}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{sectionName}</span>
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">Set-up required</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bps-blue-text text-sm font-medium ml-4 flex-shrink-0">
                        <span className="hidden sm:inline">Set up</span>
                        <span className="text-lg text-slate-900">→</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-2">⏳</div>
              <div>{taskSearch ? 'No tasks match your search' : 'None'}</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => {
                if (task.isOverdueSetup) {
                  return (
                    <button
                      key={task.id}
                      onClick={() => {
                        if (task.section === 'hs') {
                          const parentItem = hsItems.find(h => task.itemId.startsWith(h.id + '-'));
                          if (parentItem) {
                            setActiveSection('hs');
                            setActiveSubItem(parentItem);
                            const subItemId = task.itemId.substring(parentItem.id.length + 1);
                            const sub = parentItem.subItems?.find(s => s.id === subItemId);
                            if (sub) setActiveSubSubItem(sub);
                          }
                        } else if (task.section === 'utilities') {
                          const item = utilityItems.find(u => u.id === task.itemId);
                          if (item) {
                            setActiveSection('utilities');
                            setActiveSubItem(item);
                          }
                        } else if (task.section === 'insurance') {
                          const allInsurance = [
                            ...insuranceCategories.policy.map(i => ({...i, category: 'Policy documents'})),
                            ...insuranceCategories.other.map(i => ({...i, category: 'Other'}))
                          ];
                          const item = allInsurance.find(i => i.id === task.itemId);
                          if (item) {
                            setActiveSection('insurance');
                            setActiveSubItem(item);
                          }
                        } else if (task.section === 'documents') {
                          const item = documentCategories[0].items.find(d => d.id === task.itemId);
                          if (item) {
                            setActiveSection('documents');
                            setActiveSubItem(item);
                          }
                        }
                        setActiveTab('home');
                      }}
                      className="bg-white border-2 border-red-200 rounded-lg p-4 flex items-center justify-between w-full text-left hover:bps-blue-border hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-red-700 group-hover:text-blue-600 truncate">⚠️ {task.title}</div>
                        <div className="flex items-center gap-2 md:gap-3 mt-2 text-xs flex-wrap">
                          <span className="flex items-center gap-1 text-red-500 whitespace-nowrap">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            {task.sectionName}
                          </span>
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Overdue
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bps-blue-text text-sm font-medium ml-4 flex-shrink-0">
                        <span className="hidden sm:inline">Review</span>
                        <span className="text-lg text-slate-900">→</span>
                      </div>
                    </button>
                  );
                }
                
                const isOverdue = task.dueDate && task.dueDate < today && !task.completed;
                return (
                  <div 
                    key={task.id} 
                    className={`bg-white border rounded-lg p-4 flex items-start gap-3 md:gap-4 ${
                      task.completed ? 'opacity-50' : ''
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={task.completed || false}
                      onChange={async () => {
                        const updatedTasks = allTasks.map(t => 
                          t.id === task.id ? { ...t, completed: !t.completed } : t
                        );
                        const updatedBlockData = {
                          ...blockData,
                          [selectedBlock]: {
                            ...currentBlockData,
                            tasks: updatedTasks
                          }
                        };
                        setBlockData(updatedBlockData);
                        await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                      }}
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-slate-900 ${task.completed ? 'line-through' : ''} break-words`}>{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-slate-600 mt-1 break-words">{task.description}</div>
                      )}
                      <div className="flex items-center gap-2 md:gap-3 mt-2 text-xs flex-wrap">
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 whitespace-nowrap ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full whitespace-nowrap ${
                          task.priority === 'High' ? 'bg-red-100 text-red-700' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {task.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingTaskId(task.id);
                        setNewTaskForm({
                          title: task.title || '',
                          dueDate: task.dueDate || '',
                          priority: task.priority || 'Medium',
                          category: task.category || 'General',
                          description: task.description || ''
                        });
                        setModalType('add-task');
                        setShowModal(true);
                      }}
                      className="text-slate-500 hover:bg-slate-100 p-2 rounded flex-shrink-0"
                      title="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this task?')) {
                          const updatedTasks = allTasks.filter(t => t.id !== task.id);
                          const updatedBlockData = {
                            ...blockData,
                            [selectedBlock]: {
                              ...currentBlockData,
                              tasks: updatedTasks
                            }
                          };
                          setBlockData(updatedBlockData);
                          await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                        }
                      }}
                      className="text-red-500 hover:bg-red-50 p-2 rounded flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // BLOCK INFO - COMPLETE
    if (activeSection === 'block-info') {
      return (
        <div className="p-4 md:p-8">
          <div className="max-w-4xl">
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="w-20 h-20 md:w-32 md:h-32 bps-blue-bg-circle rounded-full flex items-center justify-center flex-shrink-0">
                <Building className="w-10 h-10 md:w-16 md:h-16 text-white" />
              </div>
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row items-start justify-between mb-2 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 break-words">{currentBlock?.shortName || currentBlock?.name}</h2>
                      {/* Task count badge */}
                      {(() => {
                        const totalTasks = getTotalTasksForBlock(selectedBlock);
                        if (totalTasks > 0) {
                          return (
                            <div className="flex-shrink-0 bg-red-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold">
                              {totalTasks}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <p className="text-sm md:text-base text-slate-600 mb-3">Also known as {currentBlock?.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditBlockForm({
                        name: currentBlock?.name || '',
                        shortName: currentBlock?.shortName || '',
                        alsoKnownAs: currentBlock?.name || '',
                        address: currentBlock?.address || '',
                        height: currentBlock?.height || 'Under 11m'
                      });
                      setModalType('edit-block');
                      setShowModal(true);
                    }}
                    className="bps-blue-text text-sm hover:underline flex items-center gap-1 whitespace-nowrap"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                </div>
                <p className="text-sm text-slate-600 mb-1"><span className="font-medium text-slate-900">Address:</span> {currentBlock?.address}</p>
                <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Height category:</span> {currentBlock?.height}</p>
              </div>
            </div>

            <div className="border-2 border-red-300 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
              <h3 className="font-bold text-slate-900 mb-4 text-base md:text-lg">Evacuation strategy:</h3>
              <div className="space-y-3 mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="evac" 
                    value="simultaneous" 
                    checked={(blockData[selectedBlock]?.evacuationStrategy || currentBlock?.evacuationStrategy) === 'simultaneous'}
                    onChange={async () => {
                      const updatedBlockData = {
                        ...blockData,
                        [selectedBlock]: {
                          ...(blockData[selectedBlock] || {}),
                          evacuationStrategy: 'simultaneous'
                        }
                      };
                      setBlockData(updatedBlockData);
                      await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                    }}
                    className="mt-1 flex-shrink-0" 
                  />
                  <span className="text-sm md:text-base text-slate-900">Simultaneous</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="evac" 
                    value="stay-put" 
                    checked={(blockData[selectedBlock]?.evacuationStrategy || currentBlock?.evacuationStrategy) === 'stay-put'}
                    onChange={async () => {
                      const updatedBlockData = {
                        ...blockData,
                        [selectedBlock]: {
                          ...(blockData[selectedBlock] || {}),
                          evacuationStrategy: 'stay-put'
                        }
                      };
                      setBlockData(updatedBlockData);
                      await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                    }}
                    className="mt-1 flex-shrink-0" 
                  />
                  <div>
                    <div className="font-medium text-slate-900 text-sm md:text-base">Stay put</div>
                    <div className="text-xs md:text-sm text-slate-600 mt-1">
                      (Also called defend in place) Residents in flats not directly affected by the fire remain in their own homes
                      unless instructed otherwise by the fire and rescue service (FRS) or they feel unsafe.
                      <br /><br />
                      Only the occupants of the flat where the fire started (or anyone in the common parts) evacuate
                      immediately, close doors behind them, and call 999.
                      <br /><br />
                      Residents in other flats are expected to stay put, close doors and windows, and wait for FRS advice.
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="evac" 
                    value="phased"
                    checked={(blockData[selectedBlock]?.evacuationStrategy || currentBlock?.evacuationStrategy) === 'phased'}
                    onChange={async () => {
                      const updatedBlockData = {
                        ...blockData,
                        [selectedBlock]: {
                          ...(blockData[selectedBlock] || {}),
                          evacuationStrategy: 'phased'
                        }
                      };
                      setBlockData(updatedBlockData);
                      await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                    }}
                    className="mt-1 flex-shrink-0" 
                  />
                  <span className="text-sm md:text-base text-slate-900">Phased</span>
                </label>
              </div>
              <button 
                onClick={() => alert('Evacuation strategy saved successfully!')}
                className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
              >
                Set evacuation strategy
              </button>
            </div>

            <div className="border-2 border-red-300 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
              <h3 className="font-bold text-slate-900 mb-4 text-base md:text-lg">Responsible Person (RP)</h3>
              {(blockData[selectedBlock]?.responsiblePersons || []).length > 0 && (
                <div className="space-y-2 mb-4">
                  {(blockData[selectedBlock]?.responsiblePersons || []).map((rp, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 text-sm md:text-base truncate">{rp.name}</div>
                        <div className="text-xs text-slate-600">{rp.role}</div>
                        <div className="text-xs text-slate-500 break-words">{rp.email} • {rp.phone}</div>
                      </div>
                      <button 
                        onClick={async () => {
                          if (confirm(`Remove ${rp.name}?`)) {
                            const updatedRPs = (blockData[selectedBlock]?.responsiblePersons || []).filter((_, i) => i !== idx);
                            const updatedBlockData = {
                              ...blockData,
                              [selectedBlock]: {
                                ...(blockData[selectedBlock] || {}),
                                responsiblePersons: updatedRPs
                              }
                            };
                            setBlockData(updatedBlockData);
                            await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button 
                onClick={() => {
                  setModalType('add-rp');
                  setShowModal(true);
                }}
                className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
              >
                Add
              </button>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <h3 className="font-bold text-slate-900 text-base md:text-lg">Managing agent</h3>
                <button
                  onClick={() => {
                    setEditAgentForm({
                      name: currentBlock?.managingAgent?.name || '',
                      address: currentBlock?.managingAgent?.address || '',
                      manager: currentBlock?.managingAgent?.manager || '',
                      email: currentBlock?.managingAgent?.email || ''
                    });
                    setModalType('edit-agent');
                    setShowModal(true);
                  }}
                  className="bps-blue-text text-sm hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              </div>
              <p className="text-sm mb-1 break-words"><span className="font-medium text-slate-900">Managing agent:</span> {currentBlock?.managingAgent?.name}</p>
              <p className="text-sm mb-1 break-words"><span className="font-medium text-slate-900">Address:</span> {currentBlock?.managingAgent?.address}</p>
              <p className="text-sm mb-1 break-words"><span className="font-medium text-slate-900">Property manager:</span> {currentBlock?.managingAgent?.manager}</p>
              <p className="text-sm break-words"><span className="font-medium text-slate-900">Email:</span> {currentBlock?.managingAgent?.email}</p>
            </div>
          </div>
        </div>
      );
    }

    // BLOCK SETTINGS - COMPLETE
    if (activeSection === 'block-settings') {
      return (
        <div className="p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Settings</h2>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="w-full lg:w-64">
              <p className="text-xs uppercase text-slate-600 mb-3">Select</p>
              <button 
                onClick={() => setSettingsTab('assets')}
                className={`flex items-center gap-2 w-full px-4 py-2.5 rounded mb-2 text-sm ${
                  settingsTab === 'assets' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                Add/ remove assets
              </button>
              <button 
                onClick={() => setSettingsTab('auto-chase')}
                className={`flex items-center gap-2 w-full px-4 py-2.5 rounded mb-2 text-sm ${
                  settingsTab === 'auto-chase' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Contractor auto-chase
              </button>
              <button 
                onClick={() => setSettingsTab('resident')}
                className={`flex items-center gap-2 w-full px-4 py-2.5 rounded mb-2 text-sm ${
                  settingsTab === 'resident' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Resident settings
              </button>
              <button 
                onClick={() => setSettingsTab('site-staff')}
                className={`flex items-center gap-2 w-full px-4 py-2.5 rounded mb-2 text-sm ${
                  settingsTab === 'site-staff' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Site staff
              </button>
            </div>
            <div className="flex-1">
              {settingsTab === 'assets' && (
                <>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Add/ remove assets</h3>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        type="text" 
                        placeholder="Search" 
                        className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm placeholder:text-slate-500" 
                      />
                    </div>
                  </div>
                  <h4 className="font-medium text-slate-900 mb-3 text-sm md:text-base">Service and maintenance (H&S items)</h4>
                  <div className="space-y-2">
                    {blockAssets
                      .filter(asset => asset.name.toLowerCase().includes(assetSearch.toLowerCase()))
                      .map(asset => {
                        const blockAssetState = blockData[selectedBlock]?.assets?.[asset.id];
                        const isActive = blockAssetState !== undefined ? blockAssetState : asset.active;
                        return (
                          <div key={asset.id} className="flex items-center justify-between py-2 border-b gap-3">
                            <span className="text-sm text-slate-900 flex-1 min-w-0 break-words">{asset.name}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isActive ? (
                                <>
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                  <button 
                                    onClick={async () => {
                                      const updatedBlockData = {
                                        ...blockData,
                                        [selectedBlock]: {
                                          ...(blockData[selectedBlock] || {}),
                                          assets: {
                                            ...(blockData[selectedBlock]?.assets || {}),
                                            [asset.id]: false
                                          }
                                        }
                                      };
                                      setBlockData(updatedBlockData);
                                      await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                                    }}
                                    className="text-red-500 text-xs hover:underline whitespace-nowrap"
                                  >
                                    Deactivate
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={async () => {
                                      const updatedBlockData = {
                                        ...blockData,
                                        [selectedBlock]: {
                                          ...(blockData[selectedBlock] || {}),
                                          assets: {
                                            ...(blockData[selectedBlock]?.assets || {}),
                                            [asset.id]: true
                                          }
                                        }
                                      };
                                      setBlockData(updatedBlockData);
                                      await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                                    }}
                                    className="bps-blue-text text-sm hover:underline whitespace-nowrap"
                                  >
                                    + Activate
                                  </button>
                                  <span className="text-slate-400 text-sm">or</span>
                                  <span className="text-slate-400 text-sm">n/a</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
              
              {settingsTab === 'auto-chase' && (
                <>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Contractor auto-chase</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Automated email chasers sent to the contractor/ supplier for upcoming or overdue actions.
                  </p>
                  <div className="text-slate-500">No contractors configured yet</div>
                </>
              )}
              
              {settingsTab === 'resident' && (
                <>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Resident settings</h3>
                  <p className="text-sm text-slate-600 mb-4">Configure resident communication preferences.</p>
                  <div className="text-slate-500">Coming soon</div>
                </>
              )}
              
              {settingsTab === 'site-staff' && (
                <>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Site staff</h3>
                  <p className="text-sm text-slate-600 mb-4">Manage site staff members.</p>
                  <button 
                    onClick={() => alert('Add site staff coming soon!')}
                    className="bps-blue px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add staff member
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ISSUES/COMPLAINTS - COMPLETE
    if (activeSection === 'issues') {
      const issues = blockData[selectedBlock]?.issues || [];
      return (
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Reported issues/complaints</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button 
                onClick={() => alert('Recipient settings: Configure who receives issue notifications')}
                className="bps-blue-text text-sm hover:underline"
              >
                Recipient settings
              </button>
              <button 
                onClick={() => {
                  setIssueForm({ title: '', description: '', priority: 'Medium', location: '' });
                  setModalType('add-issue');
                  setShowModal(true);
                }}
                className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                New issue or complaint
              </button>
            </div>
          </div>
          {issues.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>No issues reported</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map(issue => (
                <div key={issue.id} className={`bg-white border rounded-lg p-4 ${issue.resolved ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`font-medium text-slate-900 ${issue.resolved ? 'line-through' : ''} break-words`}>{issue.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                          issue.priority === 'High' ? 'bg-red-100 text-red-700' :
                          issue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {issue.priority}
                        </span>
                      </div>
                      {issue.location && <div className="text-xs text-slate-600 mb-2">📍 {issue.location}</div>}
                      <p className="text-sm text-slate-600 break-words">{issue.description}</p>
                      <div className="text-xs text-slate-400 mt-2">Reported: {new Date(issue.createdAt).toLocaleDateString('en-GB')}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={async () => {
                          const updatedIssues = issues.map(i => 
                            i.id === issue.id ? { ...i, resolved: !i.resolved } : i
                          );
                          const updatedBlockData = {
                            ...blockData,
                            [selectedBlock]: {
                              ...(blockData[selectedBlock] || {}),
                              issues: updatedIssues
                            }
                          };
                          setBlockData(updatedBlockData);
                          await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                        }}
                        className={`p-2 rounded ${issue.resolved ? 'text-slate-400' : 'text-green-500 hover:bg-green-50'}`}
                        title={issue.resolved ? 'Reopen' : 'Mark resolved'}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this issue?')) {
                            const updatedIssues = issues.filter(i => i.id !== issue.id);
                            const updatedBlockData = {
                              ...blockData,
                              [selectedBlock]: {
                                ...(blockData[selectedBlock] || {}),
                                issues: updatedIssues
                              }
                            };
                            setBlockData(updatedBlockData);
                            await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <ItemComments blockId={selectedBlock} blockName={blocks.find((b) => b.id === selectedBlock)?.name || ''} itemKey={`issues:${issue.id}`} itemTitle={issue.title} currentUserId={currentUserId} currentEmail={currentEmail} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // H&S, UTILITIES, INSURANCE, DOCUMENTS WITH ITEMS - COMPLETE WITH ALL TABS
    if ((activeSection === 'hs' || activeSection === 'utilities' || activeSection === 'insurance' || activeSection === 'documents') && activeSubItem) {
      const hasTabs = activeSection !== 'insurance';
      const tabs = hasTabs ? ['Home', 'O&Ms', 'Asset register', 'Notes', 'Settings'] : ['Home', 'Settings'];

      return (
        <div className="p-4 md:p-8">
          {/* Tabs */}
          <div className="mb-6 flex gap-3 md:gap-6 border-b overflow-x-auto pb-0">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and'))}
                className={`pb-3 text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and')
                    ? 'border-b-2 border-slate-900 font-medium bps-blue-text'
                    : 'text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Comments on the open H&S or utilities item (a sub-item of H&S is commented on separately) */}
          {(activeSection === 'hs' || activeSection === 'utilities') && (
            <div className="mb-6">
              <ItemComments
                blockId={selectedBlock}
                blockName={blocks.find((b) => b.id === selectedBlock)?.name || ''}
                itemKey={activeSection === 'hs' && activeSubSubItem
                  ? `${activeSection}:${activeSubItem.id}:${activeSubSubItem.id}`
                  : `${activeSection}:${activeSubItem.id}`}
                itemTitle={activeSection === 'hs' && activeSubSubItem
                  ? `${activeSubItem.name} - ${activeSubSubItem.name}`
                  : activeSubItem.name}
                currentUserId={currentUserId}
                currentEmail={currentEmail}
              />
            </div>
          )}

          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div>
              {/* H&S Section */}
              {activeSection === 'hs' && activeSubItem.subItems && !activeSubSubItem && (
                <div className="mb-8">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">{activeSubItem.name}</h2>
                  <div className="space-y-2">
                    {activeSubItem.subItems.map(subItem => (
                      <button
                        key={subItem.id}
                        onClick={() => setActiveSubSubItem(subItem)}
                        className="flex items-center justify-between w-full px-4 py-3 bg-white rounded border hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm text-slate-900">{subItem.name}</span>
                        </div>
                        {subItem.complete && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* H&S Sub-sub-item (actual setup page) */}
              {activeSection === 'hs' && activeSubSubItem && (() => {
                const setupKey = `hs-${activeSubItem.id}-${activeSubSubItem.id}`;
                const currentBlockData = blockData[selectedBlock] || { setups: {} };
                const setup = currentBlockData.setups?.[setupKey];
                const isSetUp = setup && setup.completed;
                
                return (
                <div>
                  <div className="flex gap-2 md:gap-4 mb-6 flex-wrap">
                    <button 
                      onClick={() => setHsViewType('surveys')}
                      className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded text-xs md:text-sm font-medium ${
                        hsViewType === 'surveys' ? 'bg-slate-900 text-white' : 'border'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Surveys
                      {!isSetUp && <span className="bg-red-500 px-2 py-0.5 rounded-full text-xs ml-1 text-white">1</span>}
                      {isSetUp && <CheckCircle className="w-4 h-4 text-green-500 ml-1" />}
                    </button>
                    <button 
                      onClick={() => setHsViewType('remedials')}
                      className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded text-xs md:text-sm ${
                        hsViewType === 'remedials' ? 'bg-slate-900 text-white' : 'border'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Remedials
                      <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">{activeSubSubItem.name}</h2>
                    {isSetUp ? (
                      <span className="bg-green-100 text-green-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap">Set up</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap">Set-up required</span>
                    )}
                  </div>

                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-sm md:text-base">
                    <div><span className="font-medium text-slate-900">Frequency:</span> {isSetUp ? <span className="text-slate-700">{setup.frequency}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium text-slate-900">Last completed:</span> {isSetUp && setup.lastCompleted ? <span className="text-slate-700">{new Date(setup.lastCompleted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">{isSetUp ? 'Not completed yet' : '[set-up required]'}</span>}</div>
                    <div><span className="font-medium text-slate-900">Next due by:</span> {isSetUp ? <span className="text-slate-700">{new Date(setup.nextDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium text-slate-900">Assigned to:</span> {isSetUp ? <span className="text-slate-700">{setup.assignedTo || 'Unassigned'}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">Auto-chase:</span>
                      {isSetUp ? <span className="text-slate-700">{setup.autoChase}</span> : <span className="text-slate-500">[set-up required]</span>}
                      <Info className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className={`${isSetUp ? '' : 'border-2 border-red-300'} rounded-lg ${isSetUp ? '' : 'p-4 md:p-6'} inline-block`}>
                    <button 
                      onClick={() => {
                        setCurrentSetupKey(setupKey);
                        if (isSetUp) {
                          setSetupForm({
                            frequency: setup.frequency,
                            lastCompleted: setup.lastCompleted || '',
                            nextDue: setup.nextDue,
                            assignedTo: setup.assignedTo || '',
                            autoChase: setup.autoChase
                          });
                        } else {
                          setSetupForm({
                            frequency: 'Annual',
                            lastCompleted: '',
                            nextDue: '',
                            assignedTo: '',
                            autoChase: 'Disabled'
                          });
                        }
                        setModalType('setup');
                        setShowModal(true);
                      }}
                      className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
                    >
                      {isSetUp ? 'Edit set-up' : 'Finish set-up'}
                    </button>
                  </div>
                  
                  {/* File Upload Section */}
                  <div className="mt-6 md:mt-8 border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base md:text-lg font-semibold text-slate-900">Documents</h4>
                      <button
                        onClick={() => handleFileUpload('hs', `${activeSubItem.id}-${activeSubSubItem.id}`)}
                        disabled={uploadingFile}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {uploadingFile ? 'Uploading...' : '📎 Upload Document'}
                      </button>
                    </div>
                    
                    {/* Uploaded Files List */}
                    {(() => {
                      const files = getUploadedFiles('hs', `${activeSubItem.id}-${activeSubSubItem.id}`);
                      if (files.length === 0) {
                        return (
                          <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                            <div className="text-4xl mb-2">📄</div>
                            <p className="text-slate-500 text-sm">No documents uploaded yet</p>
                            <p className="text-slate-400 text-xs mt-1">Accepted: PDF, JPG, PNG</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-2">
                          {files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="text-2xl flex-shrink-0">
                                  {file.type.includes('pdf') ? '📄' : '🖼️'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 text-sm truncate">{file.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleFilePreview(file)}
                                  className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleFileDownload(file)}
                                  className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleFileDelete('hs', `${activeSubItem.id}-${activeSubSubItem.id}`, idx)}
                                  className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                  title="Delete"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                );
              })()}

              {/* UTILITIES */}
              {activeSection === 'utilities' && (() => {
                const setupKey = `utilities-${activeSubItem.id}`;
                const currentBlockData = blockData[selectedBlock] || { setups: {} };
                const setup = currentBlockData.setups?.[setupKey];
                const isSetUp = setup && setup.completed;
                
                return (
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                      {activeSubItem.name}
                      <Edit2 className="w-4 h-4 text-slate-400" />
                    </h2>
                  </div>

                  <h3 className="text-base md:text-lg text-slate-900 mb-4 md:mb-6">{activeSubItem.fullName}</h3>
                  {isSetUp ? (
                    <span className="bg-green-100 text-green-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium inline-block mb-4 md:mb-6">Set up</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium inline-block mb-4 md:mb-6">Set-up required</span>
                  )}

                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-sm md:text-base">
                    <div><span className="font-medium text-slate-900">Frequency:</span> {isSetUp ? <span className="text-slate-700">{setup.frequency}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium text-slate-900">Last completed:</span> {isSetUp && setup.lastCompleted ? <span className="text-slate-700">{new Date(setup.lastCompleted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">{isSetUp ? 'Not completed yet' : '[set-up required]'}</span>}</div>
                    <div><span className="font-medium text-slate-900">Next due by:</span> {isSetUp ? <span className="text-slate-700">{new Date(setup.nextDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium text-slate-900">Assigned to:</span> {isSetUp ? <span className="text-slate-700">{setup.assignedTo || 'Unassigned'}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">Auto-chase:</span>
                      {isSetUp ? <span className="text-slate-700">{setup.autoChase}</span> : <span className="text-slate-500">[set-up required]</span>}
                      <Info className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className={`${isSetUp ? '' : 'border-2 border-red-300'} rounded-lg ${isSetUp ? '' : 'p-4 md:p-6'} inline-block mb-6 md:mb-8`}>
                    <button 
                      onClick={() => {
                        setCurrentSetupKey(setupKey);
                        if (isSetUp) {
                          setSetupForm({
                            frequency: setup.frequency,
                            lastCompleted: setup.lastCompleted || '',
                            nextDue: setup.nextDue,
                            assignedTo: setup.assignedTo || '',
                            autoChase: setup.autoChase
                          });
                        } else {
                          setSetupForm({
                            frequency: 'Annual',
                            lastCompleted: '',
                            nextDue: '',
                            assignedTo: '',
                            autoChase: 'Disabled'
                          });
                        }
                        setModalType('setup');
                        setShowModal(true);
                      }}
                      className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
                    >
                      {isSetUp ? 'Edit set-up' : 'Finish set-up'}
                    </button>
                  </div>

                  <div className="border-t pt-4 md:pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                      <h3 className="text-base md:text-lg font-semibold text-slate-900">Meter readings</h3>
                      <button 
                        onClick={() => {
                          setCurrentSetupKey(`meter-${activeSubItem.id}`);
                          setMeterReadingForm({ date: '', reading: '', notes: '' });
                          setModalType('add-meter');
                          setShowModal(true);
                        }}
                        className="bps-blue px-4 py-2 md:py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                    {(() => {
                      const meterKey = `meter-${activeSubItem.id}`;
                      const readings = blockData[selectedBlock]?.meterReadings?.[meterKey] || [];
                      if (readings.length === 0) return <div className="text-slate-500">None</div>;
                      return (
                        <div className="space-y-2">
                          {readings.map((r, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900 break-words">{r.reading}</div>
                                <div className="text-xs text-slate-600">{new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                {r.notes && <div className="text-xs text-slate-500 break-words">{r.notes}</div>}
                              </div>
                              <button 
                                onClick={async () => {
                                  if (confirm('Delete this reading?')) {
                                    const updatedReadings = readings.filter((_, i) => i !== idx);
                                    const updatedBlockData = {
                                      ...blockData,
                                      [selectedBlock]: {
                                        ...(blockData[selectedBlock] || {}),
                                        meterReadings: {
                                          ...(blockData[selectedBlock]?.meterReadings || {}),
                                          [meterKey]: updatedReadings
                                        }
                                      }
                                    };
                                    setBlockData(updatedBlockData);
                                    await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                                  }
                                }}
                                className="text-red-500 hover:bg-red-50 p-2 rounded flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                );
              })()}

              {/* INSURANCE - Regular items */}
              {activeSection === 'insurance' && !activeClaim && (() => {
                const setupKey = `insurance-${activeSubItem.id}`;
                const currentBlockData = blockData[selectedBlock] || { setups: {} };
                const setup = currentBlockData.setups?.[setupKey];
                const isSetUp = setup && setup.completed;
                
                return (
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">{activeSubItem.name === 'Terrorism insurance' ? 'Terrorism insurance renewal' : activeSubItem.name}</h2>
                    <ItemComments blockId={selectedBlock} blockName={blocks.find((b) => b.id === selectedBlock)?.name || ''} itemKey={`insurance:${activeSubItem.id}`} itemTitle={activeSubItem.name} currentUserId={currentUserId} currentEmail={currentEmail} />
                    {isSetUp ? (
                      <span className="bg-green-100 text-green-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap">Set up</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap">Set-up required</span>
                    )}
                  </div>

                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-sm md:text-base">
                    <div><span className="font-medium text-slate-900">Frequency:</span> {isSetUp ? <span className="text-slate-700">{setup.frequency}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium text-slate-900">Last completed:</span> {isSetUp && setup.lastCompleted ? <span className="text-slate-700">{new Date(setup.lastCompleted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">{isSetUp ? 'Not completed yet' : '[set-up required]'}</span>}</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">Next due by:</span>
                      {isSetUp ? <span className="text-slate-700">{new Date(setup.nextDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">[set-up required]</span>}
                      <button 
                        onClick={() => alert('Refreshed insurance status')}
                        className="bps-blue-text text-sm hover:underline flex items-center gap-1"
                      >
                        Refresh
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setCurrentSetupKey(setupKey);
                      if (isSetUp) {
                        setSetupForm({
                          frequency: setup.frequency,
                          lastCompleted: setup.lastCompleted || '',
                          nextDue: setup.nextDue,
                          assignedTo: setup.assignedTo || '',
                          autoChase: setup.autoChase
                        });
                      } else {
                        setSetupForm({
                          frequency: 'Annual',
                          lastCompleted: '',
                          nextDue: '',
                          assignedTo: '',
                          autoChase: 'Disabled'
                        });
                      }
                      setModalType('setup');
                      setShowModal(true);
                    }}
                    className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
                  >
                    {isSetUp ? 'Edit set-up' : 'Finish set-up'}
                  </button>
                  
                  {/* File Upload Section */}
                  <div className="mt-6 md:mt-8 border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base md:text-lg font-semibold text-slate-900">Documents</h4>
                      <button
                        onClick={() => handleFileUpload('insurance', activeSubItem.id)}
                        disabled={uploadingFile}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {uploadingFile ? 'Uploading...' : '📎 Upload Document'}
                      </button>
                    </div>
                    
                    {/* Uploaded Files List */}
                    {(() => {
                      const files = getUploadedFiles('insurance', activeSubItem.id);
                      if (files.length === 0) {
                        return (
                          <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                            <div className="text-4xl mb-2">📄</div>
                            <p className="text-slate-500 text-sm">No documents uploaded yet</p>
                            <p className="text-slate-400 text-xs mt-1">Accepted: PDF, JPG, PNG</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-2">
                          {files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="text-2xl flex-shrink-0">
                                  {file.type.includes('pdf') ? '📄' : '🖼️'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 text-sm truncate">{file.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleFilePreview(file)}
                                  className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleFileDownload(file)}
                                  className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleFileDelete('insurance', activeSubItem.id, idx)}
                                  className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                  title="Delete"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                );
              })()}

              {/* INSURANCE - Claims workflow */}
              {activeSection === 'insurance' && activeClaim && (
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900">Identify source</h2>
                      <button className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto">
                        Complete
                      </button>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                      <h3 className="font-semibold text-slate-900">Subtasks</h3>
                      <button 
                        onClick={() => alert('Add custom subtasks feature coming soon')}
                        className="bps-blue-text text-sm hover:underline"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {claimWorkflow.map((step, idx) => (
                        <button
                          key={step.id}
                          onClick={() => alert(`${step.name} - Click to mark as complete`)}
                          className={`flex items-center justify-between w-full px-4 py-2.5 rounded text-sm ${
                            idx < 2 ? 'bg-slate-900 text-white' : 'bg-white border hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{step.name}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                            idx < 2 ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'
                          }`}>
                            {step.badge}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Details</h3>
                    <div className="mb-4 text-sm md:text-base">
                      <span className="font-medium text-slate-900">Due date:</span> <span className="text-slate-600">21st Jan 2026</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Notes</h4>
                      <textarea 
                        id="claim-notes"
                        className="w-full border rounded-lg p-3 text-sm placeholder:text-slate-500" 
                        rows="4" 
                        placeholder="Enter note"
                      ></textarea>
                      <div className="flex justify-end mt-2">
                        <button 
                          onClick={() => {
                            const notes = document.getElementById('claim-notes').value;
                            if (notes.trim()) {
                              alert('Note saved: ' + notes);
                            } else {
                              alert('Please enter a note');
                            }
                          }}
                          className="bps-blue-text text-sm hover:underline"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-right">
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this insurance claim?')) {
                          alert('Insurance claim deleted');
                          setActiveClaim(null);
                          setActiveSubItem(null);
                        }
                      }}
                      className="text-red-500 text-sm hover:underline"
                    >
                      Delete insurance claim
                    </button>
                  </div>
                </div>
              )}

              {/* DOCUMENTS */}
              {activeSection === 'documents' && (() => {
                const setupKey = `documents-${activeSubItem.id}`;
                const currentBlockData = blockData[selectedBlock] || { setups: {} };
                const setup = currentBlockData.setups?.[setupKey];
                const isSetUp = setup && setup.completed;
                
                return (
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">{activeSubItem.name}</h2>
                    <ItemComments blockId={selectedBlock} blockName={blocks.find((b) => b.id === selectedBlock)?.name || ''} itemKey={`documents:${activeSubItem.id}`} itemTitle={activeSubItem.name} currentUserId={currentUserId} currentEmail={currentEmail} />
                    {isSetUp ? (
                      <span className="bg-green-100 text-green-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap">Set up</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-xs md:text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap">Set-up required</span>
                    )}
                  </div>

                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-sm md:text-base">
                    <div><span className="font-medium text-slate-900">Frequency:</span> {isSetUp ? <span className="text-slate-700">{setup.frequency}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                    <div><span className="font-medium text-slate-900">Last completed:</span> {isSetUp && setup.lastCompleted ? <span className="text-slate-700">{new Date(setup.lastCompleted).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">{isSetUp ? 'Not completed yet' : '[set-up required]'}</span>}</div>
                    <div><span className="font-medium text-slate-900">Next due by:</span> {isSetUp ? <span className="text-slate-700">{new Date(setup.nextDue).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : <span className="text-slate-500">[set-up required]</span>}</div>
                  </div>

                  <div className={`${isSetUp ? '' : 'border-2 border-red-300'} rounded-lg ${isSetUp ? '' : 'p-4 md:p-6'} inline-block`}>
                    <button 
                      onClick={() => {
                        setCurrentSetupKey(setupKey);
                        if (isSetUp) {
                          setSetupForm({
                            frequency: setup.frequency,
                            lastCompleted: setup.lastCompleted || '',
                            nextDue: setup.nextDue,
                            assignedTo: setup.assignedTo || '',
                            autoChase: setup.autoChase
                          });
                        } else {
                          setSetupForm({
                            frequency: 'Annual',
                            lastCompleted: '',
                            nextDue: '',
                            assignedTo: '',
                            autoChase: 'Disabled'
                          });
                        }
                        setModalType('setup');
                        setShowModal(true);
                      }}
                      className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
                    >
                      {isSetUp ? 'Edit set-up' : 'Finish set-up'}
                    </button>
                  </div>
                  
                  {/* File Upload Section */}
                  <div className="mt-6 md:mt-8 border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base md:text-lg font-semibold text-slate-900">Documents</h4>
                      <button
                        onClick={() => handleFileUpload('documents', activeSubItem.id)}
                        disabled={uploadingFile}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {uploadingFile ? 'Uploading...' : '📎 Upload Document'}
                      </button>
                    </div>
                    
                    {/* Uploaded Files List */}
                    {(() => {
                      const files = getUploadedFiles('documents', activeSubItem.id);
                      if (files.length === 0) {
                        return (
                          <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                            <div className="text-4xl mb-2">📄</div>
                            <p className="text-slate-500 text-sm">No documents uploaded yet</p>
                            <p className="text-slate-400 text-xs mt-1">Accepted: PDF, JPG, PNG</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-2">
                          {files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="text-2xl flex-shrink-0">
                                  {file.type.includes('pdf') ? '📄' : '🖼️'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 text-sm truncate">{file.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleFilePreview(file)}
                                  className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleFileDownload(file)}
                                  className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleFileDelete('documents', activeSubItem.id, idx)}
                                  className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                                  title="Delete"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                );
              })()}
            </div>
          )}

          {/* O&MS TAB */}
          {activeTab === 'oand-ms' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">O&Ms</h2>
                <button 
                  onClick={() => alert('Upload O&M document - feature coming soon')}
                  className="bps-blue px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium w-full sm:w-auto justify-center"
                >
                  <Upload className="w-4 h-4" />
                  Upload document
                </button>
              </div>
              <div className="text-slate-500">No O&M documents</div>
            </div>
          )}

          {/* ASSET REGISTER TAB */}
          {activeTab === 'asset-register' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">Asset register</h2>
                <button 
                  onClick={() => alert('Add asset register item - feature coming soon')}
                  className="bps-blue px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Add item
                </button>
              </div>
              <h3 className="font-medium text-slate-900 mb-4">Assets</h3>
              <div className="text-slate-500">None</div>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Notes</h2>
              <textarea 
                id={`notes-${activeSubItem?.id}`}
                rows="10"
                className="w-full border rounded-lg p-3 text-sm placeholder:text-slate-500" 
                placeholder="Enter notes..."
                defaultValue={blockData[selectedBlock]?.notes?.[activeSubItem?.id] || ''}
              />
              <div className="flex justify-end mt-2">
                <button 
                  onClick={async () => {
                    const noteValue = document.getElementById(`notes-${activeSubItem?.id}`).value;
                    const updatedBlockData = {
                      ...blockData,
                      [selectedBlock]: {
                        ...(blockData[selectedBlock] || {}),
                        notes: {
                          ...(blockData[selectedBlock]?.notes || {}),
                          [activeSubItem?.id]: noteValue
                        }
                      }
                    };
                    setBlockData(updatedBlockData);
                    await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                    alert('Notes saved!');
                  }}
                  className="bps-blue px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-medium w-full sm:w-auto"
                >
                  Save notes
                </button>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Settings</h2>
              <div className="space-y-6">
                <div>
                  <button 
                    onClick={() => alert('Showing Auto-chase settings')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded text-sm font-medium mb-4 w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <Settings className="w-4 h-4" />
                    Auto-chase
                  </button>
                  <button 
                    onClick={() => alert('Showing General settings')}
                    className="flex items-center gap-2 px-4 py-2.5 border rounded text-sm text-slate-900 placeholder:text-slate-500 mb-4 hover:bg-slate-50 w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <Settings className="w-4 h-4" />
                    General
                  </button>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Contractor auto-chase</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Automated email chasers sent to the contractor/ supplier for upcoming or overdue actions. 
                    You'll be CC'd to each email. If they reply, it'll be sent directly to to your email address.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 gap-2">
                      <span className="text-sm text-slate-900">- {activeSubItem?.name} contract renewal</span>
                      <button 
                        onClick={() => alert('Add contract first - feature coming soon')}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Add contract first
                      </button>
                    </div>
                  </div>
                </div>

                {activeSection === 'insurance' && (
                  <div className="border-t pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-semibold text-slate-900">Settings</span>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                    <div className="space-y-2">
                      <button 
                        onClick={() => alert('Add another asset - feature coming soon')}
                        className="bps-blue-text text-sm hover:underline"
                      >
                        Add another {activeSubItem?.name}
                      </button>
                      <div>
                        <button 
                          onClick={() => {
                            if (confirm('Delete this asset? This action cannot be undone.')) {
                              alert('Asset deleted');
                              setActiveSubItem(null);
                            }
                          }}
                          className="text-red-500 text-sm hover:underline"
                        >
                          Delete this asset
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // UNITS SECTION - COMPLETE
    if (activeSection === 'units') {
      const units = blockData[selectedBlock]?.units || [];
      return (
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Units</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button 
                onClick={() => {
                  setModalType('bulk-import');
                  setShowModal(true);
                }}
                className="border px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm placeholder:text-slate-500 font-medium w-full sm:w-auto"
              >
                <Upload className="w-4 h-4" />
                Bulk import
              </button>
              <button 
                onClick={() => {
                  setUnitForm({
                    type: 'Flat',
                    number: '',
                    floor: '',
                    bedrooms: '',
                    residentName: '',
                    residentEmail: '',
                    residentPhone: '',
                    moveInDate: '',
                    isOwner: false,
                    notes: ''
                  });
                  setModalType('add-unit');
                  setShowModal(true);
                }}
                className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Add unit
              </button>
            </div>
          </div>
          {units.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Building className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>No units added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map(unit => (
                <div key={unit.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-lg truncate">{unit.type} {unit.number}</h3>
                      <p className="text-sm text-slate-600">Floor {unit.floor} • {unit.bedrooms} bed</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setUnitForm(unit);
                          setModalType('add-unit');
                          setShowModal(true);
                        }}
                        className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this unit?')) {
                            const updatedUnits = units.filter(u => u.id !== unit.id);
                            const updatedBlockData = {
                              ...blockData,
                              [selectedBlock]: {
                                ...(blockData[selectedBlock] || {}),
                                units: updatedUnits
                              }
                            };
                            setBlockData(updatedBlockData);
                            await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {unit.residentName && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm font-medium text-slate-900">{unit.residentName}</p>
                      <p className="text-xs text-slate-600">{unit.isOwner ? 'Owner' : 'Tenant'}</p>
                      {unit.residentEmail && <p className="text-xs text-slate-500 break-words">{unit.residentEmail}</p>}
                      {unit.residentPhone && <p className="text-xs text-slate-500">{unit.residentPhone}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // CORRESPONDENCE SECTION - COMPLETE
    if (activeSection === 'correspondence') {
      const correspondence = blockData[selectedBlock]?.correspondence || [];
      let filteredCorrespondence = correspondence;
      
      if (correspondenceFilter !== 'all') {
        filteredCorrespondence = correspondence.filter(c => c.direction.toLowerCase() === correspondenceFilter);
      }
      
      if (correspondenceSearch) {
        filteredCorrespondence = filteredCorrespondence.filter(c =>
          c.subject.toLowerCase().includes(correspondenceSearch.toLowerCase()) ||
          c.recipientName.toLowerCase().includes(correspondenceSearch.toLowerCase()) ||
          c.content.toLowerCase().includes(correspondenceSearch.toLowerCase())
        );
      }

      return (
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Correspondence</h2>
            <button 
              onClick={() => {
                setCorrespondenceForm({
                  type: 'Email',
                  direction: 'Outgoing',
                  subject: '',
                  recipientName: '',
                  recipientEmail: '',
                  unitNumber: '',
                  date: '',
                  content: '',
                  status: 'Sent',
                  notes: ''
                });
                setModalType('add-correspondence');
                setShowModal(true);
              }}
              className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              New correspondence
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => setCorrespondenceFilter('all')}
                className={`px-3 py-1.5 rounded text-sm ${
                  correspondenceFilter === 'all' ? 'bg-slate-900 text-white' : 'border'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setCorrespondenceFilter('incoming')}
                className={`px-3 py-1.5 rounded text-sm ${
                  correspondenceFilter === 'incoming' ? 'bg-slate-900 text-white' : 'border'
                }`}
              >
                Incoming
              </button>
              <button 
                onClick={() => setCorrespondenceFilter('outgoing')}
                className={`px-3 py-1.5 rounded text-sm ${
                  correspondenceFilter === 'outgoing' ? 'bg-slate-900 text-white' : 'border'
                }`}
              >
                Outgoing
              </button>
            </div>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  value={correspondenceSearch}
                  onChange={(e) => setCorrespondenceSearch(e.target.value)}
                  type="text" 
                  placeholder="Search correspondence" 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm placeholder:text-slate-500" 
                />
              </div>
            </div>
          </div>

          {filteredCorrespondence.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>No correspondence yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCorrespondence.map(item => (
                <div key={item.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-slate-900 truncate">{item.subject}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                          item.direction === 'Incoming' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {item.direction}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 whitespace-nowrap">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        {item.direction === 'Incoming' ? 'From' : 'To'}: {item.recipientName}
                        {item.unitNumber && ` (Unit ${item.unitNumber})`}
                      </p>
                      <p className="text-sm text-slate-500 break-words line-clamp-2">{item.content}</p>
                      <p className="text-xs text-slate-400 mt-2">{new Date(item.date).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setCorrespondenceForm(item);
                          setModalType('add-correspondence');
                          setShowModal(true);
                        }}
                        className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this correspondence?')) {
                            const updated = correspondence.filter(c => c.id !== item.id);
                            const updatedBlockData = {
                              ...blockData,
                              [selectedBlock]: {
                                ...(blockData[selectedBlock] || {}),
                                correspondence: updated
                              }
                            };
                            setBlockData(updatedBlockData);
                            await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <ItemComments blockId={selectedBlock} blockName={blocks.find((b) => b.id === selectedBlock)?.name || ''} itemKey={`correspondence:${item.id}`} itemTitle={item.subject} currentUserId={currentUserId} currentEmail={currentEmail} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // JOBS SECTION - COMPLETE
    if (activeSection === 'jobs') {
      const jobs = blockData[selectedBlock]?.jobs || [];
      return (
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Jobs/projects</h2>
            <button 
              onClick={() => {
                setJobForm({
                  title: '',
                  description: '',
                  type: 'Maintenance',
                  contractor: '',
                  cost: '',
                  startDate: '',
                  completionDate: '',
                  status: 'Quote requested',
                  location: '',
                  notes: ''
                });
                setModalType('add-job');
                setShowModal(true);
              }}
              className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              New job
            </button>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Wrench className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>No jobs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-slate-900 truncate">{job.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                          job.status === 'Complete' ? 'bg-green-100 text-green-700' :
                          job.status === 'In progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {job.status}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 whitespace-nowrap">
                          {job.type}
                        </span>
                      </div>
                      {job.contractor && <p className="text-sm text-slate-600">Contractor: {job.contractor}</p>}
                      {job.cost && <p className="text-sm text-slate-600">Cost: £{job.cost}</p>}
                      {job.description && <p className="text-sm text-slate-500 mt-2 break-words">{job.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                        {job.startDate && <span>Start: {new Date(job.startDate).toLocaleDateString('en-GB')}</span>}
                        {job.completionDate && <span>Complete: {new Date(job.completionDate).toLocaleDateString('en-GB')}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setJobForm(job);
                          setModalType('add-job');
                          setShowModal(true);
                        }}
                        className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this job?')) {
                            const updatedJobs = jobs.filter(j => j.id !== job.id);
                            const updatedBlockData = {
                              ...blockData,
                              [selectedBlock]: {
                                ...(blockData[selectedBlock] || {}),
                                jobs: updatedJobs
                              }
                            };
                            setBlockData(updatedBlockData);
                            await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <ItemComments blockId={selectedBlock} blockName={blocks.find((b) => b.id === selectedBlock)?.name || ''} itemKey={`jobs:${job.id}`} itemTitle={job.title} currentUserId={currentUserId} currentEmail={currentEmail} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // PORTAL SECTION
    if (activeSection === 'portal') {
      return (
        <div className="p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Portal</h2>
          <div className="bg-white border rounded-lg p-8 md:p-12 max-w-2xl mx-auto">
            <div className="text-center">
              <DoorOpen className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 text-blue-500" />
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Resident Portal</h3>
              <p className="text-slate-600 mb-4">Access the resident-facing portal at:</p>
              <a 
                href="https://myblockonline.co.uk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-lg md:text-xl font-medium hover:underline"
              >
                myblockonline.co.uk
              </a>
            </div>
          </div>
        </div>
      );
    }

    // O&MS SECTION
    if (activeSection === 'oms') {
      return (
        <div className="p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">O&Ms (Operation & Maintenance Manuals)</h2>
            <button 
              onClick={() => alert('Upload O&M documents - feature coming soon')}
              className="bps-blue px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium w-full sm:w-auto"
            >
              <Upload className="w-4 h-4" />
              Upload documents
            </button>
          </div>
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p>No O&M documents uploaded yet</p>
          </div>
        </div>
      );
    }

    // H&S SECTION (main, no subitem selected) - MOBILE FRIENDLY
    if (activeSection === 'hs' && !activeSubItem) {
      return (
        <div className="p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">H&S</h2>
          
          {/* Desktop: show instruction, Mobile: show list */}
          <div className="hidden lg:block">
            <p className="text-sm text-slate-600 mb-4">Select a category from the left sidebar</p>
          </div>
          
          {/* Mobile: Show categories as clickable list */}
          <div className="lg:hidden">
            <p className="text-sm text-slate-600 mb-4">Select a category:</p>
            <div className="space-y-2">
              {hsItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSubItem(item);
                    setActiveTab('home');
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-white border rounded-lg hover:bps-blue-border hover:shadow-md transition-all text-left"
                >
                  <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-900">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // INSURANCE SECTION (main, no subitem selected) - MOBILE FRIENDLY
    if (activeSection === 'insurance' && !activeSubItem) {
      return (
        <div className="p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Insurance</h2>
          
          {/* Desktop: show instruction, Mobile: show list */}
          <div className="hidden lg:block">
            <p className="text-sm text-slate-600 mb-4">Select a category from the left sidebar</p>
          </div>
          
          {/* Mobile: Show categories as clickable list */}
          <div className="lg:hidden">
            <p className="text-sm text-slate-600 mb-4">Select a category:</p>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wide mb-2">Policy Documents</h3>
                <div className="space-y-2">
                  {insuranceCategories.policy.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSubItem({...item, category: 'Policy documents'});
                        setActiveClaim(null);
                        setActiveTab('home');
                      }}
                      className="w-full flex items-center gap-3 p-4 bg-white border rounded-lg hover:bps-blue-border hover:shadow-md transition-all text-left"
                    >
                      <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-900">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wide mb-2">Other</h3>
                <div className="space-y-2">
                  {insuranceCategories.other.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSubItem({...item, category: 'Other'});
                        setActiveClaim(null);
                        setActiveTab('home');
                      }}
                      className="w-full flex items-center gap-3 p-4 bg-white border rounded-lg hover:bps-blue-border hover:shadow-md transition-all text-left"
                    >
                      <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-900">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // UTILITIES SECTION (main, no subitem selected) - MOBILE FRIENDLY
    if (activeSection === 'utilities' && !activeSubItem) {
      return (
        <div className="p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Utilities</h2>
          
          {/* Desktop: show instruction, Mobile: show list */}
          <div className="hidden lg:block">
            <p className="text-sm text-slate-600 mb-4">Select a utility from the left sidebar</p>
          </div>
          
          {/* Mobile: Show utilities as clickable list */}
          <div className="lg:hidden">
            <p className="text-sm text-slate-600 mb-4">Select a utility:</p>
            <div className="space-y-2">
              {utilityItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSubItem(item);
                    setActiveTab('home');
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-white border rounded-lg hover:bps-blue-border hover:shadow-md transition-all text-left"
                >
                  <Zap className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-900">{item.fullName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // DOCUMENTS SECTION (main, no subitem selected) - MOBILE FRIENDLY
    if (activeSection === 'documents' && !activeSubItem) {
      return (
        <div className="p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Documents</h2>
          
          {/* Desktop: show instruction, Mobile: show list */}
          <div className="hidden lg:block">
            <p className="text-sm text-slate-600 mb-4">Select a document category from the left sidebar</p>
          </div>
          
          {/* Mobile: Show categories as clickable list */}
          <div className="lg:hidden">
            <p className="text-sm text-slate-600 mb-4">Select a category:</p>
            <div className="space-y-2">
              {documentCategories[0].items.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSubItem(item);
                    setActiveTab('home');
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-white border rounded-lg hover:bps-blue-border hover:shadow-md transition-all text-left"
                >
                  <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-900">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center h-full text-slate-500 p-4">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-sm md:text-base text-slate-900">Select an item from the left</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="mb-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-600 font-medium">Loading BPS Pro...</p>
      </div>
    );
  }

  const currentBlock = blocks.find(b => b.id === selectedBlock);
  const subNavItems = renderSubNav();

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', -apple-system, sans-serif; }
        .bps-blue { background-color: #1d89c6 !important; color: white !important; }
        .bps-blue:hover { background-color: #1670a8 !important; }
        .bps-blue-text { color: #1d89c6 !important; }
        .bps-blue-text:hover { color: #1670a8 !important; }
        .bps-blue-border { border-color: #1d89c6 !important; }
        .bps-blue-bg-circle { background-color: #1d89c6 !important; }
        .hover-bps-border:hover { border-color: #1d89c6 !important; }
        .hover-bps-text:hover { color: #1670a8 !important; }
      `}</style>

      {/* Mobile Overlay for Main Nav */}
      {showMainNav && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowMainNav(false)}
        />
      )}

      {/* Left Main Navigation */}
      <div className={`fixed lg:relative inset-y-0 left-0 transform ${showMainNav ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 lg:w-52 text-white flex flex-col flex-shrink-0 z-50`} style={{ backgroundColor: '#1d89c6' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 border-2 border-white rounded flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold">BPS PRO</div>
            </div>
            <button
              onClick={() => setShowMainNav(false)}
              className="lg:hidden text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-xs font-medium text-white">Block Property Solutions</div>
          {currentEmail.toLowerCase() === 'tamjid@blockpropertysolutions.co.uk' && (
            <div className="text-xs font-medium text-white mt-1 flex items-center gap-1">
              <span>👑</span> Admin
            </div>
          )}
          {currentEmail && (
            <div className="text-xs text-white/80 mt-1 break-all">{currentEmail}</div>
          )}
          <button
            onClick={() => {
              // Clear auth state
              localStorage.removeItem('bps_auth');
              localStorage.removeItem('bps_user');
              if (typeof window !== 'undefined') {
                delete window.__bps_user_email;
              }
              // Redirect to login
              window.location.href = '/login';
            }}
            className="mt-2 w-full text-xs text-white px-2 py-1 rounded transition-colors"
            style={{ backgroundColor: '#515152' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#515152'}
          >
            Log Out
          </button>
          <button
            onClick={() => {
              if (!showNotifications) loadNotifications();
              setShowNotifications((s) => !s);
            }}
            className="mt-2 w-full text-xs text-white px-2 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
            style={{ backgroundColor: '#515152' }}
          >
            <Bell className="w-3.5 h-3.5" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5">{unreadCount}</span>
            )}
          </button>
          <button
            onClick={refreshPlanner}
            disabled={plannerRefreshing || plannerConnected !== true}
            title={plannerConnected === true ? 'Reload Planner tasks now' : 'Connect Microsoft first'}
            className="mt-2 w-full text-xs text-white px-2 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2563eb' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${plannerRefreshing ? 'animate-spin' : ''}`} />
            {plannerRefreshing ? 'Refreshing…' : 'Refresh Planner'}
          </button>
          
          {/* Mobile-only: Collapsible Help & Support Section */}
          <div className="mt-4 pt-4 lg:hidden" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <button 
              onClick={() => setShowHelpSection(!showHelpSection)}
              className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-white hover:bg-white/10 rounded transition-colors"
            >
              <span className="font-medium text-slate-900">Help & Support</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showHelpSection ? 'rotate-180' : ''}`} />
            </button>
            
            {showHelpSection && (
              <div className="mt-2 space-y-1 pl-3">
                <button 
                  onClick={() => {
                    setInfoModalContent({
                      title: 'Presentation Mode',
                      message: 'Coming Soon'
                    });
                    setShowInfoModal(true);
                    setShowMainNav(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded"
                >
                  <span>📺</span>
                  <span>Pres. mode</span>
                </button>
                <button 
                  onClick={() => {
                    setInfoModalContent({
                      title: 'Request a Feature',
                      message: 'Email: keanu@blockpropertysolutions.co.uk\n\nShare your ideas and suggestions with us.'
                    });
                    setShowInfoModal(true);
                    setShowMainNav(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded"
                >
                  <span>👤</span>
                  <span>Request Feature</span>
                </button>
                <button 
                  onClick={() => {
                    setInfoModalContent({
                      title: 'Need Help?',
                      message: 'Email: keanu@blockpropertysolutions.co.uk\n\nWe typically respond within 24 hours.'
                    });
                    setShowInfoModal(true);
                    setShowMainNav(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded"
                >
                  <span>❓</span>
                  <span>Help</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-2" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
          <button
            onClick={() => {
              setShowAllBlocks(true);
              setActiveSection('home');
              setActiveSubItem(null);
              setActiveSubSubItem(null);
              setActiveClaim(null);
              setActiveTab('home');
              setShowMainNav(false);
            }}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
              showAllBlocks ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </div>
          </button>

          {/* Training Section - Collapsible (HOME ONLY) */}
          {showAllBlocks && (
            <div className="mb-1">
              {/* Training Main Button */}
              <button 
                onClick={() => setShowTrainingSection(!showTrainingSection)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded text-sm hover:bg-white/10"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Training</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showTrainingSection ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Module 1 (Nested) */}
              {showTrainingSection && (
                <div className="ml-4 mt-1">
                  <button 
                    onClick={() => setShowModule1(!showModule1)}
                    className="flex items-center justify-between w-full px-3 py-2.5 rounded text-sm hover:bg-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-900">📚</span>
                      <span>Module 1</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showModule1 ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Videos under Module 1 */}
                  {showModule1 && (
                    <div className="ml-4 mt-1 space-y-1">
                      {[
                        'How To Apportion Service Charge Allocations',
                        'How to add a new supplier',
                        'Debt Collection - Referral Process',
                        'How To Create A Works Order'
                      ].map((video, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedVideo(video);
                            setShowTrainingModal(true);
                            setShowMainNav(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm hover:bg-white/10 text-left"
                        >
                          <span className="text-xs text-slate-900">🎥</span>
                          <span className="text-xs text-slate-900">{video}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!showAllBlocks && selectedBlock && mainNav.slice(1).map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setShowAllBlocks(false);
                  setActiveSection(item.id);
                  setActiveSubItem(null);
                  setActiveSubSubItem(null);
                  setActiveClaim(null);
                  setActiveTab('home');
                  setShowMainNav(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
                  isActive ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {/* Count badge or checkmark */}
                {(() => {
                  const count = getNavCount(item.id);
                  const isComplete = isNavComplete(item.id);
                  
                  if (count > 0) {
                    return (
                      <div className="flex-shrink-0 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {count}
                      </div>
                    );
                  } else if (isComplete && item.id !== 'portal') {
                    return (
                      <div className="flex-shrink-0 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    );
                  }
                  return null;
                })()}
              </button>
            );
          })}

          {!showAllBlocks && selectedBlock && (
            <>
              <div className="mt-4 mb-2 px-3 text-xs uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Residents</div>
              {residentNav.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setActiveSubItem(null);
                      setActiveTab('home');
                      setShowMainNav(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
                      isActive ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {/* Count badge or checkmark */}
                    {(() => {
                      const count = getNavCount(item.id);
                      const isComplete = isNavComplete(item.id);
                      
                      if (count > 0) {
                        return (
                          <div className="flex-shrink-0 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {count}
                          </div>
                        );
                      } else if (isComplete) {
                        return (
                          <div className="flex-shrink-0 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </button>
                );
              })}

              <div className="mt-4 mb-2 px-3 text-xs uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Block info</div>
              {blockInfoNav.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setActiveSubItem(null);
                      setActiveTab('home');
                      setShowMainNav(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
                      isActive ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {/* Count badge or checkmark */}
                    {(() => {
                      const count = getNavCount(item.id);
                      
                      if (count > 0) {
                        return (
                          <div className="flex-shrink-0 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {count}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </button>
                );
              })}

              <div className="mt-4 mb-2 px-3 text-xs uppercase tracking-wide" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Settings</div>
              {settingsNav.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setActiveSubItem(null);
                      setActiveTab('home');
                      setShowMainNav(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
                      isActive ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {!showAllBlocks && selectedBlock && (
          <div className="border-t border-slate-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-white">All blocks</div>
              {totalTasksAllBlocks > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {totalTasksAllBlocks}
                </span>
              )}
            </div>
            <button 
              onClick={() => {
                setShowAllBlocks(true);
                setActiveSection('home');
                setShowMainNav(false);
              }}
              className="flex items-center justify-between w-full px-3 py-2 bg-slate-700 rounded text-sm hover:bg-slate-600"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{currentBlock?.shortName}</span>
              </div>
              {(() => {
                const currentBlockData = blockData[selectedBlock] || { tasks: [], issues: [] };
                const taskCount = countDueTasks(currentBlockData.tasks) + plannerDueCount(selectedBlock) + (currentBlockData.issues?.length || 0);
                return taskCount > 0 ? (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">{taskCount}</span>
                ) : (
                  <span className="bg-slate-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">0</span>
                );
              })()}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Overlay for Sub Nav */}
      {showSubNav && subNavItems.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowSubNav(false)}
        />
      )}

      {/* Middle Sidebar - Mobile friendly */}
      {subNavItems.length > 0 && (
        <div className={`fixed lg:relative inset-y-0 left-0 transform ${showSubNav ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-white border-r border-slate-200 overflow-y-auto overscroll-contain flex-shrink-0 z-40`} style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold text-slate-900">
                {activeSection === 'hs' ? 'H&S' : 
                 activeSection === 'utilities' ? 'Utilities' : 
                 activeSection === 'insurance' ? 'Insurance' :
                 activeSection === 'documents' ? 'Documents' :
                 activeSection === 'issues' ? 'Issues' : 'Section'}
              </h2>
              <button
                onClick={() => setShowSubNav(false)}
                className="lg:hidden text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs uppercase mb-3 tracking-wide text-slate-600">Select</p>
            
            {activeSection === 'insurance' && subNavItems.map((item, idx) => {
              const showCategory = idx === 0 || subNavItems[idx - 1].category !== item.category;
              return (
                <React.Fragment key={`${item.category}-${item.id}`}>
                  {showCategory && (
                    <div className="text-xs uppercase text-slate-600 mb-2 mt-4 tracking-wide">{item.category}</div>
                  )}
                  <button
                    onClick={() => {
                      setActiveSubItem(item);
                      if (item.category === 'Claims') {
                        setActiveClaim(item);
                      } else {
                        setActiveClaim(null);
                      }
                      setActiveTab('home');
                      setShowSubNav(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
                      activeSubItem?.id === item.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.name || 'Item'}</span>
                    </div>
                  </button>
                </React.Fragment>
              );
            })}

            {activeSection !== 'insurance' && subNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSubItem(item);
                  setActiveSubSubItem(null);
                  setActiveTab('home');
                  setShowSubNav(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-sm mb-1 ${
                  activeSubItem?.id === item.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Mobile friendly */}
        <div className="bg-white border-b border-slate-200 px-3 md:px-6 py-3 md:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              onClick={() => setShowMainNav(true)}
              className="lg:hidden text-slate-600 p-1.5"
            >
              <Menu className="w-5 h-5" />
            </button>
            {subNavItems.length > 0 && (
              <button
                onClick={() => setShowSubNav(true)}
                className="lg:hidden text-slate-600 p-1.5"
              >
                <FileText className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="text-base md:text-lg font-bold text-slate-900 truncate">
                {showAllBlocks ? 'All Blocks' : currentBlock?.name}
              </h1>
              {/* Task count badge in header */}
              {!showAllBlocks && selectedBlock && (() => {
                const totalTasks = getTotalTasksForBlock(selectedBlock);
                if (totalTasks > 0) {
                  return (
                    <div className="flex-shrink-0 bg-red-500 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold">
                      {totalTasks}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-600">
            <button 
              onClick={() => {
                setShowBackupPanel(!showBackupPanel);
                if (!showBackupPanel) {
                  loadBackups();
                }
              }}
              className="hover-bps-text flex items-center gap-1"
              title="View and manage backups"
            >
              💾 Backups
            </button>
            <button 
              onClick={() => {
                setInfoModalContent({
                  title: 'Presentation Mode',
                  message: 'Coming Soon'
                });
                setShowInfoModal(true);
              }}
              className="hover-bps-text flex items-center gap-1"
            >
              📺 Pres. mode
            </button>
            <button 
              onClick={() => {
                setInfoModalContent({
                  title: 'Request a Feature',
                  message: 'Email: keanu@blockpropertysolutions.co.uk\n\nShare your ideas and suggestions with us.'
                });
                setShowInfoModal(true);
              }}
              className="hover-bps-text flex items-center gap-1"
            >
              👤 Feature
            </button>
            <button 
              onClick={() => {
                setInfoModalContent({
                  title: 'Need Help?',
                  message: 'Email: keanu@blockpropertysolutions.co.uk\n\nWe typically respond within 24 hours.'
                });
                setShowInfoModal(true);
              }}
              className="hover-bps-text flex items-center gap-1"
            >
              ❓ Help
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50">
          {renderContent()}
        </div>
      </div>

      {/* MODALS SECTION - ALL MODALS */}
      
      {/* Setup Modal */}
      {showModal && modalType === 'setup' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Finish set-up</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Frequency *</label>
                <select 
                  value={setupForm.frequency}
                  onChange={(e) => setSetupForm({...setupForm, frequency: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                >
                  <option>Annual</option>
                  <option>6-Monthly</option>
                  <option>Quarterly</option>
                  <option>Monthly</option>
                  <option>Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Last completed</label>
                <input 
                  value={setupForm.lastCompleted}
                  onChange={(e) => setSetupForm({...setupForm, lastCompleted: e.target.value})}
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Next due by *</label>
                <input 
                  value={setupForm.nextDue}
                  onChange={(e) => setSetupForm({...setupForm, nextDue: e.target.value})}
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Assigned to</label>
                <input 
                  value={setupForm.assignedTo}
                  onChange={(e) => setSetupForm({...setupForm, assignedTo: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Name of contractor or person" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Auto-chase</label>
                <select 
                  value={setupForm.autoChase}
                  onChange={(e) => setSetupForm({...setupForm, autoChase: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                >
                  <option>Disabled</option>
                  <option>7 days before</option>
                  <option>14 days before</option>
                  <option>30 days before</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setSetupForm({
                    frequency: 'Annual',
                    lastCompleted: '',
                    nextDue: '',
                    assignedTo: '',
                    autoChase: 'Disabled'
                  });
                }} 
                className="flex-1 bg-red-500 text-white border border-red-500 rounded-lg px-4 py-2.5 text-sm hover:bg-red-600 active:bg-red-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!setupForm.frequency || !setupForm.nextDue) {
                    alert('Please fill in Frequency and Next due by');
                    return;
                  }
                  
                  const currentBlockData = blockData[selectedBlock] || { tasks: [], setups: {} };
                  const updatedSetups = {
                    ...(currentBlockData.setups || {}),
                    [currentSetupKey]: {
                      frequency: setupForm.frequency,
                      lastCompleted: setupForm.lastCompleted,
                      nextDue: setupForm.nextDue,
                      assignedTo: setupForm.assignedTo,
                      autoChase: setupForm.autoChase,
                      completed: true,
                      savedAt: new Date().toISOString()
                    }
                  };
                  
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...currentBlockData,
                      setups: updatedSetups
                    }
                  };
                  
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  setShowModal(false);
                  setSetupForm({
                    frequency: 'Annual',
                    lastCompleted: '',
                    nextDue: '',
                    assignedTo: '',
                    autoChase: 'Disabled'
                  });
                  setCurrentSetupKey(null);
                }} 
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save problems, for example when someone else changed the block first */}
      {saveError && (
        <div role="alert" className="fixed top-0 inset-x-0 z-[70] bg-red-600 text-white text-sm px-4 py-3 shadow-lg flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="font-medium text-center">{saveError}</span>
          <div className="flex gap-2">
            <button onClick={() => window.location.reload()} className="bg-white text-red-700 px-3 py-1 rounded text-sm font-medium">Reload page</button>
            <button onClick={() => setSaveError('')} className="border border-white/70 px-3 py-1 rounded text-sm">Dismiss</button>
          </div>
        </div>
      )}

      {/* Someone else is also viewing this block (nobody is locked out) */}
      {viewers.length > 0 && !saveError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-amber-100 border border-amber-300 text-amber-900 text-sm px-4 py-2 rounded-full shadow">
          Also viewing this block: {viewers.join(', ')}
        </div>
      )}

      {/* Archive my blocks: confirmation with a clear warning */}
      {clearOpen && (() => {
        const mine = blocks.filter((b) => b.created_by === currentUserId);
        const n = mine.length;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">Archive your blocks?</h3>
              {n === 0 ? (
                <p className="text-sm text-slate-700 mb-4">You have not created any blocks, so there is nothing to archive. Blocks created by other people are not affected.</p>
              ) : (
                <>
                  <p className="text-sm text-slate-700 mb-3">
                    {n === 1 ? 'This block' : `These ${n} blocks`} will be hidden from every user, including you. You can restore {n === 1 ? 'it' : 'them'} from Archived blocks within 30 days.
                  </p>
                  <ul className="text-sm text-slate-900 mb-3 list-disc pl-5 max-h-40 overflow-y-auto">
                    {mine.map((b) => <li key={b.id}>{b.shortName || b.name}</li>)}
                  </ul>
                  <p className="text-xs text-slate-500 mb-4">Blocks created by other people are not affected.</p>
                </>
              )}
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button onClick={() => setClearOpen(false)} className="border border-slate-300 text-slate-900 px-4 py-2 rounded-lg text-sm font-medium">
                  Cancel
                </button>
                {n > 0 && (
                  <button onClick={() => archiveMyBlocks(mine)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700">
                    Archive my blocks
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Archived blocks: restore your own within 30 days */}
      {archivedOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900">Archived blocks</h3>
                <p className="text-sm text-slate-700">Blocks you archived. You can restore them within 30 days of archiving.</p>
              </div>
              <button onClick={() => setArchivedOpen(false)} className="text-slate-500 hover:bg-slate-100 p-2 rounded flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 divide-y divide-slate-200 border border-slate-200 rounded-lg">
              {archivedRows.length === 0 && <p className="p-4 text-sm text-slate-700">Nothing archived.</p>}
              {archivedRows.map((row) => {
                const archivedAt = new Date(row.archived_at);
                const restoreBy = new Date(archivedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
                const expired = Date.now() > restoreBy.getTime();
                return (
                  <div key={row.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{row.short_name || row.name}</p>
                      <p className="text-xs text-slate-500">
                        Archived {archivedAt.toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                        {' · '}
                        {expired ? 'restore period ended' : `restore by ${restoreBy.toLocaleDateString('en-GB', { dateStyle: 'medium' })}`}
                      </p>
                    </div>
                    <button
                      disabled={expired}
                      onClick={() => restoreArchived(row)}
                      className="bps-blue px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 flex-shrink-0"
                    >
                      Restore
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Notifications: comments that mention you, or that are added to an item you have commented on */}
      {showNotifications && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setShowNotifications(false)} />
          <div className="fixed bottom-4 left-4 md:left-[21rem] z-[56] w-[min(24rem,calc(100vw-2rem))] max-h-[70vh] bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <p className="font-semibold text-slate-900">
                Notifications{unreadCount > 0 ? ` (${unreadCount} new)` : ''}
              </p>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-700 hover:underline">Mark all read</button>
                )}
                <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:bg-slate-100 p-1 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 && (
                <p className="p-4 text-sm text-slate-600">No notifications yet. Comments that mention you will appear here.</p>
              )}
              {notifications.map((n) => {
                const block = blocks.find((b) => b.id === n.block_id);
                const blockName = block ? (block.shortName || block.name) : 'Archived block';
                const who = (n.from_email || 'Someone').split('@')[0];
                return (
                  <button
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex gap-3 ${n.read_at ? '' : 'bg-blue-50/60'}`}
                  >
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.read_at ? 'bg-transparent' : 'bg-blue-600'}`} />
                    <span className="min-w-0">
                      <span className="block text-sm text-slate-900">
                        <span className="font-medium">{who}</span>
                        {n.reason === 'mention' ? ' mentioned you on ' : ' commented on '}
                        <span className="font-medium">{n.item_title}</span>
                      </span>
                      {n.excerpt && <span className="block text-xs text-slate-600 truncate">{n.excerpt}</span>}
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        {blockName} · {new Date(n.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Choose blocks modal: each person decides which blocks appear on their dashboard */}
      {showChooser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1">Choose blocks for your dashboard</h3>
            <p className="text-sm text-slate-700 mb-4">Tick the blocks you want to see. Hidden blocks are kept for the team and can be shown again at any time. Blocks you create are shown to you by default.</p>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setManyShown(blocks, true)} className="text-sm px-3 py-1.5 rounded border border-slate-300 text-slate-900 hover:bg-slate-50">Show all</button>
              <button onClick={() => setManyShown(blocks, false)} className="text-sm px-3 py-1.5 rounded border border-slate-300 text-slate-900 hover:bg-slate-50">Hide all</button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 border border-slate-200 rounded-lg divide-y divide-slate-200">
              {blocks.length === 0 && <p className="p-4 text-sm text-slate-700">No blocks have been added yet.</p>}
              {blocks.map((b) => (
                <label key={b.id} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4"
                    checked={isBlockShown(b)}
                    onChange={(e) => setManyShown([b], e.target.checked)}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-900 truncate">{b.shortName || b.name}</span>
                    <span className="block text-xs text-slate-700 truncate">{b.address}</span>
                    <span className="block text-[11px] text-slate-500/70">Created by {creatorName(b)}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowChooser(false)} className="bps-blue px-4 py-2 rounded-lg text-sm font-medium">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Change history: who changed what, when, with filters and CSV export */}
      {historyFor && (() => {
        const personOf = (r) => (r.user_email || 'Unknown').split('@')[0];
        const people = Array.from(new Set(historyRows.map(personOf))).sort();
        const sections = Array.from(new Set(historyRows.map((r) => r.section).filter(Boolean))).sort();
        const fromTs = histFrom ? new Date(histFrom + 'T00:00:00').getTime() : null;
        const toTs = histTo ? new Date(histTo + 'T23:59:59').getTime() : null;
        const filtered = historyRows.filter((r) => {
          if (histPerson && personOf(r) !== histPerson) return false;
          if (histSection && r.section !== histSection) return false;
          const t = new Date(r.created_at).getTime();
          if (fromTs && t < fromTs) return false;
          if (toTs && t > toTs) return false;
          return true;
        });
        const exportCsv = () => {
          const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
          const lines = [['When', 'Person', 'Block', 'Action', 'Section', 'Details'].join(',')];
          filtered.forEach((r) => {
            lines.push([
              new Date(r.created_at).toISOString(),
              r.user_email || '',
              r.block_name || '',
              r.action,
              r.section || '',
              r.summary,
            ].map(esc).join(','));
          });
          const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bps-history-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        };
        const selectCls = 'border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-slate-900 bg-white';
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-lg md:text-xl font-bold text-slate-900">Change history</h3>
                  <p className="text-sm text-slate-700 truncate">{historyFor.blockId ? historyFor.title : 'All blocks'}</p>
                </div>
                <button onClick={() => setHistoryFor(null)} className="text-slate-500 hover:bg-slate-100 p-2 rounded flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <select value={histPerson} onChange={(e) => setHistPerson(e.target.value)} className={selectCls}>
                  <option value="">All people</option>
                  {people.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={histSection} onChange={(e) => setHistSection(e.target.value)} className={selectCls}>
                  <option value="">All sections</option>
                  {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="date" value={histFrom} onChange={(e) => setHistFrom(e.target.value)} className={selectCls} aria-label="From date" />
                <input type="date" value={histTo} onChange={(e) => setHistTo(e.target.value)} className={selectCls} aria-label="To date" />
                <button
                  onClick={exportCsv}
                  disabled={filtered.length === 0}
                  className="ml-auto border border-slate-300 text-slate-900 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
                >
                  Export CSV
                </button>
              </div>
              <div className="overflow-y-auto flex-1 min-h-0">
                {historyLoading ? (
                  <p className="text-sm text-slate-700">Loading…</p>
                ) : filtered.length === 0 ? (
                  <p className="text-sm text-slate-700">{historyRows.length === 0 ? 'No changes recorded yet.' : 'No changes match these filters.'}</p>
                ) : (
                  <ul className="divide-y divide-slate-200">
                    {filtered.map((row) => (
                      <li key={row.id} className="py-3">
                        <p className="text-sm text-slate-900">{row.summary}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700">{personOf(row)}</span>
                          {' · '}
                          {new Date(row.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                          {!historyFor.blockId && row.block_name ? ` · ${row.block_name}` : ''}
                          {row.section ? ` · ${row.section}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Block Modal */}
      {showModal && modalType === 'add-block' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Add new block</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Block name *</label>
                <input 
                  value={newBlockForm.name}
                  onChange={(e) => setNewBlockForm({...newBlockForm, name: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="e.g., Riverside Apartments" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Short name (for sidebar) *</label>
                <input 
                  value={newBlockForm.shortName}
                  onChange={(e) => setNewBlockForm({...newBlockForm, shortName: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="e.g., Riverside Apt" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Address *</label>
                <input 
                  value={newBlockForm.address}
                  onChange={(e) => setNewBlockForm({...newBlockForm, address: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Full address" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Height category</label>
                <select 
                  value={newBlockForm.height}
                  onChange={(e) => setNewBlockForm({...newBlockForm, height: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                >
                  <option>Under 11m</option>
                  <option>11m - 18m</option>
                  <option>Over 18m</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setNewBlockForm({
                    name: '',
                    shortName: '',
                    address: '',
                    height: 'Under 11m'
                  });
                }}
                className="flex-1 bg-red-500 text-white border border-red-500 rounded-lg px-4 py-2.5 text-sm hover:bg-red-600 active:bg-red-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!newBlockForm.name || !newBlockForm.shortName || !newBlockForm.address) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  
                  const newBlock = {
                    id: crypto.randomUUID(),
                    name: newBlockForm.name,
                    shortName: newBlockForm.shortName,
                    address: newBlockForm.address,
                    height: newBlockForm.height,
                    created_by: currentUserId,
                    created_by_email: currentEmail,
                    evacuationStrategy: 'stay-put',
                    managingAgent: {
                      name: 'Block Property Solutions',
                      address: 'Mansfield Innovation Centre, Hamilton Way, Mansfield, Nottinghamshire, NG18 5BR',
                      manager: 'Keanu Billones',
                      email: 'keanu@blockpropertysolutions.co.uk'
                    }
                  };
                  const updatedBlocks = [...blocks, newBlock];
                  setBlocks(updatedBlocks);
                  
                  const updatedBlockData = {
                    ...blockData,
                    [newBlock.id]: {
                      tasks: [],
                      documents: [],
                      hsItems: [],
                      utilities: [],
                      insurance: [],
                      issues: []
                    }
                  };
                  setBlockData(updatedBlockData);
                  
                  await window.storage.set('bps_pro_blocks', JSON.stringify(updatedBlocks));
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  setShowModal(false);
                  setNewBlockForm({
                    name: '',
                    shortName: '',
                    address: '',
                    height: 'Under 11m'
                  });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Add block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showModal && modalType === 'add-task' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">{editingTaskId ? 'Edit task' : 'New task'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Task title *</label>
                <input 
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({...newTaskForm, title: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="e.g., Schedule fire alarm test" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Description</label>
                <textarea 
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({...newTaskForm, description: e.target.value})}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Add details about this task..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Due date</label>
                <input 
                  value={newTaskForm.dueDate}
                  onChange={(e) => setNewTaskForm({...newTaskForm, dueDate: e.target.value})}
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Priority</label>
                <select 
                  value={newTaskForm.priority}
                  onChange={(e) => setNewTaskForm({...newTaskForm, priority: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Category</label>
                <select 
                  value={newTaskForm.category}
                  onChange={(e) => setNewTaskForm({...newTaskForm, category: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                >
                  <option>General</option>
                  <option>Documents</option>
                  <option>H&S</option>
                  <option>Insurance</option>
                  <option>Utilities</option>
                  <option>Jobs/projects</option>
                  <option>Issues/complaints</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setNewTaskForm({
                    title: '',
                    dueDate: '',
                    priority: 'Medium',
                    category: 'General',
                    description: ''
                  });
                }}
                className="flex-1 bg-red-500 text-white border border-red-500 rounded-lg px-4 py-2.5 text-sm hover:bg-red-600 active:bg-red-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!newTaskForm.title) {
                    alert('Please enter a task title');
                    return;
                  }

                  if (editingTaskId) {
                    const cbd = blockData[selectedBlock] || { tasks: [] };
                    const updatedBlockData = {
                      ...blockData,
                      [selectedBlock]: {
                        ...cbd,
                        tasks: (cbd.tasks || []).map(t =>
                          t.id === editingTaskId ? { ...t, ...newTaskForm } : t
                        )
                      }
                    };
                    setBlockData(updatedBlockData);
                    await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                    setEditingTaskId(null);
                    setShowModal(false);
                    setNewTaskForm({ title: '', dueDate: '', priority: 'Medium', category: 'General', description: '' });
                    return;
                  }
                  
                  const newTask = {
                    id: String(Date.now()),
                    title: newTaskForm.title,
                    description: newTaskForm.description,
                    dueDate: newTaskForm.dueDate,
                    priority: newTaskForm.priority,
                    category: newTaskForm.category,
                    completed: false,
                    createdAt: new Date().toISOString()
                  };
                  
                  const currentBlockData = blockData[selectedBlock] || { tasks: [] };
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...currentBlockData,
                      tasks: [...(currentBlockData.tasks || []), newTask]
                    }
                  };
                  
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  setShowModal(false);
                  setNewTaskForm({
                    title: '',
                    dueDate: '',
                    priority: 'Medium',
                    category: 'General',
                    description: ''
                  });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                {editingTaskId ? 'Save changes' : 'Add task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Responsible Person Modal */}
      {showModal && modalType === 'add-rp' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Add Responsible Person</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Name *</label>
                <input 
                  value={rpForm.name}
                  onChange={(e) => setRpForm({...rpForm, name: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Full name" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Role</label>
                <input 
                  value={rpForm.role}
                  onChange={(e) => setRpForm({...rpForm, role: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="e.g., Property Manager, Director" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Email</label>
                <input 
                  value={rpForm.email}
                  onChange={(e) => setRpForm({...rpForm, email: e.target.value})}
                  type="email" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="email@example.com" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Phone</label>
                <input 
                  value={rpForm.phone}
                  onChange={(e) => setRpForm({...rpForm, phone: e.target.value})}
                  type="tel" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="0800 000 0000" 
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setRpForm({ name: '', role: '', email: '', phone: '' });
                }}
                className="flex-1 bg-red-500 text-white border border-red-500 rounded-lg px-4 py-2.5 text-sm hover:bg-red-600 active:bg-red-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!rpForm.name) {
                    alert('Please enter a name');
                    return;
                  }
                  const updatedRPs = [...(blockData[selectedBlock]?.responsiblePersons || []), { ...rpForm }];
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      responsiblePersons: updatedRPs
                    }
                  };
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  setShowModal(false);
                  setRpForm({ name: '', role: '', email: '', phone: '' });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Meter Reading Modal */}
      {showModal && modalType === 'add-meter' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Add meter reading</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Date *</label>
                <input 
                  value={meterReadingForm.date}
                  onChange={(e) => setMeterReadingForm({...meterReadingForm, date: e.target.value})}
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Reading *</label>
                <input 
                  value={meterReadingForm.reading}
                  onChange={(e) => setMeterReadingForm({...meterReadingForm, reading: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="e.g., 12345 kWh" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Notes</label>
                <textarea 
                  value={meterReadingForm.notes}
                  onChange={(e) => setMeterReadingForm({...meterReadingForm, notes: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Optional notes" 
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setMeterReadingForm({ date: '', reading: '', notes: '' });
                }}
                className="flex-1 bg-red-500 text-white border border-red-500 rounded-lg px-4 py-2.5 text-sm hover:bg-red-600 active:bg-red-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!meterReadingForm.date || !meterReadingForm.reading) {
                    alert('Please fill in date and reading');
                    return;
                  }
                  const meterKey = currentSetupKey;
                  const existingReadings = blockData[selectedBlock]?.meterReadings?.[meterKey] || [];
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      meterReadings: {
                        ...(blockData[selectedBlock]?.meterReadings || {}),
                        [meterKey]: [...existingReadings, { ...meterReadingForm }]
                      }
                    }
                  };
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  setShowModal(false);
                  setMeterReadingForm({ date: '', reading: '', notes: '' });
                  setCurrentSetupKey(null);
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Add reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Issue Modal */}
      {showModal && modalType === 'add-issue' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">New issue or complaint</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Title *</label>
                <input 
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({...issueForm, title: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="e.g., Broken communal door" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Location</label>
                <input 
                  value={issueForm.location}
                  onChange={(e) => setIssueForm({...issueForm, location: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="e.g., Ground floor lobby, Flat 3" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Description</label>
                <textarea 
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({...issueForm, description: e.target.value})}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Describe the issue..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Priority</label>
                <select 
                  value={issueForm.priority}
                  onChange={(e) => setIssueForm({...issueForm, priority: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setIssueForm({ title: '', description: '', priority: 'Medium', location: '' });
                }}
                className="flex-1 bg-red-500 text-white border border-red-500 rounded-lg px-4 py-2.5 text-sm hover:bg-red-600 active:bg-red-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!issueForm.title) {
                    alert('Please enter a title');
                    return;
                  }
                  const newIssue = {
                    id: String(Date.now()),
                    ...issueForm,
                    resolved: false,
                    createdAt: new Date().toISOString()
                  };
                  const existingIssues = blockData[selectedBlock]?.issues || [];
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      issues: [...existingIssues, newIssue]
                    }
                  };
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  setShowModal(false);
                  setIssueForm({ title: '', description: '', priority: 'Medium', location: '' });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Report issue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Block Modal */}
      {showModal && modalType === 'edit-block' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Edit block details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Block name *</label>
                <input 
                  value={editBlockForm.name}
                  onChange={(e) => setEditBlockForm({...editBlockForm, name: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Short name (sidebar/header) *</label>
                <input 
                  value={editBlockForm.shortName}
                  onChange={(e) => setEditBlockForm({...editBlockForm, shortName: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Address *</label>
                <input 
                  value={editBlockForm.address}
                  onChange={(e) => setEditBlockForm({...editBlockForm, address: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Height category</label>
                <select 
                  value={editBlockForm.height}
                  onChange={(e) => setEditBlockForm({...editBlockForm, height: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                >
                  <option>Under 11m</option>
                  <option>11m - 18m</option>
                  <option>Over 18m</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 bg-red-500 text-white border border-red-500 rounded-lg px-4 py-2.5 text-sm hover:bg-red-600 active:bg-red-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!editBlockForm.name || !editBlockForm.shortName || !editBlockForm.address) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  const updatedBlocks = blocks.map(b => 
                    b.id === selectedBlock 
                      ? { ...b, name: editBlockForm.name, shortName: editBlockForm.shortName, address: editBlockForm.address, height: editBlockForm.height }
                      : b
                  );
                  setBlocks(updatedBlocks);
                  await window.storage.set('bps_pro_blocks', JSON.stringify(updatedBlocks));
                  setShowModal(false);
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Managing Agent Modal */}
      {showModal && modalType === 'edit-agent' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Edit managing agent</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Managing agent name *</label>
                <input 
                  value={editAgentForm.name}
                  onChange={(e) => setEditAgentForm({...editAgentForm, name: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="e.g., Block Property Solutions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Address *</label>
                <textarea 
                  value={editAgentForm.address}
                  onChange={(e) => setEditAgentForm({...editAgentForm, address: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Full business address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Property manager *</label>
                <input 
                  value={editAgentForm.manager}
                  onChange={(e) => setEditAgentForm({...editAgentForm, manager: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Manager name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Email *</label>
                <input 
                  value={editAgentForm.email}
                  onChange={(e) => setEditAgentForm({...editAgentForm, email: e.target.value})}
                  type="email" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="manager@example.com"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 bg-red-500 text-white border border-red-500 rounded-lg px-4 py-2.5 text-sm hover:bg-red-600 active:bg-red-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!editAgentForm.name || !editAgentForm.address || !editAgentForm.manager || !editAgentForm.email) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  const updatedBlocks = blocks.map(b => 
                    b.id === selectedBlock 
                      ? { ...b, managingAgent: { ...editAgentForm } }
                      : b
                  );
                  setBlocks(updatedBlocks);
                  await window.storage.set('bps_pro_blocks', JSON.stringify(updatedBlocks));
                  setShowModal(false);
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Job Modal */}
      {showModal && modalType === 'add-job' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">{jobForm.id ? 'Edit job' : 'New job'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Job title *</label>
                <input 
                  value={jobForm.title}
                  onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="e.g., Repair communal door"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Type</label>
                <select 
                  value={jobForm.type}
                  onChange={(e) => setJobForm({...jobForm, type: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                >
                  <option>Maintenance</option>
                  <option>Repair</option>
                  <option>Installation</option>
                  <option>Inspection</option>
                  <option>Upgrade</option>
                  <option>Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Description</label>
                <textarea 
                  value={jobForm.description}
                  onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Describe the work required..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Location</label>
                <input 
                  value={jobForm.location}
                  onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="e.g., Ground floor lobby"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Contractor</label>
                <input 
                  value={jobForm.contractor}
                  onChange={(e) => setJobForm({...jobForm, contractor: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Contractor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Cost (£)</label>
                <input 
                  value={jobForm.cost}
                  onChange={(e) => setJobForm({...jobForm, cost: e.target.value})}
                  type="number" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Start date</label>
                  <input 
                    value={jobForm.startDate}
                    onChange={(e) => setJobForm({...jobForm, startDate: e.target.value})}
                    type="date" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Completion date</label>
                  <input 
                    value={jobForm.completionDate}
                    onChange={(e) => setJobForm({...jobForm, completionDate: e.target.value})}
                    type="date" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Status</label>
                <select 
                  value={jobForm.status}
                  onChange={(e) => setJobForm({...jobForm, status: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                >
                  <option>Quote requested</option>
                  <option>Quote received</option>
                  <option>Approved</option>
                  <option>In progress</option>
                  <option>Complete</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Notes</label>
                <textarea 
                  value={jobForm.notes}
                  onChange={(e) => setJobForm({...jobForm, notes: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setJobForm({
                    title: '',
                    description: '',
                    type: 'Maintenance',
                    contractor: '',
                    cost: '',
                    startDate: '',
                    completionDate: '',
                    status: 'Quote requested',
                    location: '',
                    notes: ''
                  });
                }}
                className="flex-1 bg-red-500 text-white border border-red-500 rounded-lg px-4 py-2.5 text-sm hover:bg-red-600 active:bg-red-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!jobForm.title) {
                    alert('Please enter a job title');
                    return;
                  }
                  
                  const jobs = blockData[selectedBlock]?.jobs || [];
                  let updatedJobs;
                  
                  if (jobForm.id) {
                    updatedJobs = jobs.map(j => j.id === jobForm.id ? jobForm : j);
                  } else {
                    const newJob = {
                      ...jobForm,
                      id: String(Date.now()),
                      createdAt: new Date().toISOString()
                    };
                    updatedJobs = [...jobs, newJob];
                  }
                  
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      jobs: updatedJobs
                    }
                  };
                  
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  setShowModal(false);
                  setJobForm({
                    title: '',
                    description: '',
                    type: 'Maintenance',
                    contractor: '',
                    cost: '',
                    startDate: '',
                    completionDate: '',
                    status: 'Quote requested',
                    location: '',
                    notes: ''
                  });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                {jobForm.id ? 'Save changes' : 'Add job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Unit Modal */}
      {showModal && modalType === 'add-unit' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">{unitForm.id ? 'Edit unit' : 'Add unit'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Type *</label>
                  <select 
                    value={unitForm.type}
                    onChange={(e) => setUnitForm({...unitForm, type: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                  >
                    <option>Flat</option>
                    <option>House</option>
                    <option>Studio</option>
                    <option>Penthouse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Unit number *</label>
                  <input 
                    value={unitForm.number}
                    onChange={(e) => setUnitForm({...unitForm, number: e.target.value})}
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                    placeholder="e.g., 1A"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Floor</label>
                  <input 
                    value={unitForm.floor}
                    onChange={(e) => setUnitForm({...unitForm, floor: e.target.value})}
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                    placeholder="e.g., 1, G"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Bedrooms</label>
                  <input 
                    value={unitForm.bedrooms}
                    onChange={(e) => setUnitForm({...unitForm, bedrooms: e.target.value})}
                    type="number" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-900 mb-3">Resident information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Name</label>
                    <input 
                      value={unitForm.residentName}
                      onChange={(e) => setUnitForm({...unitForm, residentName: e.target.value})}
                      type="text" 
                      className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                      placeholder="Resident name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Email</label>
                    <input 
                      value={unitForm.residentEmail}
                      onChange={(e) => setUnitForm({...unitForm, residentEmail: e.target.value})}
                      type="email" 
                      className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Phone</label>
                    <input 
                      value={unitForm.residentPhone}
                      onChange={(e) => setUnitForm({...unitForm, residentPhone: e.target.value})}
                      type="tel" 
                      className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Move-in date</label>
                    <input 
                      value={unitForm.moveInDate}
                      onChange={(e) => setUnitForm({...unitForm, moveInDate: e.target.value})}
                      type="date" 
                      className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={unitForm.isOwner}
                      onChange={(e) => setUnitForm({...unitForm, isOwner: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-900">Owner (unchecked = tenant)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Notes</label>
                <textarea 
                  value={unitForm.notes}
                  onChange={(e) => setUnitForm({...unitForm, notes: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setUnitForm({
                    type: 'Flat',
                    number: '',
                    floor: '',
                    bedrooms: '',
                    residentName: '',
                    residentEmail: '',
                    residentPhone: '',
                    moveInDate: '',
                    isOwner: false,
                    notes: ''
                  });
                }}
                className="flex-1 bg-red-500 text-white border border-red-500 rounded-lg px-4 py-2.5 text-sm hover:bg-red-600 active:bg-red-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!unitForm.type || !unitForm.number) {
                    alert('Please fill in unit type and number');
                    return;
                  }
                  
                  const units = blockData[selectedBlock]?.units || [];
                  let updatedUnits;
                  
                  if (unitForm.id) {
                    updatedUnits = units.map(u => u.id === unitForm.id ? unitForm : u);
                  } else {
                    const newUnit = {
                      ...unitForm,
                      id: String(Date.now()),
                      createdAt: new Date().toISOString()
                    };
                    updatedUnits = [...units, newUnit];
                  }
                  
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      units: updatedUnits
                    }
                  };
                  
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  setShowModal(false);
                  setUnitForm({
                    type: 'Flat',
                    number: '',
                    floor: '',
                    bedrooms: '',
                    residentName: '',
                    residentEmail: '',
                    residentPhone: '',
                    moveInDate: '',
                    isOwner: false,
                    notes: ''
                  });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                {unitForm.id ? 'Save changes' : 'Add unit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Units Modal */}
      {showModal && modalType === 'bulk-import' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Bulk import units</h3>
            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-4">
                Upload a CSV file with the following columns: Type, Number, Floor, Bedrooms, ResidentName, ResidentEmail, ResidentPhone, MoveInDate, IsOwner (true/false)
              </p>
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  
                  setBulkImportFileName(file.name);
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const text = event.target.result;
                      const lines = text.split('\n').filter(l => l.trim());
                      const headers = lines[0].split(',').map(h => h.trim());
                      
                      const preview = [];
                      for (let i = 1; i < Math.min(6, lines.length); i++) {
                        const values = lines[i].split(',').map(v => v.trim());
                        const unit = {
                          type: values[0] || 'Flat',
                          number: values[1] || '',
                          floor: values[2] || '',
                          bedrooms: values[3] || '',
                          residentName: values[4] || '',
                          residentEmail: values[5] || '',
                          residentPhone: values[6] || '',
                          moveInDate: values[7] || '',
                          isOwner: values[8]?.toLowerCase() === 'true'
                        };
                        preview.push(unit);
                      }
                      
                      setBulkImportPreview(preview);
                      setBulkImportError('');
                    } catch (error) {
                      setBulkImportError('Error parsing CSV file. Please check the format.');
                      setBulkImportPreview([]);
                    }
                  };
                  reader.readAsText(file);
                }}
                className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
              />
              {bulkImportFileName && (
                <p className="text-sm text-slate-600 mt-2">Selected: {bulkImportFileName}</p>
              )}
              {bulkImportError && (
                <p className="text-sm text-red-500 mt-2">{bulkImportError}</p>
              )}
            </div>
            
            {bulkImportPreview.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-slate-900 mb-2">Preview (first 5 rows)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="border px-2 py-1 text-left">Type</th>
                        <th className="border px-2 py-1 text-left">Number</th>
                        <th className="border px-2 py-1 text-left">Floor</th>
                        <th className="border px-2 py-1 text-left">Beds</th>
                        <th className="border px-2 py-1 text-left">Resident</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkImportPreview.map((unit, idx) => (
                        <tr key={idx}>
                          <td className="border px-2 py-1">{unit.type}</td>
                          <td className="border px-2 py-1">{unit.number}</td>
                          <td className="border px-2 py-1">{unit.floor}</td>
                          <td className="border px-2 py-1">{unit.bedrooms}</td>
                          <td className="border px-2 py-1">{unit.residentName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setBulkImportPreview([]);
                  setBulkImportError('');
                  setBulkImportFileName('');
                }}
                className="flex-1 bg-red-500 text-white border border-red-500 rounded-lg px-4 py-2.5 text-sm hover:bg-red-600 active:bg-red-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (bulkImportPreview.length === 0) {
                    alert('Please upload a CSV file first');
                    return;
                  }
                  
                  const units = blockData[selectedBlock]?.units || [];
                  const newUnits = bulkImportPreview.map(unit => ({
                    ...unit,
                    id: String(Date.now() + Math.random()),
                    createdAt: new Date().toISOString()
                  }));
                  
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      units: [...units, ...newUnits]
                    }
                  };
                  
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  alert(`Successfully imported ${newUnits.length} units`);
                  setShowModal(false);
                  setBulkImportPreview([]);
                  setBulkImportError('');
                  setBulkImportFileName('');
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
                disabled={bulkImportPreview.length === 0}
              >
                Import units
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Correspondence Modal */}
      {showModal && modalType === 'add-correspondence' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">{correspondenceForm.id ? 'Edit correspondence' : 'New correspondence'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Type</label>
                  <select 
                    value={correspondenceForm.type}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, type: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                  >
                    <option>Email</option>
                    <option>Letter</option>
                    <option>Phone call</option>
                    <option>Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Direction</label>
                  <select 
                    value={correspondenceForm.direction}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, direction: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                  >
                    <option>Outgoing</option>
                    <option>Incoming</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Subject *</label>
                <input 
                  value={correspondenceForm.subject}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, subject: e.target.value})}
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="e.g., Noise complaint - Unit 3A"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Recipient name *</label>
                  <input 
                    value={correspondenceForm.recipientName}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, recipientName: e.target.value})}
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Unit number</label>
                  <input 
                    value={correspondenceForm.unitNumber}
                    onChange={(e) => setCorrespondenceForm({...correspondenceForm, unitNumber: e.target.value})}
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                    placeholder="e.g., 3A"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Email</label>
                <input 
                  value={correspondenceForm.recipientEmail}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, recipientEmail: e.target.value})}
                  type="email" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Date</label>
                <input 
                  value={correspondenceForm.date}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, date: e.target.value})}
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Content *</label>
                <textarea 
                  value={correspondenceForm.content}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, content: e.target.value})}
                  rows="4"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Message content..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Status</label>
                <select 
                  value={correspondenceForm.status}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, status: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                >
                  <option>Draft</option>
                  <option>Sent</option>
                  <option>Received</option>
                  <option>Pending reply</option>
                  <option>Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Notes</label>
                <textarea 
                  value={correspondenceForm.notes}
                  onChange={(e) => setCorrespondenceForm({...correspondenceForm, notes: e.target.value})}
                  rows="2"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500" 
                  placeholder="Internal notes..."
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setCorrespondenceForm({
                    type: 'Email',
                    direction: 'Outgoing',
                    subject: '',
                    recipientName: '',
                    recipientEmail: '',
                    unitNumber: '',
                    date: '',
                    content: '',
                    status: 'Sent',
                    notes: ''
                  });
                }}
                className="flex-1 bg-red-500 text-white border border-red-500 rounded-lg px-4 py-2.5 text-sm hover:bg-red-600 active:bg-red-700 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!correspondenceForm.subject || !correspondenceForm.recipientName || !correspondenceForm.content) {
                    alert('Please fill in subject, recipient name, and content');
                    return;
                  }
                  
                  const correspondence = blockData[selectedBlock]?.correspondence || [];
                  let updatedCorrespondence;
                  
                  if (correspondenceForm.id) {
                    updatedCorrespondence = correspondence.map(c => c.id === correspondenceForm.id ? correspondenceForm : c);
                  } else {
                    const newItem = {
                      ...correspondenceForm,
                      id: String(Date.now()),
                      date: correspondenceForm.date || new Date().toISOString().split('T')[0],
                      createdAt: new Date().toISOString()
                    };
                    updatedCorrespondence = [...correspondence, newItem];
                  }
                  
                  const updatedBlockData = {
                    ...blockData,
                    [selectedBlock]: {
                      ...(blockData[selectedBlock] || {}),
                      correspondence: updatedCorrespondence
                    }
                  };
                  
                  setBlockData(updatedBlockData);
                  await window.storage.set('bps_pro_block_data', JSON.stringify(updatedBlockData));
                  
                  setShowModal(false);
                  setCorrespondenceForm({
                    type: 'Email',
                    direction: 'Outgoing',
                    subject: '',
                    recipientName: '',
                    recipientEmail: '',
                    unitNumber: '',
                    date: '',
                    content: '',
                    status: 'Sent',
                    notes: ''
                  });
                }}
                className="flex-1 bps-blue rounded-lg px-4 py-2.5 text-sm order-1 sm:order-2"
              >
                {correspondenceForm.id ? 'Save changes' : 'Add correspondence'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Info Modal (Pres. mode, Feature, Help) - Click anywhere to close */}
      {showInfoModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 md:p-8 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">{infoModalContent.title}</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-slate-600 whitespace-pre-line text-sm md:text-base leading-relaxed">
              {infoModalContent.message}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="bps-blue px-6 py-2.5 rounded-lg text-sm font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training Module Modal */}
      {showTrainingModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowTrainingModal(false);
            setSelectedVideo(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 md:p-8 w-full max-w-4xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6" style={{ color: '#1d89c6' }} />
                  {selectedVideo}
                </h3>
                <p className="text-sm text-slate-500 mt-1">BPS Pro Training - Module 1</p>
              </div>
              <button
                onClick={() => {
                  setShowTrainingModal(false);
                  setSelectedVideo(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Video Player */}
            <div className="bg-slate-900 rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%', position: 'relative' }}>
              <iframe
                src={`https://www.loom.com/embed/${
                  selectedVideo === 'How To Apportion Service Charge Allocations' ? '50f5a5255c154afb9dcff36215554ef4' :
                  selectedVideo === 'How to add a new supplier' ? 'e9d5897256fb4cae8f2ca6a4e79763b6' :
                  selectedVideo === 'Debt Collection - Referral Process' ? '18b6abf98a3b4bd1a4faa2c9b333e693' :
                  '85d0c596ca154e33b10ffde3acb20324'
                }?sid=training`}
                frameBorder="0"
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTrainingModal(false)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#1d89c6' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* BACKUP PANEL MODAL */}
      {showBackupPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">💾 Data Backups</h2>
              <button
                onClick={() => setShowBackupPanel(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Backup Now Button */}
            <button
              onClick={() => {
                saveBackupToSupabase();
                alert('✅ Backup created successfully!');
              }}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg mb-4 hover:bg-blue-700 font-medium transition-colors"
            >
              💾 Backup Now
            </button>

            {/* Automatic 6-hour backups (kept in the database) */}
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Automatic backups every 6 hours (latest 8 kept):</h3>
              {autoBackups.length === 0 ? (
                <p className="text-slate-500 text-sm">No automatic backups yet. The first one runs at the next 6-hour mark.</p>
              ) : (
                autoBackups.map((b) => (
                  <div key={b.id} className="border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{new Date(b.created_at).toLocaleString('en-GB')}</p>
                      <p className="text-sm text-slate-500">{b.block_count} block{b.block_count === 1 ? '' : 's'}</p>
                    </div>
                    <button
                      onClick={() => restoreAutoBackup(b.id, b.created_at)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium text-sm transition-colors whitespace-nowrap"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Backups List */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Backups (Latest 7 kept):</h3>
              {backups.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No backups yet. Click "Backup Now" to create one.</p>
              ) : (
                backups.map((backup, index) => (
                  <div
                    key={backup.id}
                    className="border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        #{backups.length - index} - {backup.backup_name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(backup.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => restoreFromBackup(backup.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium text-sm transition-colors whitespace-nowrap"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>ℹ️ About Backups:</strong>
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>✅ Automatic backups run every 12 hours</li>
                <li>✅ Last 7 backups are kept (older ones deleted)</li>
                <li>✅ Each backup contains all blocks, tasks, documents & insurance data</li>
                <li>✅ You can manually backup anytime by clicking "Backup Now"</li>
                <li>⚠️ Restoring a backup will replace ALL current data</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <ToastStack alerts={alerts} />
      
    </div>
  );
}
