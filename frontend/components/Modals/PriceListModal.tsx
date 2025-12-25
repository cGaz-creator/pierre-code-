import React, { useState } from 'react';
import { PriceItem } from '../../lib/types';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { usePersistedState } from '../../lib/hooks/usePersistedState';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface PriceListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PriceListModal({ isOpen, onClose }: PriceListModalProps) {
    const [items, setItems] = usePersistedState<PriceItem[]>('price_list', []);
    const [newItem, setNewItem] = useState<Partial<PriceItem>>({ label: '', price_ht: undefined, tva: 0.2 });

    const handleAdd = () => {
        if (!newItem.label || !newItem.price_ht) {
            toast.error("Nom et prix requis");
            return;
        }
        const item: PriceItem = {
            id: Math.random().toString(36).substr(2, 9),
            label: newItem.label,
            price_ht: Number(newItem.price_ht),
            tva: Number(newItem.tva || 0.2),
            category: newItem.category
        };
        setItems([...items, item]);
        setNewItem({ label: '', price_ht: undefined, tva: 0.2, category: '' });
        toast.success("Article ajouté");
    };

    const handleRemove = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-zinc-200 dark:border-zinc-800">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Catalogue de Prix</h2>
                        <p className="text-sm text-zinc-500 mt-1">Vos tarifs de référence pour les devis</p>
                    </div>
                    <div>
                        <input
                            type="file"
                            id="price-list-upload"
                            className="hidden"
                            accept=".csv,.xlsx,.xls,.pdf,.txt"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const toastId = toast.loading('Import en cours...');
                                try {
                                    const { items: newItems } = await api.uploadPriceList(file);
                                    const mappedItems: PriceItem[] = newItems.map((i: any) => ({
                                        id: Math.random().toString(36).substr(2, 9),
                                        label: i.label || 'Article sans nom',
                                        price_ht: Number(i.price_ht) || 0,
                                        tva: Number(i.tva_rate || 0.2),
                                        category: i.category || 'Importé'
                                    }));
                                    setItems([...items, ...mappedItems]);
                                    toast.success(`${mappedItems.length} articles importés !`, { id: toastId });
                                } catch (err) {
                                    console.error(err);
                                    toast.error("Erreur lors de l'import", { id: toastId });
                                }
                            }}
                        />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById('price-list-upload')?.click()}>
                            📥 Importer un fichier
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-900">
                    <div className="space-y-3 mb-8">
                        {items.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                <p className="text-zinc-400">Votre catalogue est vide.</p>
                                <p className="text-xs text-zinc-500 mt-1">Ajoutez des articles ci-dessous.</p>
                            </div>
                        )}
                        {items.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-blue-500/30 transition-colors group">
                                <div>
                                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{item.label}</div>
                                    <div className="text-xs text-zinc-500">{item.category || 'Général'}</div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="font-mono font-medium text-zinc-900 dark:text-zinc-200">{item.price_ht.toFixed(2)} €</div>
                                        <div className="text-xs text-zinc-400">TVA {(item.tva * 100).toFixed(0)}%</div>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(item.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/30 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Ajouter un article</p>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-5">
                                <Input
                                    label="Désignation"
                                    placeholder="Ex: Pose carrelage..."
                                    value={newItem.label}
                                    onChange={e => setNewItem({ ...newItem, label: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <Input
                                    label="Prix HT (€)"
                                    type="number"
                                    placeholder="0.00"
                                    value={newItem.price_ht || ''}
                                    onChange={e => setNewItem({ ...newItem, price_ht: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Input
                                    label="TVA (ex: 0.2)"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.2"
                                    value={newItem.tva || ''}
                                    onChange={e => setNewItem({ ...newItem, tva: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Button onClick={handleAdd} disabled={!newItem.label} className="w-full">
                                    + Ajouter
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end bg-zinc-50/50 dark:bg-zinc-900/50">
                    <Button variant="ghost" onClick={onClose}>Fermer</Button>
                </div>
            </div>
        </div>
    );
}
