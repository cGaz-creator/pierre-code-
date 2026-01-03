import { useState, useCallback } from 'react';
import { api } from '../api';
import { Devis, Client } from '../types';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export function useChatSession() {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [devis, setDevis] = useState<Devis | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const addMessage = (role: Message['role'], content: string) => {
        setMessages(prev => [...prev, { role, content }]);
    };

    const resetSession = useCallback(() => {
        setSessionId(null);
        setMessages([]);
        setDevis(null);
    }, []);

    const [currentEntNom, setCurrentEntNom] = useState<string>('');

    const startSession = useCallback(async (client?: Client, entrepriseNom?: string) => {
        resetSession();
        setIsLoading(true);
        if (entrepriseNom) setCurrentEntNom(entrepriseNom);
        try {
            const res = await api.startChat(client?.id, client, undefined, entrepriseNom);
            setSessionId(res.session_id);
            setDevis(res.devis);
            addMessage('assistant', res.assistant_message);
        } catch (error) {
            addMessage('system', 'Impossible de démarrer la session. Vérifiez votre connexion.');
        } finally {
            setIsLoading(false);
        }
    }, [resetSession]);

    const sendMessage = useCallback(async (content: string, includeDetailedDescription: boolean, imageBase64?: string) => {
        if (!sessionId) return;

        addMessage('user', content || (imageBase64 ? "Envoi d'une image..." : ""));
        setIsLoading(true);

        try {
            // Fetch real catalog from DB if enterprise is known
            let priceList: any[] = [];
            if (currentEntNom) {
                try {
                    priceList = await api.listCatalog(currentEntNom);
                } catch (e) {
                    console.warn("Failed to fetch catalog for chat context", e);
                }
            }

            const res = await api.chatTurn(sessionId, content, includeDetailedDescription, priceList, imageBase64);
            setDevis(res.devis);
            addMessage('assistant', res.assistant_message);
        } catch (error) {
            addMessage('system', 'Une erreur est survenue. Veuillez réessayer.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, currentEntNom]);

    return {
        sessionId,
        messages,
        devis,
        isLoading,
        startSession,
        sendMessage,
        resetSession
    };
}
