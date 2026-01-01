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

    const startSession = useCallback(async (client?: Client, entrepriseNom?: string) => {
        setIsLoading(true);
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
    }, []);

    const sendMessage = useCallback(async (content: string, includeDetailedDescription: boolean) => {
        if (!sessionId) return;

        addMessage('user', content);
        setIsLoading(true);

        try {
            // Retrieve price list from local storage manually since we can't easily access the hook state here without prop drilling
            // But wait, we are in a hook. We can use usePersistedState here too?
            // Yes, let's import it.
            const storedPriceList = localStorage.getItem('price_list');
            const priceList = storedPriceList ? JSON.parse(storedPriceList) : [];

            const res = await api.chatTurn(sessionId, content, includeDetailedDescription, priceList);
            setDevis(res.devis);
            addMessage('assistant', res.assistant_message);
        } catch (error) {
            addMessage('system', 'Une erreur est survenue. Veuillez réessayer.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId]);

    return {
        sessionId,
        messages,
        devis,
        isLoading,
        startSession,
        sendMessage
    };
}
