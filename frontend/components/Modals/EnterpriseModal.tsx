import React, { useEffect, useState } from 'react';
import { Entreprise } from '../../lib/types';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { api } from '../../lib/api';
import { usePersistedState } from '../../lib/hooks/usePersistedState';

interface EnterpriseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EnterpriseModal({ isOpen, onClose }: EnterpriseModalProps) {
    const [storedEnt, setStoredEnt] = usePersistedState<Entreprise>('entreprise', {
        nom: '', adresse: '', siret: '', email: '', tel: ''
    });
    const [form, setForm] = useState<Entreprise>(storedEnt);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) setForm(storedEnt);
    }, [isOpen, storedEnt]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Save to local storage
            setStoredEnt(form);
            // Sync with backend
            // await api.upsertEntreprise(form); // TODO: Implement update endpoint
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold">Mon Entreprise</h2>
                    <p className="text-sm text-zinc-500 mt-1">Ces informations apparaîtront sur vos devis.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                        label="Nom de l'entreprise"
                        value={form.nom}
                        onChange={e => setForm({ ...form, nom: e.target.value })}
                        required
                    />

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Logo</label>
                        <div className="flex items-center gap-4">
                            {form.logo_url && (
                                <img src={form.logo_url} alt="Logo" className="h-12 w-12 object-contain rounded border border-zinc-200 bg-white" />
                            )}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            const { url } = await api.uploadFile(file);
                                            setForm(prev => ({ ...prev, logo_url: url }));
                                        } catch (err) {
                                            console.error('Upload failed', err);
                                            alert('Erreur lors de l\'upload du logo');
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500">Formats supportés: PNG, JPG, WEBP</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="SIRET"
                            value={form.siret || ''}
                            onChange={e => setForm({ ...form, siret: e.target.value })}
                        />
                        <Input
                            label="TVA Intracom (optionnel)"
                            value={form.tva_intracom || ''}
                            onChange={e => setForm({ ...form, tva_intracom: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Adresse complète"
                        value={form.adresse || ''}
                        onChange={e => setForm({ ...form, adresse: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Email"
                            type="email"
                            value={form.email || ''}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                        <Input
                            label="Téléphone"
                            value={form.tel || ''}
                            onChange={e => setForm({ ...form, tel: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
                        <Button type="submit" isLoading={isLoading}>Enregistrer</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
