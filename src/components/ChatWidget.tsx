import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const INITIAL_MESSAGE: Message = {
  role: 'bot',
  text: 'Olá! Sou a **Luiza**, sua assistente virtual do **Simulador Corretor de Elite 4.0**. Estou aqui para ajudar você a realizar vendas seguras e otimizar suas simulações. Como posso ajudar hoje?',
};

const DAILY_LIMIT = 15;
const STORAGE_KEY = 'luiza_chat_daily_count';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return 0;
    return parsed.count || 0;
  } catch {
    return 0;
  }
}

function saveCount(count: number) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), count }));
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState<number>(() => loadCount());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const limitReached = userMessageCount >= DAILY_LIMIT;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recognition.continuous = false;
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.onresult = (e: any) => {
        setInput(e.results[0][0].transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (userMessageCount >= DAILY_LIMIT) {
      toast.error('Limite de 15 perguntas dia atingido!');
      return;
    }

    const userMsg: Message = { role: 'user', text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-luiza', {
        body: { messages: updated },
      });

      if (error) throw error;
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
      setUserMessageCount(prev => {
        const next = prev + 1;
        saveCount(next);
        return next;
      });
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'bot', text: 'Desculpe, ocorreu um erro ao se comunicar com a IA. Tente novamente.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed z-[45]" style={{ bottom: '80px', right: '12px' }}>
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            key="fab"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="bg-primary text-secondary p-4 rounded-full shadow-lg hover:opacity-90 transition-opacity"
          >
            <MessageCircle size={28} />
          </motion.button>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`${
              isExpanded
                ? 'fixed inset-3 sm:inset-4'
                : 'w-[340px] sm:w-[380px] h-[480px]'
            } bg-card border-2 border-primary rounded-xl shadow-2xl flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="elite-gradient text-secondary px-4 py-3 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} />
                <h3 className="font-bold text-sm">Luiza — Elite 4.0</h3>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 hover:opacity-80 transition-opacity"
                >
                  {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button
                  onClick={() => { setIsOpen(false); setIsExpanded(false); }}
                  className="p-1 hover:opacity-80 transition-opacity"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-muted/30">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`max-w-[85%] p-2.5 rounded-lg text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground rounded-br-sm'
                      : 'mr-auto bg-card border border-border rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'bot' ? (
                    <div className="prose prose-sm max-w-none [&>p]:m-0 [&>ul]:mt-1 [&>ol]:mt-1 text-foreground">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <div className="mr-auto bg-card border border-border rounded-lg rounded-bl-sm p-2.5 max-w-[85%]">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Limit reached banner */}
            {limitReached && (
              <div className="px-3 py-2.5 border-t border-border bg-card flex-shrink-0">
                <p
                  className="text-xs text-center font-semibold leading-snug"
                  style={{ color: '#B8860B' }}
                >
                  Você atingiu o limite de 15 consultas diárias da Luiza Elite. Entre em contato para suporte completo.
                </p>
              </div>
            )}

            {/* Input */}
            <div className="p-2.5 border-t border-border bg-card flex items-center gap-1.5 flex-shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={limitReached ? 'Limite diário atingido' : 'Sua dúvida...'}
                disabled={isLoading || limitReached}
              />
              {recognitionRef.current && (
                <button
                  onClick={toggleListening}
                  disabled={limitReached}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    isListening
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Mic size={18} />
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || limitReached}
                className="p-2 rounded-lg bg-primary text-secondary hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
