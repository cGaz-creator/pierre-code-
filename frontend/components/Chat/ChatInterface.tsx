import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Button } from '../UI/Button';
import { Sparkles, Send } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatInterfaceProps {
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (msg: string) => void;
}

export function ChatInterface({ messages, isLoading, onSendMessage }: ChatInterfaceProps) {
    const [input, setInput] = React.useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-none md:rounded-xl shadow-sm border-0 md:border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 p-8 opacity-60">
                        <Sparkles className="w-12 h-12 mb-4 text-zinc-300 dark:text-zinc-700" strokeWidth={1} />
                        <h3 className="font-medium text-lg text-zinc-900 dark:text-zinc-100 mb-2">Prêt à chiffrer</h3>
                        <p className="max-w-xs mx-auto text-sm">
                            Décrivez votre chantier. L'assistant générera les lignes.
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <MessageBubble key={idx} role={msg.role} content={msg.content} />
                ))}

                {isLoading && <TypingIndicator />}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                <form onSubmit={handleSubmit} className="flex gap-3 relative max-w-4xl mx-auto">
                    <input
                        className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-zinc-400"
                        placeholder="Ex: Rénovation peinture salon 30m2 avec préparation des murs..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        autoFocus
                    />
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        disabled={!input.trim()}
                        className="rounded-lg px-6"
                    >
                        <Send size={18} />
                    </Button>
                </form>
            </div>
        </div>
    );
}
