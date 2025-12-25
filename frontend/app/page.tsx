'use client';

import React, { useState } from 'react';
import { ChatInterface } from '../components/Chat/ChatInterface';
import { QuotePanel } from '../components/Sidebar/QuotePanel';
import { ClientWidget } from '../components/Sidebar/ClientWidget';
import { EnterpriseModal } from '../components/Modals/EnterpriseModal';
import { PriceListModal } from '../components/Modals/PriceListModal';
import { FeedbackModal } from '../components/Modals/FeedbackModal';
import { Button } from '../components/UI/Button';
import { ThemeToggle } from '../components/UI/ThemeToggle';
import { useChatSession } from '../lib/hooks/useChatSession';
import { usePersistedState } from '../lib/hooks/usePersistedState';
import { Entreprise, Client } from '../lib/types';
import { AnimateTransition } from '../components/UI/AnimateTransition';
import { MessageSquarePlus, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

// Views
import { HomeView } from '../components/Views/HomeView';
import { EnterpriseView } from '../components/Views/EnterpriseView';
import { ClientView } from '../components/Views/ClientView';
import { QuoteHistoryPanel } from '../components/Sidebar/QuoteHistoryPanel';

type ViewState = 'HOME' | 'ENTERPRISE' | 'CLIENT' | 'CHAT';

export default function HomePage() {
    const {
        sessionId, messages, devis, isLoading,
        startSession, sendMessage
    } = useChatSession();

    // Reverted to clean state - no default enterprise
    const [storedEnt, setStoredEnt] = usePersistedState<Entreprise>('entreprise', { nom: '' });
    const [view, setView] = useState<ViewState>('HOME');
    const [currentClient, setCurrentClient] = useState<Client | null>(null);

    const [showEntModal, setShowEntModal] = useState(false);
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [includeDetails, setIncludeDetails] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'CURRENT' | 'HISTORY'>('CURRENT');

    // Auto-redirect if enterprise is set while in ENTERPRISE view
    React.useEffect(() => {
        if (storedEnt.nom && view === 'ENTERPRISE') {
            setView('CLIENT');
        }
    }, [storedEnt.nom, view]);

    // Flow Management
    const handleStart = () => {
        // Strict flow: If no enterprise, forcing enterprise creation.
        // Professional tools requires setup.
        if (!storedEnt.nom) {
            setView('ENTERPRISE');
        } else {
            setView('CLIENT');
        }
    };

    const handleEnterpriseSubmit = (ent: Entreprise) => {
        setStoredEnt(ent);
        setView('CLIENT');
    };

    const handleClientSubmit = (client: Client) => {
        setCurrentClient(client);
        setView('CHAT');
        try {
            startSession(client);
            toast.success("IA Connectée");
        } catch (e) {
            toast.error("Erreur connexion");
        }
    };

    // Render Content based on View
    const renderContent = () => {
        switch (view) {
            case 'HOME':
                return <AnimateTransition key="home"><HomeView onStart={handleStart} /></AnimateTransition>;
            case 'ENTERPRISE':
                return <AnimateTransition key="ent"><EnterpriseView initialData={storedEnt} onNext={handleEnterpriseSubmit} /></AnimateTransition>;
            case 'CLIENT':
                return <AnimateTransition key="client"><ClientView onNext={handleClientSubmit} onBack={() => setView('HOME')} entrepriseNom={storedEnt.nom} /></AnimateTransition>;
            case 'CHAT':
                return (
                    <AnimateTransition key="chat" className="flex h-full">
                        {/* Left: Chat */}
                        <div className="flex-1 flex flex-col min-w-0 mx-auto w-full p-0 md:p-4 bg-zinc-50/50 dark:bg-black/20">
                            <ChatInterface
                                messages={messages}
                                isLoading={isLoading}
                                onSendMessage={(msg) => sendMessage(msg, includeDetails)}
                            />
                        </div>

                        {/* Right: Sidebar */}
                        <div className="w-[400px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0 hidden xl:flex">
                            <ClientWidget
                                currentClient={currentClient}
                                onClientChange={setCurrentClient}
                                entrepriseNom={storedEnt.nom}
                            />

                            {/* Tabs */}
                            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                                <button
                                    onClick={() => setSidebarTab('CURRENT')}
                                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${sidebarTab === 'CURRENT'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                                        }`}
                                >
                                    En cours
                                </button>
                                <button
                                    onClick={() => setSidebarTab('HISTORY')}
                                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${sidebarTab === 'HISTORY'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                                        }`}
                                >
                                    Historique
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                {sidebarTab === 'CURRENT' ? (
                                    <QuotePanel
                                        devis={devis}
                                        includeDetailedDescription={includeDetails}
                                        onToggleDescription={setIncludeDetails}
                                    />
                                ) : (
                                    <QuoteHistoryPanel entrepriseNom={storedEnt.nom} />
                                )}
                            </div>
                        </div>
                    </AnimateTransition>
                );
        }
    };

    return (
        <div className="flex flex-col h-screen font-sans text-base transition-colors duration-300">
            {/* Header */}
            <header className="h-20 bg-white/90 dark:bg-black/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 shrink-0 z-50 sticky top-0 transition-colors duration-300">
                <div
                    className="font-bold text-2xl tracking-tighter cursor-pointer hover:opacity-80 transition"
                    onClick={() => setView('HOME')}
                >
                    <span className="text-zinc-900 dark:text-white">Devis</span>
                    <span className="text-blue-600">.ai</span>
                </div>

                {/* Central Navigation */}
                <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                    <button
                        onClick={() => {
                            if (view !== 'HOME') setView('HOME');
                            setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 100);
                        }}
                        className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                    >
                        Fonctionnalités
                    </button>
                    <button
                        onClick={() => setShowPriceModal(true)}
                        className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                    >
                        Mon Catalogue
                    </button>
                    <a
                        href="mailto:contact@devis.ai"
                        className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                    >
                        Contact
                    </a>
                </nav>

                <div className="flex items-center gap-4">
                    {/* Enterprise Menu -> Logout */}
                    {storedEnt.nom && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-full border border-zinc-200 dark:border-zinc-700">
                            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 max-w-[100px] truncate">
                                {storedEnt.nom}
                            </span>
                            <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 mx-1"></div>
                            <button
                                onClick={() => {
                                    setStoredEnt({ nom: '' });
                                    setView('ENTERPRISE');
                                    toast.success("Déconnexion réussie");
                                }}
                                className="text-zinc-400 hover:text-red-500 transition-colors"
                                title="Se déconnecter"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium"
                    >
                        Feedback
                    </button>

                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800"></div>

                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-zinc-50 dark:bg-black transition-colors duration-300">
                {renderContent()}
            </main>

            {/* Modals */}
            <EnterpriseModal isOpen={showEntModal} onClose={() => setShowEntModal(false)} />
            <PriceListModal isOpen={showPriceModal} onClose={() => setShowPriceModal(false)} />
            <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
        </div>
    );
}
