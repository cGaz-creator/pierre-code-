import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Button } from '../UI/Button';
import { Sparkles, Send, Paperclip, X } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatInterfaceProps {
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (msg: string, imageBase64?: string) => void;
}

export function ChatInterface({ messages, isLoading, onSendMessage }: ChatInterfaceProps) {
    const [input, setInput] = React.useState('');
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Extract base64 part
                const base64 = result.split(',')[1];
                setSelectedImage(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && !selectedImage) || isLoading) return;

        onSendMessage(input, selectedImage || undefined);
        setInput('');
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
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
                            Décrivez votre chantier ou envoyez une photo.
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
                {/* Image Preview */}
                {selectedImage && (
                    <div className="mb-3 flex items-start">
                        <div className="relative group">
                            <img
                                src={`data:image/jpeg;base64,${selectedImage}`}
                                alt="Preview"
                                className="h-20 w-auto rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm object-cover"
                            />
                            <button
                                onClick={() => {
                                    setSelectedImage(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-md transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex gap-3 relative max-w-4xl mx-auto items-end">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        title="Ajouter une photo"
                    >
                        <Paperclip size={20} />
                    </button>

                    <input
                        className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-zinc-400"
                        placeholder="Ex: Rénovation peinture salon 30m2..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        autoFocus
                    />
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        disabled={(!input.trim() && !selectedImage)}
                        className="rounded-lg px-6 py-3 h-auto"
                    >
                        <Send size={18} />
                    </Button>
                </form>
            </div>
        </div>
    );
}
