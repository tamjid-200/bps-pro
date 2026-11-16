import React, { useEffect, useState } from 'react';
import { AlertCircle, Calendar, X } from 'lucide-react';

const SHOW_MS = 5000; // how long each alert stays on screen
const FADE_MS = 900; // slow fade-out
const STAGGER_MS = 1200; // gap between alerts fading, so they leave one by one

// One alert. It fades out after SHOW_MS (plus a short gap per position), then tells the parent it is gone.
function ToastItem({ alert, index, onGone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const delay = SHOW_MS + index * STAGGER_MS;
    const fadeTimer = setTimeout(() => setFading(true), delay);
    const goneTimer = setTimeout(() => onGone(alert.id), delay + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  return (
    <div
      role="alert"
      className={`pointer-events-auto rounded-lg border-l-4 bg-white shadow-lg p-4 flex gap-3 ${
        alert.level === 'danger' ? 'border-red-500' : 'border-amber-500'
      }`}
      style={{ opacity: fading ? 0 : 1, transition: `opacity ${FADE_MS}ms ease` }}
    >
      {alert.level === 'danger' ? (
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      ) : (
        <Calendar className="w-5 h-5 text-amber-500 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
        <p className="text-xs text-slate-500">{alert.blockName}</p>
        <p className="text-sm text-slate-700 mt-1">{alert.message}</p>
      </div>
      <button
        onClick={() => onGone(alert.id)}
        className="text-slate-400 hover:text-slate-600 self-start"
        aria-label="Dismiss alert"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Pop-up alerts for deadlines, overdue tasks and insurance cover dates.
// Shown top-right. Each alert fades out by itself after a few seconds, one after another.
export default function ToastStack({ alerts = [] }) {
  const [gone, setGone] = useState([]);
  const visible = alerts.filter((a) => !gone.includes(a.id));
  if (visible.length === 0) return null;

  const shown = visible.slice(0, 4);
  const more = visible.length - shown.length;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-3 w-[calc(100%-2rem)] sm:w-96 pointer-events-none">
      {shown.map((a, i) => (
        <ToastItem
          key={a.id}
          alert={a}
          index={i}
          onGone={(id) => setGone((g) => (g.includes(id) ? g : [...g, id]))}
        />
      ))}
      {more > 0 && (
        <p className="pointer-events-auto text-xs text-white bg-slate-800 rounded px-3 py-1 self-end">
          +{more} more alert{more > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
