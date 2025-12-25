import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Devis } from '../../lib/types';
import { FileText, Download, Calendar, Loader2 } from 'lucide-react';

interface QuoteHistoryPanelProps {
    entrepriseNom: string;
}

export function QuoteHistoryPanel({ entrepriseNom }: QuoteHistoryPanelProps) {
    const [quotes, setQuotes] = useState<Devis[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!entrepriseNom) return;
            setIsLoading(true);
            try {
                const res = await api.listDevis(entrepriseNom);
                setQuotes(res);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [entrepriseNom]);

    const handleDownload = (id: string) => {
        if (!id) return;
        const url = api.getDevisPdfUrl(id);
        window.open(url, '_blank');
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-8 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-sm">Chargement de l'historique...</p>
            </div>
        );
    }

    if (quotes.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-8 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <FileText className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm text-center">Aucun devis dans l'historique de {entrepriseNom}.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">Historique</h2>
                <div className="text-xs text-zinc-500 mt-1">{quotes.length} devis trouvés</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {quotes.map((devis) => (
                    <div
                        key={devis.id}
                        className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-xs text-zinc-400">{devis.id.slice(0, 10)}...</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${devis.statut === 'Validé' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
                                }`}>
                                {devis.statut || 'Brouillon'}
                            </span>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                                    {devis.client?.nom || "Client inconnu"}
                                </div>
                                <div className="flex items-center text-xs text-zinc-500">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(devis.date).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-blue-600">
                                    {devis.totaux?.ttc ? devis.totaux.ttc.toFixed(2) + ' €' : '-'}
                                </div>
                                <button
                                    onClick={() => handleDownload(devis.id)}
                                    className="mt-2 text-xs flex items-center gap-1 text-zinc-400 hover:text-blue-600 transition-colors"
                                >
                                    <Download className="w-3 h-3" /> PDF
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
