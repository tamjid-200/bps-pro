import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { askBps } from '../lib/ai-client';
import { buildContext } from '../lib/bps-context';

const GREETING = {
  role: 'assistant',
  content:
    'Hi! Ask me about any block\'s tasks, issues, checks or insurance cover dates. For example: "When does De Ferrers Court insurance expire?"',
};

// Floating chat bubble (bottom right). Pass hidden={true} to hide it while a modal is open.
export default function AIChat({ blocks = [], blockData = {}, hidden = false }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (hidden) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      // Skip the greeting and keep the last 10 messages
      const history = next.slice(1).slice(-10);
      const reply = await askBps(history, buildContext(blocks, blockData));
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `Sorry, ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-[55] w-[calc(100%-2rem)] sm:w-96 h-[70vh] max-h-[560px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <p className="font-semibold text-slate-900">BPS Assistant</p>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close chat">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user' ? 'text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                  style={m.role === 'user' ? { backgroundColor: '#1d89c6' } : undefined}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <p className="text-xs text-slate-500">Thinking...</p>}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2 p-3 border-t border-slate-200"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a block..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm text-slate-900"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="text-white rounded-lg px-3 py-2 disabled:opacity-50"
              style={{ backgroundColor: '#1d89c6' }}
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-4 sm:right-6 z-[55] w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center"
        style={{ backgroundColor: '#1d89c6' }}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </>
  );
}
