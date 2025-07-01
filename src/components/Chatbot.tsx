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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {!open && (
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => setOpen(true)}
          aria-label="Open chat"
        >
          <ChatBubbleLeftRightIcon className="h-7 w-7" />
        </button>
      )}
      {open && (
        <div className="w-80 h-96 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3">
            <span className="font-semibold">Metro Assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-[75%] text-sm shadow
                    ${msg.from === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg bg-gray-200 text-gray-900 max-w-[75%] text-sm shadow animate-pulse">
                  Gemini est en train de répondre...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2 bg-white border-t">
            <input
              type="text"
              className="flex-1 border rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus={open}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="h-5 w-5 rotate-90" />
            </button>
          </form>
        </div>
      )}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease;
        }
      `}</style>
    </div>
  );
} 