import React, { useState, useEffect } from 'react';
import { Devis } from '../../lib/types';
import { Button } from '../UI/Button';
import { api } from '../../lib/api';
import { Pencil, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuotePanelProps {
    devis: Devis | null;
    includeDetailedDescription: boolean;
    onToggleDescription: (val: boolean) => void;
}

export function QuotePanel({ devis, includeDetailedDescription, onToggleDescription }: QuotePanelProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);

    useEffect(() => {
        if (devis) {
            setName(devis.objet || `Devis #${devis.id.slice(0, 8)}`);
        }
    }, [devis]);

    const handleSaveName = async () => {
        if (!devis?.id || !name.trim()) return;
        setIsSavingName(true);
        try {
            await api.updateDevis(devis.id, { objet: name });
            toast.success("Nom modifié");
            setIsEditing(false);
            if (devis) devis.objet = name;
        } catch (e) {
            toast.error("Erreur modification");
        } finally {
            setIsSavingName(false);
        }
    };

    if (!devis) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-8 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
                <p className="text-sm text-center">Le devis s'affichera ici une fois créé.</p>
            </div>
        );
    }

    const handleDownload = () => {
        if (!devis.id) return;
        const url = api.getDevisPdfUrl(devis.id);
        window.open(url, '_blank');
    };

    return (
        <div className="h-full flex flex-col border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950">
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex justify-between items-start">
                    <div className="flex-1 mr-4">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={handleSaveName} disabled={isSavingName} className="p-1 hover:bg-green-100 text-green-600 rounded">
                                    <Check size={16} />
                                </button>
                                <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-red-100 text-red-500 rounded">
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group w-full">
                                <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg truncate flex-1" title={devis.objet || devis.id}>
                                    {devis.objet || `Devis #${devis.id.slice(0, 8)}`}
                                </h2>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-md text-blue-600 dark:text-blue-400 transition-all ml-2 shrink-0"
                                    title="Modifier le nom"
                                >
                                    <Pencil size={16} />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${devis.statut === 'Brouillon' ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' : 'bg-green-100 text-green-700'
                                }`}>
                                {devis.statut}
                            </span>
                            <span className="text-xs text-zinc-400">•</span>
                            <span className="text-xs text-zinc-500">{devis.lignes?.length || 0} ligne(s)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lines Scroll Area - Document Look */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200/60 dark:border-zinc-800 min-h-[300px] p-6">
                    {(!devis.lignes || devis.lignes.length === 0) && (
                        <div className="flex flex-col items-center justify-center h-40 text-zinc-400 italic text-sm">
                            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                                📄
                            </div>
                            Aucune ligne pour le moment.
                        </div>
                    )}

                    {devis.lignes?.length > 0 && (
                        <div className="space-y-4">
                            {devis.lignes.map((line, idx) => (
                                <div key={idx} className="flex justify-between items-start group py-2 border-b border-dashed border-zinc-100 dark:border-zinc-800 last:border-0">
                                    <div className="flex-1 pr-4">
                                        <div className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{line.designation}</div>
                                        <div className="text-xs text-zinc-500 mt-0.5">
                                            {line.qte} {line.unite} x {line.pu_ht ? line.pu_ht.toFixed(2) : '?'} €
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                                            {line.total_ht ? line.total_ht.toFixed(2) + ' €' : '-'}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">HT</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Totals */}
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                {/* Options */}
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                    <input
                        type="checkbox"
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        checked={includeDetailedDescription}
                        onChange={(e) => onToggleDescription(e.target.checked)}
                    />
                    Inclure description détaillée
                </label>

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
                        <span>Total HT</span>
                        <span>{devis.totaux.ht.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
                        <span>TVA ({((devis.totaux.tva / (devis.totaux.ht || 1)) * 100).toFixed(0)}% moy.)</span>
                        <span>{devis.totaux.tva.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2">
                        <span className="font-semibold text-zinc-900 dark:text-white">Total TTC</span>
                        <span className="text-2xl font-bold text-blue-600">{devis.totaux.ttc.toFixed(2)} €</span>
                    </div>
                </div>

                <Button
                    className="w-full py-3 text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
                    onClick={handleDownload}
                    disabled={devis.lignes.length === 0}
                >
                    Télécharger le PDF
                </Button>
            </div>
        </div>
    );
}
