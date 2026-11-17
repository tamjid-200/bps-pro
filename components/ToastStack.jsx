import React, { useState } from 'react';
import { AlertCircle, Calendar, X } from 'lucide-react';

// Pop-up alerts for deadlines, overdue tasks and insurance cover dates.
// Top-right on desktop, full width at the top on phones.
// Each alert holds for about 5 seconds, then fades out and closes its gap,
// one alert after another. Hover (or touch and hold) pauses the stack.
// Dismissed alerts come back on the next page load.

const CSS = `
.bps-toasts{position:fixed;top:16px;right:16px;z-index:60;width:calc(100% - 32px);max-width:384px;pointer-events:none;font-family:inherit}
.bps-slot{box-sizing:border-box;overflow:hidden;padding:10px 12px 26px;margin:-10px -12px -14px;max-height:220px;animation:bpsCollapse .55s cubic-bezier(.4,0,.2,1) forwards;animation-delay:calc(var(--i) * 1.2s + 5.9s)}
.bps-slot.is-dismissed{animation:bpsCollapse .5s cubic-bezier(.4,0,.2,1) .3s forwards}
.bps-toast{position:relative;display:flex;gap:12px;align-items:flex-start;box-sizing:border-box;width:100%;padding:14px 14px 16px;background:#fff;border:1px solid #E4E7EC;border-radius:12px;box-shadow:0 8px 24px rgba(16,24,40,.10);color:#101828;overflow:hidden;pointer-events:auto;
animation:bpsIn .7s cubic-bezier(.2,.7,.2,1) both calc(var(--i) * .18s),bpsOut .9s ease forwards calc(var(--i) * 1.2s + 5s)}
.bps-slot.is-dismissed .bps-toast{animation:bpsOut .35s ease forwards}
.bps-toast::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px}
.bps-danger::before{background:#D92D20}
.bps-warning::before{background:#B54708}
.bps-ic{flex:none;width:32px;height:32px;border-radius:50%;display:grid;place-items:center}
.bps-danger .bps-ic{background:#FEF3F2;color:#D92D20}
.bps-warning .bps-ic{background:#FFFAEB;color:#B54708}
.bps-body{flex:1;min-width:0}
.bps-kicker{margin:0;font-size:13px;font-weight:600;letter-spacing:-.01em}
.bps-block{margin:2px 0 0;font-size:12px;color:#667085}
.bps-msg{margin:6px 0 0;font-size:13px;line-height:1.45;color:#344054}
.bps-x{flex:none;width:28px;height:28px;margin:-4px -4px 0 0;border:0;border-radius:8px;background:transparent;color:#98A2B3;cursor:pointer;display:grid;place-items:center}
.bps-x:hover{background:#F2F4F7;color:#475467}
.bps-x:focus-visible{outline:2px solid #1570EF;outline-offset:2px}
.bps-bar{position:absolute;left:0;right:0;bottom:0;height:2px;transform-origin:left;background:currentColor;opacity:.35;animation:bpsDrain linear forwards;animation-duration:calc(5s + var(--i) * 1.02s);animation-delay:calc(var(--i) * .18s)}
.bps-danger .bps-bar{color:#D92D20}
.bps-warning .bps-bar{color:#B54708}
.bps-slot.is-dismissed .bps-bar{display:none}
.bps-more{margin:0;align-self:flex-end;font-size:12px;font-weight:500;color:#fff;background:#1D2939;border-radius:999px;padding:5px 12px;pointer-events:auto}
.bps-toasts:hover .bps-slot,.bps-toasts:hover .bps-toast,.bps-toasts:hover .bps-bar{animation-play-state:paused}
@keyframes bpsIn{from{opacity:0;transform:translateX(28px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
@keyframes bpsOut{to{opacity:0;transform:translateX(14px);filter:blur(2px)}}
@keyframes bpsCollapse{from{max-height:220px;margin-bottom:-14px}to{max-height:0;margin-bottom:0}}
@keyframes bpsDrain{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@media (max-width:639px){
  .bps-toasts{top:calc(env(safe-area-inset-top, 0px) + 12px);left:12px;right:12px;width:auto;max-width:none}
  .bps-slot{margin:-10px -12px -14px}
  .bps-toast{padding:16px 8px 18px 16px;border-radius:16px;box-shadow:0 10px 30px rgba(16,24,40,.14)}
  .bps-ic{width:36px;height:36px}
  .bps-kicker{font-size:15px}
  .bps-block{font-size:13px}
  .bps-msg{font-size:14px}
  .bps-x{width:44px;height:44px;margin:-10px -6px 0 0;font-size:22px;border-radius:12px}
  .bps-more{font-size:13px;padding:7px 14px}
}
@media (prefers-reduced-motion:reduce){.bps-toast,.bps-slot,.bps-bar{animation:none!important}}
`;

// One alert. Its position in the stack is fixed when it first appears, so its timing does not change.
function ToastItem({ alert, index, onGone }) {
  const [order] = useState(index);
  const [dismissed, setDismissed] = useState(false);
  const danger = alert.level === 'danger';

  return (
    <div
      className={`bps-slot${dismissed ? ' is-dismissed' : ''}`}
      style={{ '--i': order }}
      onAnimationEnd={(e) => {
        // The stack has closed its gap: remove the alert
        if (e.animationName === 'bpsCollapse') onGone(alert.id);
      }}
    >
      <div className={`bps-toast ${danger ? 'bps-danger' : 'bps-warning'}`} role="alert">
        <span className="bps-ic">
          {danger ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
        </span>
        <div className="bps-body">
          <p className="bps-kicker">{alert.title}</p>
          <p className="bps-block">{alert.blockName}</p>
          <p className="bps-msg">{alert.message}</p>
        </div>
        <button className="bps-x" onClick={() => setDismissed(true)} aria-label="Dismiss alert">
          <X className="w-4 h-4" />
        </button>
        <span className="bps-bar" />
      </div>
    </div>
  );
}

export default function ToastStack({ alerts = [] }) {
  const [gone, setGone] = useState([]);
  const visible = alerts.filter((a) => !gone.includes(a.id));
  if (visible.length === 0) return null;

  const shown = visible.slice(0, 4);
  const more = visible.length - shown.length;

  return (
    <div className="bps-toasts">
      <style>{CSS}</style>
      {shown.map((a, i) => (
        <ToastItem
          key={a.id}
          alert={a}
          index={i}
          onGone={(id) => setGone((g) => (g.includes(id) ? g : [...g, id]))}
        />
      ))}
      {more > 0 && (
        <p className="bps-more">
          +{more} more alert{more > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
