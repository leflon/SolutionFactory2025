'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

const mockMessages = [
  { from: 'bot', text: 'Hi! How can I help you find the best metro path today?' },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages
        }),
      });
      const data = await res.json();
      if (data.response) {
        setMessages(prev => [...prev, { from: 'bot', text: data.response }]);
      } else {
        setMessages(prev => [...prev, { from: 'bot', text: "Désolé, je n'ai pas compris." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { from: 'bot', text: "Erreur lors de la connexion à Gemini." }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end">
      {!open && (
        <button
          className="bg-white hover:bg-gray-100 text-black rounded-full p-4 shadow-lg border border-gray-200 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-black"
          onClick={() => setOpen(true)}
          aria-label="Open chat"
        >
          <ChatBubbleLeftRightIcon className="h-7 w-7 text-black" />
        </button>
      )}
      {open && (
        <div className="w-80 max-w-[90vw] h-[32rem] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-fast">
          {/* Header */}
          <div className="flex items-center justify-between bg-white border-b border-gray-100 px-5 py-3">
            <span className="font-semibold text-black text-base">Metro Assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="hover:bg-gray-100 rounded-full p-1 transition-colors">
              <XMarkIcon className="h-6 w-6 text-black" />
            </button>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-4 py-2 rounded-xl max-w-[75%] text-sm shadow-sm transition-all duration-150
                    ${msg.from === 'user'
                      ? 'bg-white border border-gray-200 text-gray-900'
                      : 'bg-gray-100 text-gray-700 border border-gray-100'}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 max-w-[75%] text-sm shadow-sm animate-pulse border border-gray-100">
                  Gemini est en train de répondre...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-100">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black transition-all duration-150 text-gray-900 placeholder-gray-400"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus={open}
            />
            <button
              type="submit"
              className="bg-white hover:bg-gray-200 text-black rounded-full p-2 border border-gray-200 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-black"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="h-5 w-5 rotate-90 text-black" />
            </button>
          </form>
        </div>
      )}
      <style jsx global>{`
        @keyframes fade-in-fast {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-fast {
          animation: fade-in-fast 0.15s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
} 