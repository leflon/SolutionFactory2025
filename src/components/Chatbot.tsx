'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

type Message = { from: string; text: string } | { from: string; type: 'loader' };

const mockMessages: Message[] = [
  { from: 'bot', text: 'Hi! How can I help you find the best metro path today?' },
];

export default function Chatbot({ setEndpoints, loadingItinerary }: { setEndpoints: (endpoints: { departure: string; destination: string }) => void, loadingItinerary: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<{ from_station: string; to_station: string } | null>(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  useEffect(() => {
    if (!loadingItinerary) {
      setMessages(prev => prev.filter(msg => !isLoaderMessage(msg)));
    }
  }, [loadingItinerary]);

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
        const trimmedResponse = data.response.trim();
        const jsonMatch = trimmedResponse.match(/\{[^}]*"from_station"[^}]*"to_station"[^}]*\}/);
        if (jsonMatch) {
          try {
            const parsedJson = JSON.parse(jsonMatch[0]);
            if (
              typeof parsedJson === 'object' &&
              parsedJson !== null &&
              typeof parsedJson.from_station === 'string' &&
              typeof parsedJson.to_station === 'string'
            ) {
              setItinerary(parsedJson);
              // Fetch stop IDs for both stations
              const fetchStopId = async (stationName: string) => {
                const res = await fetch(`/api/identity/${encodeURIComponent(stationName)}`);
                if (!res.ok) return null;
                const data = await res.json();
                return data.stop_id;
              };
              const fromPromise = fetchStopId(parsedJson.from_station);
              const toPromise = fetchStopId(parsedJson.to_station);
              const [fromId, toId] = await Promise.all([fromPromise, toPromise]);
              if (fromId && toId) {
                setEndpoints({
                  departure: fromId,
                  destination: toId
                });
                console.log('Received stop IDs from chatbot:', { fromId, toId });
              } else {
                console.log('Could not find stop IDs for:', parsedJson);
                setMessages(prev => [...prev, { from: 'bot', text: "Désolé, je n'ai pas trouvé une des stations demandées. Merci de vérifier l'orthographe ou d'essayer une autre station." }]);
              }
              // Add loader message instead of JSON
              setMessages(prev => [...prev, { from: 'bot', type: 'loader' } as Message]);
              return; // Do not add the JSON message
            }
          } catch (e) {
            console.log('Error parsing JSON:', e);
          }
        } else {
          console.log('No JSON found in response:', data.response);
          // Always add the message to the chat
          setMessages(prev => [...prev, { from: 'bot', text: data.response }]);
        }
      } else {
        setMessages(prev => [...prev, { from: 'bot', text: "Désolé, je n'ai pas compris." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { from: 'bot', text: "Erreur lors de la connexion à Gemini." }]);
    }
    setLoading(false);
  };

  function isLoaderMessage(msg: Message): msg is { from: string; type: 'loader' } {
    return (msg as any).type === 'loader';
  }

  // Helper to detect if the last message is an error
  function isErrorMessage(msg: Message): boolean {
    return 'text' in msg && Boolean(msg.text) && msg.text.startsWith("Désolé, je n'ai pas trouvé une des stations demandées");
  }

  return (
    <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end">
      {!open && (
        <button
          className="bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white rounded-full p-4 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          onClick={() => setOpen(true)}
          aria-label="Open chat"
        >
          <ChatBubbleLeftRightIcon className="h-7 w-7 text-black dark:text-white" />
        </button>
      )}
      {open && (
        <div className="w-80 max-w-[90vw] h-[32rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-fast">
          {/* Header */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-5 py-3">
            <span className="font-semibold text-black dark:text-white text-base">Metro Assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-1 transition-colors">
              <XMarkIcon className="h-6 w-6 text-black dark:text-white" />
            </button>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50 dark:bg-gray-800">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-4 py-2 rounded-xl max-w-[75%] text-sm shadow-sm transition-all duration-150
                    ${msg.from === 'user'
                      ? 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700'}`}
                >
                  {isLoaderMessage(msg) || (
                    msg.from === 'bot' &&
                    loadingItinerary &&
                    idx === messages.length - 1 &&
                    !isErrorMessage(messages[messages.length - 1])
                  )
                    ? <span className='animate-spin'>⏳ Calcul de l'itinéraire...</span>
                    : 'text' in msg ? msg.text : null}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {/* Show reset button if last message is an error */}
            {messages.length > 0 && isErrorMessage(messages[messages.length - 1]) && (
              <div className="flex justify-center mt-2">
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow dark:bg-red-700 dark:hover:bg-red-800"
                  onClick={() => {
                    setMessages(mockMessages);
                    setItinerary(null);
                  }}
                >
                  Réinitialiser la conversation
                </button>
              </div>
            )}
            {/* Persistent reset button at the bottom of the chat */}
            <div className="flex justify-center mt-2">
              <button
                className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-white px-4 py-2 rounded-full shadow"
                onClick={() => {
                  setMessages(mockMessages);
                  setItinerary(null);
                }}
              >
                Réinitialiser la conversation
              </button>
            </div>
          </div>
          {/* Input */}
          <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
            <input
              type="text"
              className="flex-1 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all duration-150 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus={open}
            />
            <button
              type="submit"
              className="bg-white dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-black dark:text-white rounded-full p-2 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="h-5 w-5 rotate-90 text-black dark:text-white" />
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