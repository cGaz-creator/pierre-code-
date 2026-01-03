import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Client } from '../../lib/types';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface ClientViewProps {
    onNext: (client: Client) => void;
    onBack: () => void;
    entrepriseNom?: string;
}

export function ClientView({ onNext, onBack, entrepriseNom }: ClientViewProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
    const [search, setSearch] = useState('');

    // Form state
    const [form, setForm] = useState<Client>({
        nom: '',
        client_type: 'particulier',
        email: '',
        tel: '',
        adresse: '',
        adresse_chantier: '',
        entreprise_nom: entrepriseNom
    });

    const [isSearching, setIsSearching] = useState(false);

    // Search Effect
    useEffect(() => {
        const load = async () => {
            if (!entrepriseNom) return;
            setIsSearching(true);
            try {
                const results = await api.searchClients(search, entrepriseNom);
                setClients(results);
            } catch (err) {
                console.error(err);
                if (search) toast.error("Erreur recherche");
            } finally {
                setIsSearching(false);
            }
        };

        if (search) {
            // Debounce for typing
            const timer = setTimeout(load, 300);
            return () => clearTimeout(timer);
        } else {
            // Instant load for list (no debounce)
            load();
        }
    }, [search, entrepriseNom]);

    const handleStartCreate = () => {
        setForm({
            nom: search,
            client_type: 'particulier',
            email: '',
            tel: '',
            adresse: '',
            adresse_chantier: '',
            entreprise_nom: entrepriseNom
        });
        setViewMode('FORM');
    };

    const handleEdit = (c: Client) => {
        setForm(c);
        setViewMode('FORM');
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nom) return toast.error("Le nom est obligatoire");

        // We assume backend handles saving/updating on chat start, 
        // or we could explicit upsert here if we had an endpoint.
        // For now, passing to onNext is sufficient as startChat handles it.
        toast.success("Client sélectionné !");
        onNext(form);
    };

    if (viewMode === 'FORM') {
        return (
            <div className="max-w-2xl mx-auto w-full p-6 animate-fade-in pb-32">
                <Button variant="ghost" size="sm" onClick={() => setViewMode('LIST')} className="mb-6 -ml-2 text-zinc-500">
                    ← Retour liste
                </Button>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4 font-bold text-xl">
                        2
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Détails du Client</h2>
                    <p className="text-zinc-500">Pour qui réalisez-vous ce devis ?</p>
                </div>

                <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 space-y-6">
                    <Input
                        label="Nom ou Raison sociale *"
                        value={form.nom}
                        onChange={e => setForm({ ...form, nom: e.target.value })}
                        required
                        autoFocus
                    />

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-0.5">Type de client</label>
                            <div className="relative">
                                <select
                                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white transition-all appearance-none"
                                    value={form.client_type}
                                    onChange={e => setForm({ ...form, client_type: e.target.value })}
                                >
                                    <option value="particulier">Particulier</option>
                                    <option value="pro">Professionnel</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>
                        <Input
                            label="Email"
                            type="email"
                            value={form.email || ''}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>

                    <Input
                        label="Téléphone"
                        value={form.tel || ''}
                        onChange={e => setForm({ ...form, tel: e.target.value })}
                    />

                    <Input
                        label="Adresse de facturation"
                        value={form.adresse || ''}
                        onChange={e => setForm({ ...form, adresse: e.target.value })}
                    />

                    <Input
                        label="Adresse du chantier (si différente)"
                        value={form.adresse_chantier || ''}
                        onChange={e => setForm({ ...form, adresse_chantier: e.target.value })}
                    />

                    <div className="pt-6">
                        <Button type="submit" className="w-full text-lg py-4" size="lg">
                            Valider et Démarrer le Devis →
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    // Display List (API results are already filtered)
    const filtered = clients;

    return (
        <div className="max-w-2xl mx-auto w-full p-6 animate-fade-in pb-32">
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-6 -ml-2 text-zinc-500">
                ← Retour accueil
            </Button>

            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4 font-bold text-xl">
                    2
                </div>
                <h2 className="text-3xl font-bold mb-2">Sélection du Client</h2>
                <p className="text-zinc-500">Recherchez un client existant ou créez-en un nouveau.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 space-y-8">
                <div className="space-y-4">
                    <label className="text-sm font-semibold ml-1">Recherche</label>
                    <div className="flex gap-3">
                        <Input
                            placeholder="Tapez un nom..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                            className="flex-1"
                        />
                        <Button onClick={handleStartCreate} disabled={!search} variant={search ? "primary" : "secondary"}>
                            Créer
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <span>{search ? 'Résultats de recherche' : 'Clients Récents'}</span>
                        {isSearching && <span className="text-blue-500">Chargement...</span>}
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {filtered.map((c, i) => (
                            <div
                                key={i}
                                className="group w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all flex justify-between items-center cursor-pointer"
                                onClick={() => onNext(c)}
                            >
                                <div>
                                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{c.nom}</div>
                                    <div className="text-xs text-zinc-500">{c.email || 'Sans email'} • {c.client_type}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(c); }}
                                        className="text-xs font-medium text-zinc-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                    >
                                        Modifier
                                    </button>
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-blue-600 shadow-sm">
                                        →
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filtered.length === 0 && !search && (
                            <div className="text-center py-12 text-zinc-400">
                                <p>Aucun client récent.</p>
                            </div>
                        )}
                        {filtered.length === 0 && search && !isSearching && (
                            <div className="text-center py-8 text-zinc-500">
                                <p>Aucun résultat.</p>
                                <Button variant="ghost" onClick={handleStartCreate} className="mt-2 text-blue-600">
                                    Créer "{search}" ?
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
