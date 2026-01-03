import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PriceItem } from '../../lib/types';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { Search, Plus, Trash2, Edit2, X, Tag, FileDigit, Euro } from 'lucide-react';
import { Button } from '../UI/Button';

interface CatalogViewProps {
    entrepriseNom: string;
    entrepriseId?: number;
    onBack: () => void;
}

export function CatalogView({ entrepriseNom, entrepriseId, onBack }: CatalogViewProps) {
    const [items, setItems] = useState<PriceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PriceItem | null>(null);
    const [formData, setFormData] = useState<Partial<PriceItem>>({
        label: '', price_ht: 0, unit: 'u', category: 'Main d\'oeuvre', tva: 20
    });

    useEffect(() => {
        loadCatalog();
    }, [entrepriseNom]);

    const loadCatalog = async () => {
        setIsLoading(true);
        try {
            const data = await api.listCatalog(entrepriseNom);
            setItems(data);
        } catch (err) {
            console.error(err);
            toast.error("Erreur chargement catalogue");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData, entreprise_id: undefined } as PriceItem;
            // Note: backend infers entreprise from session or we pass ID. 
            // Ideally we need enterprise ID. Let's assume backend helps us or we fetch it.
            // Actually, my router expects entreprise_id in body for POST.
            // But from frontend we might not have ID handy if strictly using names. 
            // Let's assume we rely on the backend finding valid Ent by session or we need to pass ID.
            // Since we are not strictly using ID in props... let's fix this gap:
            // The listCatalog uses name, but createItem needs ID.
            // I will rely on the fact that I stored full entreprise object in Page.tsx state
            // and maybe I should pass ID here. For now I'll require user to select enterprise logic backend side
            // OR I fetch enterprise ID via name first? 
            // Correction: I should pass full enterprise object to this view preferably.
            // Hack for now: I will fetch list, and if list is empty I might not know ID.
            // Better: I'll use the API to look up ID or pass it.
            // Actually `api.listCatalog` uses name. `api.createCatalog` sends `PriceItem`.
            // I'll make backend search Enterprise by name if ID missing? No, that's sloppy.
            // Let's update `CatalogViewProps` to take `entrepriseId` if possible.
            // Wait, I designed `PriceItem` model with `entreprise_id`.

            // Temporary Fix: I will assume the parent passes the ID.
            // Wait, `onBack` is there. I'll ask parent for ID.

            // For this specific iteration, I'll trust `api.ts` to handle it? No.
            // Let's rely on `loadCatalog` result? No because it might be empty.

            // I will add `entrepriseId` to props in next step. For now let's build UI.

            if (editingItem && editingItem.id) {
                await api.updateCatalogItem(editingItem.id, payload);
                toast.success("Article modifié");
            } else {
                if (!payload.entreprise_id) {
                    // Try to use prop
                    if (entrepriseId) payload.entreprise_id = entrepriseId;
                    else throw new Error("ID Entreprise manquant");
                }
                await api.createCatalogItem(payload);
                toast.success("Article créé");
            }
            closeModal();
            loadCatalog();
        } catch (err) {
            console.error(err);
            toast.error("Erreur sauvegarde");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Supprimer cet article ?")) return;
        try {
            await api.deleteCatalogItem(id);
            toast.success("Supprimé");
            loadCatalog();
        } catch (err) {
            toast.error("Erreur suppression");
        }
    };

    const openModal = (item?: PriceItem) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            setFormData({ label: '', price_ht: 0, unit: 'u', category: 'Main d\'oeuvre', tva: 20 });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const filteredItems = items.filter(i =>
        i.label.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 max-w-6xl mx-auto h-full flex flex-col"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Catalogue
                    </h1>
                    <p className="text-sm text-zinc-500">Gérez vos prix de référence</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onBack}>Retour</Button>
                    <Button onClick={() => openModal()}>
                        <Plus className="w-4 h-4 mr-2" /> Nouveau
                    </Button>
                </div>
            </div>

            <div className="mb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input
                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Rechercher un article..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-medium sticky top-0">
                        <tr>
                            <th className="px-6 py-3">Désignation</th>
                            <th className="px-6 py-3">Catégorie</th>
                            <th className="px-6 py-3 text-right">Prix HT</th>
                            <th className="px-6 py-3 text-right">TVA</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-100">{item.label}</td>
                                <td className="px-6 py-3">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        {item.category}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right whitespace-nowrap">
                                    {item.price_ht.toFixed(2)} € / {item.unit}
                                </td>
                                <td className="px-6 py-3 text-right">{item.tva}%</td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(item)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-blue-500">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id!)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredItems.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-zinc-400">
                                    Aucun article trouvé. Ajoutez-en un !
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                                <h3 className="font-bold text-lg">{editingItem ? 'Modifier' : 'Nouvel Article'}</h3>
                                <button onClick={closeModal}><X className="w-5 h-5 text-zinc-400" /></button>
                            </div>
                            <form onSubmit={handleSave} className="p-4 space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-500">Désignation</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2 mt-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: Pose de fenêtre"
                                        value={formData.label}
                                        onChange={e => setFormData({ ...formData, label: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500">Prix HT</label>
                                        <div className="relative">
                                            <Euro className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                                            <input
                                                required
                                                type="number"
                                                step="0.01"
                                                className="w-full pl-9 pr-4 py-2 mt-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                                value={formData.price_ht}
                                                onChange={e => setFormData({ ...formData, price_ht: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500">Unité</label>
                                        <select
                                            className="w-full px-4 py-2 mt-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.unit}
                                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                        >
                                            <option value="u">u (Unité)</option>
                                            <option value="m2">m²</option>
                                            <option value="ml">ml (Mètre linéaire)</option>
                                            <option value="h">h (Heure)</option>
                                            <option value="ens">ens (Ensemble)</option>
                                            <option value="fft">fft (Forfait)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500">Catégorie</label>
                                        <input
                                            className="w-full px-4 py-2 mt-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ex: Main d'oeuvre"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500">TVA (%)</label>
                                        <select
                                            className="w-full px-4 py-2 mt-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.tva}
                                            onChange={e => setFormData({ ...formData, tva: parseFloat(e.target.value) })}
                                        >
                                            <option value="20">20%</option>
                                            <option value="10">10%</option>
                                            <option value="5.5">5.5%</option>
                                            <option value="0">0%</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end gap-2">
                                    <Button variant="ghost" onClick={closeModal} type="button">Annuler</Button>
                                    <Button type="submit">Enregistrer</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
