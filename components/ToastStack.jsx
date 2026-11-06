import React, { useState } from 'react';
import { AlertCircle, Calendar, X } from 'lucide-react';

// Pop-up alerts for deadlines, overdue tasks and insurance cover dates.
// Shown top-right. Dismissed alerts come back on the next page load.
export default function ToastStack({ alerts = [] }) {
  const [dismissed, setDismissed] = useState([]);
  const visible = alerts.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  const shown = visible.slice(0, 4);
  const more = visible.length - shown.length;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-3 w-[calc(100%-2rem)] sm:w-96 pointer-events-none">
      {shown.map((a) => (
        <div
          key={a.id}
          role="alert"
          className={`pointer-events-auto rounded-lg border-l-4 bg-white shadow-lg p-4 flex gap-3 ${
            a.level === 'danger' ? 'border-red-500' : 'border-amber-500'
          }`}
        >
          {a.level === 'danger' ? (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          ) : (
            <Calendar className="w-5 h-5 text-amber-500 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{a.title}</p>
            <p className="text-xs text-slate-500">{a.blockName}</p>
            <p className="text-sm text-slate-700 mt-1">{a.message}</p>
          </div>
          <button
            onClick={() => setDismissed((d) => [...d, a.id])}
            className="text-slate-400 hover:text-slate-600 self-start"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      {more > 0 && (
        <p className="pointer-events-auto text-xs text-white bg-slate-800 rounded px-3 py-1 self-end">
          +{more} more alert{more > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
