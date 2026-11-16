import React from 'react';

// Shows the Confirmation Statement line on a block card.
// item comes from /api/planner-status: { title, dueDate, done, daysLeft }
export default function PlannerStatus({ item }) {
  if (!item) return null;

  if (item.done) {
    return <p className="text-xs font-medium text-green-700">Confirmation Statement: done</p>;
  }
  if (item.daysLeft === null || item.daysLeft === undefined) {
    return <p className="text-xs text-slate-500">Confirmation Statement: no due date</p>;
  }
  if (item.daysLeft < 0) {
    return (
      <p className="text-xs font-medium text-red-600">
        Confirmation Statement: {-item.daysLeft} day{-item.daysLeft === 1 ? '' : 's'} overdue
      </p>
    );
  }
  return (
    <p className={`text-xs font-medium ${item.daysLeft <= 14 ? 'text-amber-600' : 'text-slate-600'}`}>
      Confirmation Statement: {item.daysLeft} day{item.daysLeft === 1 ? '' : 's'} left
    </p>
  );
}
