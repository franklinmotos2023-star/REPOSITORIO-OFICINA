import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User as UserIcon } from 'lucide-react';
import { Motorcycle } from '../types';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

type Props = {
  motorcycles: Motorcycle[];
};

export default function Chatbot({ motorcycles }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Olá! Sou seu assistente virtual. Como posso ajudar com as peças ou informações das motos hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatSession, setChatSession] = useState<any>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    const context = motorcycles.map(m => 
      `- ${m.model} (${m.brand}, ${m.year}, Placa: ${m.plate}): Status ${m.status}, Observações: ${m.observations}, Peças: ${m.parts?.map(p => p.name).join(', ') || 'Nenhuma'}`
    ).join('\n');

    const session = ai.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: `Você é um assistente virtual experiente para mecânicos de motos.
Você ajuda a identificar peças, compatibilidade entre motos e fornece informações técnicas.
Aqui estão as informações das motos atualmente na oficina do mecânico logado:
${context}
Responda de forma clara, objetiva e útil. Use formatação markdown para melhorar a legibilidade.`,
        tools: [{ googleSearch: {} }],
      }
    });
    setChatSession(session);
  }, [motorcycles]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatSession || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatSession.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response.text }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Desculpe, ocorreu um erro ao processar sua mensagem.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:scale-95 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl border border-zinc-200 font-sans">
          {/* Header */}
          <div className="flex items-center justify-between bg-zinc-950 px-5 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="bg-orange-500/20 p-1.5 rounded-full">
                <Bot size={18} className="text-orange-500" />
              </div>
              <h3 className="font-semibold text-white tracking-tight">Assistente do Mecânico</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[85%] gap-2.5 rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-br-sm shadow-sm'
                      : 'bg-white text-zinc-800 border border-zinc-200 shadow-sm rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'model' && (
                    <Bot size={16} className="mt-0.5 flex-shrink-0 text-orange-500" />
                  )}
                  <div className="text-[15px] leading-relaxed">
                    {msg.role === 'model' ? (
                      <div className="markdown-body prose prose-sm prose-orange max-w-none">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] gap-2.5 rounded-2xl rounded-bl-sm bg-white border border-zinc-200 px-4 py-3 shadow-sm">
                  <Bot size={16} className="text-orange-500" />
                  <Loader2 size={16} className="animate-spin text-zinc-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-zinc-100 bg-white p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre peças ou motos..."
                className="flex-1 rounded-full border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-[15px] text-zinc-900 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-all hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20 disabled:opacity-50 disabled:hover:bg-orange-500 active:scale-95 shadow-sm"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
