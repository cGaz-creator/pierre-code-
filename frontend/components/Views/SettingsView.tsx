import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Entreprise } from '../../lib/types';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { Building2, MapPin, Mail, Phone, FileDigit, Globe, Image as ImageIcon, Check, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '../UI/Button';

interface SettingsViewProps {
    currentEntreprise: Entreprise;
    onUpdate: (updated: Entreprise) => void;
    onBack: () => void;
    onLogout: () => void;
}

export function SettingsView({ currentEntreprise, onUpdate, onBack, onLogout }: SettingsViewProps) {
    const [formData, setFormData] = useState<Entreprise>(currentEntreprise);
    const [isLoading, setIsLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Update local state when prop changes, but only if we are not editing (avoid overwrite loop)
    useEffect(() => {
        // Simple check to avoid overwriting if user has unsaved changes. 
        // Ideally we trust local state over prop during edit session.
    }, [currentEntreprise]);

    const handleChange = (field: keyof Entreprise, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!formData.id) return;
        setIsLoading(true);
        try {
            // Remove password/id from update payload usually, but Partial<Entreprise> handles it.
            // API ignores extra fields or we clean it. Ideally backend ignores ID in body if passed.
            const { password, id, ...updateData } = formData;

            const updated = await api.updateEntreprise(formData.id, updateData);
            onUpdate(updated);
            setHasChanges(false);
            toast.success("Informations mises à jour !");
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors de la sauvegarde.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto p-6 pb-24"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-zinc-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Paramètres Entreprise</h1>
                        <p className="text-sm text-zinc-500">Gérez vos informations légales et vos préférences</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={onLogout}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                    </Button>
                    <Button
                        onClick={handleSave}
                        isLoading={isLoading}
                        disabled={!hasChanges}
                        className={!hasChanges ? "opacity-50" : ""}
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Enregistrer
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Navigation / Summary (Optional, for now just form sections) */}
                <div className="md:col-span-3 space-y-6">

                    {/* Identité */}
                    <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-500" /> Identité
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500">Nom Entreprise</label>
                                <input
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                                    value={formData.nom}
                                    onChange={e => handleChange('nom', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500">Forme Juridique</label>
                                <input
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                                    placeholder="SAS, SARL..."
                                    value={formData.forme || ''}
                                    onChange={e => handleChange('forme', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500">SIRET</label>
                                <div className="relative">
                                    <FileDigit className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                                    <input
                                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg font-mono text-sm"
                                        value={formData.siret || ''}
                                        onChange={e => handleChange('siret', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500">Logo (URL)</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                                    <input
                                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                                        placeholder="https://..."
                                        value={formData.logo_url || ''}
                                        onChange={e => handleChange('logo_url', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Coordonnées */}
                    <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-emerald-500" /> Coordonnées
                        </h2>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500">Adresse Complète</label>
                                <input
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                                    value={formData.adresse || ''}
                                    onChange={e => handleChange('adresse', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-zinc-500">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                                        <input
                                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                                            value={formData.email || ''}
                                            onChange={e => handleChange('email', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-zinc-500">Téléphone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                                        <input
                                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                                            value={formData.tel || formData.telephone || ''}
                                            onChange={e => handleChange('tel', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Mentions Légales & Banque */}
                    <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-purple-500" /> Fiscalité & Banque
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500">TVA Intracom</label>
                                <input
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                                    value={formData.tva_intracom || ''}
                                    onChange={e => handleChange('tva_intracom', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500">RCS / RM</label>
                                <input
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                                    value={formData.rm_rcs || ''}
                                    onChange={e => handleChange('rm_rcs', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-semibold text-zinc-500">IBAN</label>
                                <input
                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg font-mono"
                                    value={formData.iban || ''}
                                    onChange={e => handleChange('iban', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-semibold text-zinc-500">Assurance Décennale (Nom & Contact)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                                        placeholder="Nom (ex: AXA)"
                                        value={formData.assurance_nom || ''}
                                        onChange={e => handleChange('assurance_nom', e.target.value)}
                                    />
                                    <input
                                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                                        placeholder="Contact / Zone"
                                        value={formData.assurance_contact || ''}
                                        onChange={e => handleChange('assurance_contact', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </motion.div>
    );
}
