import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mail } from 'lucide-react';
import { Button } from '../UI/Button';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    devisId: string;
    clientEmail?: string;
    devisObjet?: string;
}

export function SendEmailModal({ isOpen, onClose, devisId, clientEmail, devisObjet }: SendEmailModalProps) {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTo(clientEmail || '');
            setSubject(`Votre Devis ${devisObjet ? '- ' + devisObjet : ''}`);
            setMessage(`Bonjour,\n\nVeuillez trouver ci-joint votre devis.\n\nCordialement,`);
        }
    }, [isOpen, clientEmail, devisObjet]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.sendDevisEmail(devisId, { to_email: to, subject, message });
            toast.success("Email envoyé avec succès !");
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors de l'envoi");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Mail className="w-5 h-5 text-blue-500" /> Envoyer par Email
                            </h3>
                            <button onClick={onClose}><X className="w-5 h-5 text-zinc-400" /></button>
                        </div>

                        <form onSubmit={handleSend} className="p-4 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500">Destinataire</label>
                                <input
                                    type="email"
                                    required
                                    value={to}
                                    onChange={e => setTo(e.target.value)}
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="client@email.com"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500">Sujet</label>
                                <input
                                    required
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500">Message</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <Button variant="ghost" onClick={onClose} type="button">Annuler</Button>
                                <Button type="submit" isLoading={isLoading}>
                                    <Send className="w-4 h-4 mr-2" /> Envoyer
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
