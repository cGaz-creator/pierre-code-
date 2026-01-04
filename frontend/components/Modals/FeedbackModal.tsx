import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistedState } from '../../lib/hooks/usePersistedState';
import { Entreprise } from '../../lib/types';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const [feedback, setFeedback] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [storedEnt] = usePersistedState<Entreprise>('entreprise', { nom: '' });

    useEffect(() => {
        if (storedEnt.email) {
            setUserEmail(storedEnt.email);
        }
    }, [storedEnt.email, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedback.trim()) return;

        setIsSending(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiBase}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: feedback,
                    user_email: userEmail
                })
            });

            if (res.ok) {
                toast.success("Merci ! Votre avis a bien été reçu.");
                setFeedback('');
                onClose();
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            toast.error("Impossible d'envoyer l'avis.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto max-w-md h-fit bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-6 rounded-2xl shadow-2xl z-[101]"
                    >
                        <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Votre avis compte</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">Aidez-nous à améliorer Devis.ai</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Votre Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-white"
                                    placeholder="nom@exemple.com"
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <textarea
                                className="w-full h-32 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-white resize-none"
                                placeholder="Vos suggestions ou remarques..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
                                <Button type="submit" isLoading={isSending}>Envoyer</Button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
