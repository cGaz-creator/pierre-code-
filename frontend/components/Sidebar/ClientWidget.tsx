import React, { useState, useEffect } from 'react';
import { Client } from '../../lib/types';
import { api } from '../../lib/api';
import { Input } from '../UI/Input';

interface ClientWidgetProps {
    currentClient: Client | null;
    onClientChange: (c: Client) => void;
    entrepriseNom?: string;
}

export function ClientWidget({ currentClient, onClientChange, entrepriseNom }: ClientWidgetProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [isEditing, setIsEditing] = useState(!currentClient);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            if (!entrepriseNom) return;
            try {
                const res = await api.searchClients(search, entrepriseNom);
                setClients(res);
            } catch (e) {
                console.error(e);
            }
        };
        const timeout = setTimeout(load, 300);
        return () => clearTimeout(timeout);
    }, [search, entrepriseNom]);

    // If currentClient changes to null externally, allow editing
    useEffect(() => {
        if (!currentClient) setIsEditing(true);
    }, [currentClient]);

    const handleSelect = (c: Client) => {
        onClientChange(c);
        setIsEditing(false);
        setSearch('');
    };

    const handleCreate = () => {
        const newClient: Client = {
            nom: search,
            client_type: 'particulier',
            entreprise_nom: entrepriseNom
        };
        onClientChange(newClient);
        setClients(prev => [newClient, ...prev]);
        setIsEditing(false);
    };

    if (!isEditing && currentClient) {
        return (
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Client</h3>
                    <button onClick={() => setIsEditing(true)} className="text-xs text-blue-600 hover:underline">Modifier</button>
                </div>
                <div className="font-medium">{currentClient.nom}</div>
                <div className="text-xs text-zinc-500">{currentClient.email || 'Pas d\'email'}</div>
            </div>
        );
    }

    return (
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Client</h3>
            <div className="relative">
                <Input
                    placeholder="Rechercher un client..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus={isEditing}
                />
                {(search || clients.length > 0) && (
                    <div className="absolute top-full left-0 right-0 max-h-60 overflow-y-auto bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg mt-1 shadow-lg z-10">
                        {clients.map((c, i) => (
                            <button
                                key={i}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 truncate block border-b border-zinc-50 dark:border-zinc-800 last:border-0"
                                onClick={() => handleSelect(c)}
                            >
                                {c.nom}
                            </button>
                        ))}
                        {search && (
                            <button
                                className="w-full text-left px-3 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-zinc-100 dark:border-zinc-700"
                                onClick={handleCreate}
                            >
                                + Créer "{search}"
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
