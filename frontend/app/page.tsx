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
import { MessageSquarePlus, LogOut, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Views
import { HomeView } from '../components/Views/HomeView';
import { EnterpriseView } from '../components/Views/EnterpriseView';
import { ClientView } from '../components/Views/ClientView';
import { QuoteHistoryPanel } from '../components/Sidebar/QuoteHistoryPanel';
import { SettingsView } from '../components/Views/SettingsView';
import { CatalogView } from '../components/Views/CatalogView';

type ViewState = 'HOME' | 'ENTERPRISE' | 'CLIENT' | 'CHAT' | 'SETTINGS' | 'CATALOG';

export default function HomePage() {
    const {
        sessionId, messages, devis, isLoading,
        startSession, sendMessage, resetSession
    } = useChatSession();

    const [storedEnt, setStoredEnt] = usePersistedState<Entreprise>('entreprise', { nom: '' });
    const currentTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : 'light'; // Simple check, or rely on ThemeToggle context if available. 
    // Actually ThemeToggle handles theme, so we don't need to manually read here usually, but for icons color maybe.

    const [view, setView] = useState<ViewState>('HOME');
    const [currentClient, setCurrentClient] = useState<Client | null>(null);

    // Mobile States
    const [mobileTab, setMobileTab] = useState<'CHAT' | 'QUOTE'>('CHAT');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            startSession(client, storedEnt.nom);
            toast.success("IA Connectée");
        } catch (e) {
            toast.error("Erreur connexion");
        }
    };

    const handleLogout = () => {
        setStoredEnt({ nom: '' });
        setView('ENTERPRISE');
        resetSession();
        setIsMobileMenuOpen(false);
        toast.success("Déconnexion réussie");
    };

    // Render Content based on View
    const renderContent = () => {
        switch (view) {
            case 'HOME':
                return <AnimateTransition key="home"><HomeView onStart={handleStart} /></AnimateTransition>;
            case 'ENTERPRISE':
                return <AnimateTransition key="ent"><EnterpriseView initialData={storedEnt} onNext={handleEnterpriseSubmit} /></AnimateTransition>;
            case 'SETTINGS':
                return (
                    <AnimateTransition key="settings">
                        <SettingsView
                            currentEntreprise={storedEnt}
                            onUpdate={setStoredEnt}
                            onBack={() => setView('HOME')} // Or previous view
                            onLogout={handleLogout}
                        />
                    </AnimateTransition>
                );
            case 'CLIENT':
                return <AnimateTransition key="client"><ClientView onNext={handleClientSubmit} onBack={() => setView('HOME')} entrepriseNom={storedEnt.nom} /></AnimateTransition>;
            case 'CHAT':
                return (
                    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
                        {/* Mobile Tabs */}
                        <div className="xl:hidden flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-40">
                            <button
                                onClick={() => setMobileTab('CHAT')}
                                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${mobileTab === 'CHAT'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-zinc-500 dark:text-zinc-400'
                                    }`}
                            >
                                Discussion
                            </button>
                            <button
                                onClick={() => setMobileTab('QUOTE')}
                                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${mobileTab === 'QUOTE'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-zinc-500 dark:text-zinc-400'
                                    }`}
                            >
                                Devis {devis ? `(${devis.totaux.ttc.toFixed(0)}€)` : ''}
                            </button>
                        </div>

                        <div className="flex-1 flex min-h-0 relative">
                            {/* Chat Area */}
                            <div className={`flex-1 flex flex-col min-w-0 mx-auto w-full p-0 md:p-4 bg-zinc-50/50 dark:bg-black/20 ${mobileTab === 'CHAT' ? 'flex' : 'hidden xl:flex'
                                }`}>
                                <ChatInterface
                                    messages={messages}
                                    isLoading={isLoading}
                                    onSendMessage={(msg, img) => sendMessage(msg, includeDetails, img)}
                                />
                            </div>

                            {/* Sidebar Area */}
                            <div className={`flex-col shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-full xl:w-[400px] ${mobileTab === 'QUOTE' ? 'flex' : 'hidden xl:flex'
                                }`}>
                                <div className="hidden xl:block">
                                    <ClientWidget
                                        currentClient={currentClient}
                                        onClientChange={setCurrentClient}
                                        entrepriseNom={storedEnt.nom}
                                    />
                                </div>

                                {/* Tabs Desktop only usually, but acceptable on mobile full Quote view */}
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
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-screen font-sans text-base transition-colors duration-300">
            {/* Header */}
            <header className="h-16 md:h-20 bg-white/90 dark:bg-black/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 shrink-0 z-50 sticky top-0 transition-colors duration-300">
                <div
                    className="font-bold text-xl md:text-2xl tracking-tighter cursor-pointer hover:opacity-80 transition"
                    onClick={() => setView('HOME')}
                >
                    <span className="text-zinc-900 dark:text-white">Devis</span>
                    <span className="text-blue-600">.ai</span>
                </div>

                {/* Desktop Nav */}
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
                        onClick={() => setView('CATALOG')}
                        className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors "
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

                <div className="flex items-center gap-2 md:gap-4">
                    {/* Enterprise Menu -> Logout (Desktop) */}
                    {storedEnt.nom && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-full border border-zinc-200 dark:border-zinc-700">
                            <button
                                onClick={() => setView('SETTINGS')}
                                className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 max-w-[100px] truncate hover:underline hover:text-blue-600 transition"
                            >
                                {storedEnt.nom}
                            </button>
                            <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 mx-1"></div>
                            <button
                                onClick={handleLogout}
                                className="text-zinc-400 hover:text-red-500 transition-colors"
                                title="Se déconnecter"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <div className="hidden md:block">
                        <button
                            onClick={() => setShowFeedbackModal(true)}
                            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium"
                        >
                            Feedback
                        </button>
                    </div>

                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden md:block"></div>

                    <ThemeToggle />

                    {/* Mobile Hamburger */}
                    <button
                        className="md:hidden p-2 text-zinc-600 dark:text-zinc-300"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 shadow-xl z-40 flex flex-col gap-4 animate-in slide-in-from-top-2">
                    {storedEnt.nom && (
                        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                            <button
                                onClick={() => { setView('SETTINGS'); setIsMobileMenuOpen(false); }}
                                className="font-semibold text-zinc-900 dark:text-white"
                            >
                                {storedEnt.nom}
                            </button>
                            <button onClick={handleLogout} className="text-red-500 text-sm font-medium flex items-center gap-2">
                                <LogOut size={16} /> Déconnexion
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => { setView('CATALOG'); setIsMobileMenuOpen(false); }}
                        className="text-left px-2 py-2 text-lg font-medium text-zinc-700 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800"
                    >
                        📚 Mon Catalogue
                    </button>
                    <button
                        onClick={() => { setShowFeedbackModal(true); setIsMobileMenuOpen(false); }}
                        className="text-left px-2 py-2 text-lg font-medium text-zinc-700 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800"
                    >
                        💬 Feedback
                    </button>
                    <a
                        href="mailto:contact@devis.ai"
                        className="text-left px-2 py-2 text-lg font-medium text-zinc-700 dark:text-zinc-200"
                    >
                        📧 Contact
                    </a>
                </div>
            )}

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
