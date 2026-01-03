import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ArrowRight, Mail, Phone, MapPin, FileDigit, LogIn, UserPlus, Lock, ChevronDown } from 'lucide-react';
import { Entreprise } from '../../lib/types';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface EnterpriseViewProps {
    initialData: Entreprise;
    onNext: (data: Entreprise) => void;
}


function ConnectionStatus() {
    const [status, setStatus] = useState<'CHECKING' | 'OK' | 'ERROR'>('CHECKING');

    React.useEffect(() => {
        api.health()
            .then(() => setStatus('OK'))
            .catch(() => setStatus('ERROR'));
    }, []);

    if (status === 'CHECKING') return <span>Connexion...</span>;
    if (status === 'OK') return <span className="text-green-500">Connecté ✅</span>;
    return <span className="text-red-500 font-bold">Déconnecté ❌ (Erreur Réseau)</span>;
}

export function EnterpriseView({ initialData, onNext }: EnterpriseViewProps) {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [isLoading, setIsLoading] = useState(false);

    // Register Form State
    const [formData, setFormData] = useState<Entreprise>(initialData || {
        nom: '',
        email: '',
        telephone: '',
        siret: '',
        adresse: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Login Form State
    const [loginName, setLoginName] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (mode === 'REGISTER') {
                const newErrors: Record<string, string> = {};
                if (!formData.nom.trim()) newErrors.nom = "Le nom est requis";
                if (!formData.siret) newErrors.siret = "SIRET requis";
                else if (!/^\d{14}$/.test(formData.siret.replace(/\s/g, ''))) {
                    newErrors.siret = "Le SIRET doit contenir exactement 14 chiffres";
                }
                if (!formData.adresse) newErrors.adresse = "Adresse requise";
                if (!formData.email) newErrors.email = "Email requis";
                if (!formData.forme) newErrors.forme = "Forme juridique requise";

                const pwdRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
                if (!formData.password) newErrors.password = "Mot de passe requis";
                else if (!pwdRegex.test(formData.password)) {
                    newErrors.password = "Min 8 car, 1 chiffre, 1 caractère spécial (!@#$%^&*)";
                }

                if (Object.keys(newErrors).length > 0) {
                    setErrors(newErrors);
                    throw new Error("Veuillez corriger les erreurs dans le formulaire");
                }

                const res = await api.registerEntreprise(formData);
                onNext(res);
                toast.success("Compte créé avec succès !");
            } else {
                // Login Mode
                if (!loginName) throw new Error("Veuillez entrer le nom de votre entreprise");
                if (!loginPassword) throw new Error("Veuillez entrer le mot de passe");

                const res = await api.loginEntreprise({ nom: loginName, password: loginPassword });
                onNext(res);
                toast.success("Connexion réussie !");
            }
        } catch (err: any) {
            console.error(err);
            // Auto-redirect to register if not found
            if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('trouvée'))) {
                toast.error("Compte inexistant. Veuillez le créer.");
                setMode('REGISTER');
                setFormData(prev => ({ ...prev, nom: loginName }));
            } else {
                toast.error(err.message || "Erreur lors de la connexion.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-screen px-4 py-12 relative overflow-hidden"
        >
            {/* Background Grid - consistent with Home */}
            <div className="absolute inset-0 z-0 bg-zinc-50 dark:bg-black">
                <div className="absolute inset-0 bg-grid-black/[0.05] dark:bg-grid-white/[0.02]" />
            </div>

            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 relative z-10 overflow-hidden">
                {/* Header / Tabs */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={() => setMode('LOGIN')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors relative ${mode === 'LOGIN' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <LogIn className="w-4 h-4" /> Connexion
                        </div>
                        {mode === 'LOGIN' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />}
                    </button>
                    <button
                        onClick={() => setMode('REGISTER')}
                        className={`flex-1 py-4 text-sm font-medium transition-colors relative ${mode === 'REGISTER' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <UserPlus className="w-4 h-4" /> Inscription
                        </div>
                        {mode === 'REGISTER' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />}
                    </button>
                </div>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {mode === 'LOGIN' ? 'Ravi de vous revoir' : 'Créez votre espace'}
                        </h2>
                        <p className="text-zinc-500 text-sm mt-2">
                            {mode === 'LOGIN' ? 'Accédez à vos devis et clients' : 'Configurez votre entreprise en quelques secondes'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="wait">
                            {mode === 'LOGIN' ? (
                                <motion.div
                                    key="login"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Nom de l'entreprise</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                                            <input
                                                type="text"
                                                value={loginName}
                                                onChange={(e) => setLoginName(e.target.value)}
                                                placeholder="Ex: Maçonnerie Durand"
                                                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Mot de passe</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                                            <input
                                                type="password"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                placeholder="Enter password"
                                                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="register"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="text-right mb-2">
                                        <span className="text-xs text-zinc-400 italic">* Champs obligatoires</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-zinc-500">Entreprise <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <Building2 className={`absolute left-3 top-3 w-4 h-4 ${errors.nom ? 'text-red-400' : 'text-zinc-400'}`} />
                                                <input
                                                    required
                                                    value={formData.nom}
                                                    onChange={e => {
                                                        setFormData({ ...formData, nom: e.target.value });
                                                        if (errors.nom) setErrors({ ...errors, nom: '' });
                                                    }}
                                                    className={`w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.nom ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'}`}
                                                    placeholder="Nom de l'entreprise"
                                                />
                                            </div>
                                            {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-zinc-500">Mot de passe <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <Lock className={`absolute left-3 top-3 w-4 h-4 ${errors.password ? 'text-red-400' : 'text-zinc-400'}`} />
                                                <input
                                                    required
                                                    type="password"
                                                    value={formData.password || ''}
                                                    onChange={e => {
                                                        setFormData({ ...formData, password: e.target.value });
                                                        if (errors.password) setErrors({ ...errors, password: '' });
                                                    }}
                                                    className={`w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.password ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'}`}
                                                    placeholder="Min 8 car. (1 chiffre, 1 spécial)"
                                                />
                                            </div>
                                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-zinc-500">SIRET <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <FileDigit className={`absolute left-3 top-3 w-4 h-4 ${errors.siret ? 'text-red-400' : 'text-zinc-400'}`} />
                                                <input
                                                    value={formData.siret}
                                                    onChange={e => {
                                                        setFormData({ ...formData, siret: e.target.value });
                                                        if (errors.siret) setErrors({ ...errors, siret: '' });
                                                    }}
                                                    className={`w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.siret ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'}`}
                                                    placeholder="123 456 789 00012"
                                                />
                                            </div>
                                            {errors.siret && <p className="text-xs text-red-500 mt-1">{errors.siret}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-zinc-500">Forme <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <select
                                                    value={formData.forme || ''}
                                                    onChange={e => {
                                                        setFormData({ ...formData, forme: e.target.value });
                                                        if (errors.forme) setErrors({ ...errors, forme: '' });
                                                    }}
                                                    className={`w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none ${errors.forme ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'}`}
                                                >
                                                    <option value="">Sélectionner...</option>
                                                    <option value="Micro-Entrepreneur">Micro-Entrepreneur</option>
                                                    <option value="EI">EI</option>
                                                    <option value="EIRL">EIRL</option>
                                                    <option value="SARL">SARL</option>
                                                    <option value="EURL">EURL</option>
                                                    <option value="SAS">SAS</option>
                                                    <option value="SASU">SASU</option>
                                                    <option value="SA">SA</option>
                                                    <option value="SCI">SCI</option>
                                                    <option value="Association">Association</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                                                {errors.forme && <p className="text-xs text-red-500 absolute -bottom-4 right-0">{errors.forme}</p>}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-zinc-500">RCS / RM</label>
                                            <input
                                                value={formData.rm_rcs || ''}
                                                onChange={e => setFormData({ ...formData, rm_rcs: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Paris B 123..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-zinc-500">TVA Intra</label>
                                            <input
                                                value={formData.tva_intracom || ''}
                                                onChange={e => setFormData({ ...formData, tva_intracom: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="FR 12..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-zinc-500">Email <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <Mail className={`absolute left-3 top-3 w-4 h-4 ${errors.email ? 'text-red-400' : 'text-zinc-400'}`} />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={e => {
                                                    setFormData({ ...formData, email: e.target.value });
                                                    if (errors.email) setErrors({ ...errors, email: '' });
                                                }}
                                                className={`w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.email ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'}`}
                                                placeholder="contact@monentreprise.com"
                                            />
                                        </div>
                                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-zinc-500">Téléphone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                                            <input
                                                type="tel"
                                                value={formData.telephone}
                                                onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="06 12 34 56 78"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-zinc-500">Adresse <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <MapPin className={`absolute left-3 top-3 w-4 h-4 ${errors.adresse ? 'text-red-400' : 'text-zinc-400'}`} />
                                            <input
                                                value={formData.adresse}
                                                onChange={e => {
                                                    setFormData({ ...formData, adresse: e.target.value });
                                                    if (errors.adresse) setErrors({ ...errors, adresse: '' });
                                                }}
                                                className={`w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.adresse ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'}`}
                                                placeholder="123 Rue de la Paix, 75000 Paris"
                                            />
                                        </div>
                                        {errors.adresse && <p className="text-xs text-red-500 mt-1">{errors.adresse}</p>}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="pt-6">
                            <Button
                                type="submit"
                                className="w-full h-12 text-base rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                                isLoading={isLoading}
                            >
                                {mode === 'LOGIN' ? 'Accéder à mon espace' : 'Créer mon entreprise'}
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Debug Info for Production Issues */}
            <div className="absolute bottom-4 left-0 right-0 text-center z-50">
                <p className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                    DEBUG: {api.getBaseUrl()} | Status: <ConnectionStatus />
                </p>
            </div>
        </motion.div>
    );
}
