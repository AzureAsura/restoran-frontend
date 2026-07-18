'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sendChatMessage } from '@/lib/queries/ai';
import { ApiError } from '@/lib/api-client';
import type { ChatMessage, ChatResponse } from '@/types/api';

interface DisplayMessage {
  id: string;
  role: ChatMessage['role'];
  content: string;
  suggestedTables?: ChatResponse['suggested_tables'];
}

const HISTORY_LIMIT = 6;

const QUICK_PROMPTS = [
  { label: 'CEK KETERSEDIAAN', message: 'Apakah ada meja kosong hari ini?' },
  { label: 'REKOMENDASI MENU', message: 'Ada rekomendasi menu apa?' },
  { label: 'FAQ RESERVASI', message: 'Bagaimana cara melakukan reservasi?' },
];

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'greeting',
      role: 'assistant',
      content: 'Halo! Selamat datang di Megatha. Ada yang bisa saya bantu terkait reservasi meja atau rekomendasi menu hari ini?',
    },
  ]);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: data.response, suggestedTables: data.suggested_tables },
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal mengirim pesan. Silakan coba lagi.');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mutation.isPending]);

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending) return;

    const history: ChatMessage[] = messages.slice(-HISTORY_LIMIT).map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: trimmed }]);
    setInput('');
    mutation.mutate({ message: trimmed, session_id: sessionId, history });
  }

  return (
    <div className="fixed bottom-[4vw] right-[4vw] md:bottom-[2vw] md:right-[2vw] z-50 font-sans">

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-[14vw] h-[14vw] md:w-[3.8vw] md:h-[3.8vw] bg-[#6E3A2F] text-white rounded-full flex items-center justify-center shadow-xl hover:bg-[#542c23] transition-all duration-300 group scale-100 active:scale-95 cursor-pointer"
        >
          <MessageSquare className="w-[6vw] h-[6vw] md:w-[1.5vw] md:h-[1.5vw] transition-transform duration-300 group-hover:rotate-12" />
        </button>
      )}

      {isOpen && (
        <div className="w-screen h-screen fixed inset-0 mobile-chat-override md:relative md:inset-auto md:w-[400px] md:h-[550px] bg-white  shadow-2xl flex flex-col rounded-none overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">


          <div className="bg-black text-white px-[5vw] py-[4vw] md:px-[1.2vw] md:py-[1vw] flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-[2.5vw] md:gap-[0.6vw]">
              <div className="flex flex-col">
                <span className="text-[3.8vw] md:text-[0.95vw] font-bold uppercase tracking-wider leading-none">
                  Asisten AI
                </span>
                <span className="text-[2.2vw] md:text-[0.6vw] text-white/50 uppercase tracking-widest mt-[0.2vw]">
                  Bantuan Online
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white p-[1vw] md:p-0 transition-colors cursor-pointer"
            >
              <X className="w-[6vw] h-[6vw] md:w-[1.2vw] md:h-[1.2vw]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-canvas p-[5vw] md:p-[1.2vw] flex flex-col gap-[4vw] md:gap-[1vw]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`w-full flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-[4vw] py-[3vw] md:px-[1vw] md:py-[0.8vw] border text-[3.5vw] md:text-[0.85vw] font-medium uppercase tracking-wide leading-[1.4] whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 border-blue-600 text-white rounded-none text-right'
                      : 'bg-white border-black/5 text-black rounded-none text-left'
                  }`}
                >
                  {msg.content}
                </div>

                {msg.suggestedTables && msg.suggestedTables.length > 0 && (
                  <div className="flex flex-wrap gap-[2vw] md:gap-[0.5vw] mt-[2vw] md:mt-[0.6vw] max-w-[85%] justify-start">
                    {msg.suggestedTables.map((table) => (
                      <div
                        key={table.id}
                        className="border border-[#6E3A2F]/30 bg-[#6E3A2F]/5 text-[#6E3A2F] text-[2.6vw] md:text-[0.62vw] font-bold uppercase tracking-wider px-[3vw] py-[1.5vw] md:px-[0.7vw] md:py-[0.35vw]"
                      >
                        {table.name} · {table.area} · {table.capacity} org
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {mutation.isPending && (
              <div className="w-full flex justify-start animate-pulse">
                <div className="bg-white border border-black/5 px-[4vw] py-[3vw] md:px-[1vw] md:py-[0.8vw] flex items-center gap-[1vw] md:gap-[0.3vw]">
                  <span className="text-[2.8vw] md:text-[0.7vw] font-bold text-black/40 uppercase tracking-widest">
                    AI SEDANG MENGETIK
                  </span>
                  <div className="flex gap-[0.5vw] md:gap-[0.15vw]">
                    <span className="w-[1vw] h-[1vw] md:w-[0.25vw] md:h-[0.25vw] bg-black/40 rounded-full animate-bounce delay-100" />
                    <span className="w-[1vw] h-[1vw] md:w-[0.25vw] md:h-[0.25vw] bg-black/40 rounded-full animate-bounce delay-200" />
                    <span className="w-[1vw] h-[1vw] md:w-[0.25vw] md:h-[0.25vw] bg-black/40 rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-canvas border-t border-black/5 px-[5vw] pt-[3vw] pb-[1vw] md:px-[1.2vw] md:pt-[0.8vw] md:pb-[0.2vw] flex flex-wrap gap-[2vw] md:gap-[0.5vw]">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => handleSend(prompt.message)}
                disabled={mutation.isPending}
                className="bg-white border border-black/10 hover:border-black text-black text-[2.8vw] md:text-[0.65vw] font-bold uppercase tracking-wider px-[3vw] py-[1.5vw] md:px-[0.8vw] md:py-[0.4vw] transition-all duration-200 active:bg-black active:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          <div className="p-[5vw] md:p-[1.2vw] bg-white border-t border-black/5 flex items-center gap-[3vw] md:gap-[0.8vw]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend(input);
              }}
              maxLength={1000}
              disabled={mutation.isPending}
              placeholder="TULIS PESAN ANDA..."
              className="flex-1 bg-transparent border-b border-black/10 focus:border-black pb-[1vw] md:pb-[0.4vw] text-[3.8vw] md:text-[0.95vw] font-medium text-black placeholder:text-black/20 focus:outline-none tracking-wide transition-colors disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => handleSend(input)}
              disabled={mutation.isPending || !input.trim()}
              className="text-black hover:text-[#6E3A2F] transition-colors p-[1vw] md:p-0 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-[5vw] h-[5vw] md:w-[1.2vw] md:h-[1.2vw]" />
            </button>
          </div>

        </div>
      )}

      <style jsx global>{`
        @media (max-w: 767px) {
          .mobile-chat-override {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;
