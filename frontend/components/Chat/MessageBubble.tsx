import React from 'react';

interface MessageBubbleProps {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
    const isUser = role === 'user';
    const isSystem = role === 'system';

    if (isSystem) {
        return (
            <div className="flex justify-center my-4">
                <div className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-xs px-3 py-1 rounded-full border border-red-100 dark:border-red-800">
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all ${isUser
                ? 'bg-blue-600 text-white rounded-br-sm shadow-blue-500/10'
                : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-bl-sm shadow-zinc-200/50 dark:shadow-none'
                }`}>
                {content}
            </div>
        </div>
    );
}
