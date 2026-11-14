// Plain date logic. No AI needed for deadline and expiry alerts.

const DAY_MS = 24 * 60 * 60 * 1000;

const INSURANCE_NAMES = {
  'insurance-building': 'Building insurance',
  'insurance-terrorism-1': 'Terrorism insurance',
  'insurance-reinstatement': 'Reinstatement cost assessment',
};

const fmt = (s) =>
  new Date(`${String(s).slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// Returns whole days from today to the date. Negative means in the past.
const daysUntil = (s, today) => {
  if (!s) return null;
  const d = new Date(`${String(s).slice(0, 10)}T00:00:00`);
  if (isNaN(d)) return null;
  return Math.round((d - today) / DAY_MS);
};

const whenText = (days) =>
  days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;

export function computeAlerts(blocks = [], blockData = {}, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const alerts = [];

  blocks.forEach((block) => {
    const d = blockData[block.id] || {};
    const blockName = block.shortName || block.name || 'Block';

    // Tasks: overdue, or due within 14 days
    (d.tasks || []).forEach((t, i) => {
      if (t.completed) return;
      const days = daysUntil(t.dueDate, today);
      if (days === null) return;
      const title = t.title || 'Untitled task';
      if (days < 0) {
        alerts.push({ id: `task-${block.id}-${i}`, level: 'danger', title: 'Task overdue', blockName, message: `${title} was due ${fmt(t.dueDate)}.` });
      } else if (days <= 14) {
        alerts.push({ id: `task-${block.id}-${i}`, level: 'warning', title: 'Task due soon', blockName, message: `${title} is due ${whenText(days)}.` });
      }
    });

    // Insurance covers read from documents (AI) : expired, or ending within 60 days
    Object.entries(d.insuranceCover || {}).forEach(([key, c]) => {
      const days = daysUntil(c?.expiryDate, today);
      if (days === null) return;
      const name = INSURANCE_NAMES[key] || key;
      if (days < 0) {
        alerts.push({ id: `cover-${block.id}-${key}`, level: 'danger', title: 'Insurance cover expired', blockName, message: `${name} ended on ${fmt(c.expiryDate)}.` });
      } else if (days <= 60) {
        alerts.push({ id: `cover-${block.id}-${key}`, level: 'warning', title: 'Insurance cover ending soon', blockName, message: `${name} ends ${whenText(days)} (${fmt(c.expiryDate)}).` });
      }
    });

    // Recurring checks (set-up items with a next due date): overdue, or due within 14 days
    Object.entries(d.setups || {}).forEach(([key, s]) => {
      if (!s?.completed || !s?.nextDue) return;
      const days = daysUntil(s.nextDue, today);
      if (days === null) return;
      const name = INSURANCE_NAMES[key] || key.replace(/-/g, ' ');
      if (days < 0) {
        alerts.push({ id: `setup-${block.id}-${key}`, level: 'danger', title: 'Check overdue', blockName, message: `${name} was due ${fmt(s.nextDue)}.` });
      } else if (days <= 14) {
        alerts.push({ id: `setup-${block.id}-${key}`, level: 'warning', title: 'Check due soon', blockName, message: `${name} is due ${whenText(days)}.` });
      }
    });
  });

  return alerts.sort((a, b) => (a.level === b.level ? 0 : a.level === 'danger' ? -1 : 1));
}

// Text summary sent to the AI chat so it can answer questions about the data.
export function buildContext(blocks = [], blockData = {}) {
  const parts = blocks.map((b) => {
    const d = blockData[b.id] || {};
    const lines = [
      `BLOCK: ${b.name} (short name: ${b.shortName || '-'}), address: ${b.address || '-'}, height: ${b.height || '-'}`,
    ];
    (d.tasks || []).forEach((t) =>
      lines.push(`- Task: ${t.title || 'untitled'} | due ${t.dueDate || 'none'} | ${t.completed ? 'done' : 'open'}${t.priority ? ` | priority ${t.priority}` : ''}${t.description ? ` | ${t.description}` : ''}`)
    );
    (d.issues || []).forEach((i) =>
      lines.push(`- Issue/complaint: ${i.title || 'untitled'} | ${i.status || 'open'}${i.priority ? ` | priority ${i.priority}` : ''}`)
    );
    Object.entries(d.setups || {}).forEach(([k, s]) =>
      lines.push(`- Check ${k}: completed ${s?.completed ? 'yes' : 'no'}, last completed ${s?.lastCompleted || 'n/a'}, next due ${s?.nextDue || 'n/a'}, frequency ${s?.frequency || 'n/a'}`)
    );
    Object.entries(d.insuranceCover || {}).forEach(([k, c]) =>
      lines.push(`- Insurance cover ${INSURANCE_NAMES[k] || k} (from document): insurer ${c?.insurer || 'n/a'}, policy ${c?.policyNumber || 'n/a'}, type ${c?.coverType || 'n/a'}, start ${c?.startDate || 'n/a'}, expiry ${c?.expiryDate || 'n/a'}, notes ${c?.notes || 'none'}`)
    );
    Object.entries(d.uploadedFiles || {}).forEach(([k, files]) => {
      const names = (files || []).map((f) => f.name).join(', ');
      if (names) lines.push(`- Uploaded files in ${k}: ${names}`);
    });
    return lines.join('\n');
  });
  return parts.join('\n\n');
}
