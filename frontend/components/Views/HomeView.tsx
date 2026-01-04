import React from 'react';
import { Button } from '../UI/Button';
import { motion } from 'framer-motion';
import { FileText, Zap, ShieldCheck, ArrowRight, CheckCircle2, Mic, LayoutTemplate, Sparkles, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { usePersistedState } from '../../lib/hooks/usePersistedState';
import { Entreprise } from '../../lib/types';

interface HomeViewProps {
    onStart: () => void;
}

export function HomeView({ onStart }: HomeViewProps) {
    const container: any = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const item: any = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
    };

    const floating: any = {
        animate: {
            y: [0, -10, 0],
            transition: {
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    // Very slow, simple background blob to reduce lag
    // Removed complex multi-blob staggering
    const backgroundBlob: any = {
        animate: {
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
            transition: {
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center justify-start min-h-full pt-10 md:pt-20 px-6 text-center space-y-24 relative overflow-hidden pb-32"
        >
            {/* Animated Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-zinc-50 dark:bg-black" />
                <div className="absolute inset-0 bg-grid-black/[0.04] dark:bg-grid-white/[0.02]" />

                {/* Single Central Glow - Optimized */}
                <motion.div
                    variants={backgroundBlob}
                    animate="animate"
                    style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/10 dark:bg-blue-900/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen"
                />
            </div>

            {/* Hero Section */}
            <div className="space-y-8 max-w-5xl mx-auto relative z-10">
                <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Nouvelle version 2.0 disponible</span>
                </motion.div>

                <motion.div variants={item} {...floating} className="relative">
                    <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.05]">
                        Générez des devis <br className="hidden md:block" />
                        <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600 dark:from-blue-400 dark:via-violet-400 dark:to-blue-400 pb-4 bg-[length:200%_auto] animate-gradient">
                            qui convertissent.
                        </span>
                    </h1>
                </motion.div>

                <motion.p variants={item} className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light">
                    L'outil tout-en-un pour les artisans exigeants. Transformez vos estimations en documents parfaits en quelques secondes.
                </motion.p>

                <motion.div variants={item} className="flex flex-col items-center justify-center gap-6 pt-4">
                    <Button
                        size="lg"
                        onClick={onStart}
                        className="w-full sm:w-auto text-lg h-14 px-10 rounded-full shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-1 hover:scale-105"
                    >
                        Commencer maintenant
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/20 px-4 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 backdrop-blur-sm">
                        <CheckCircle2 className="w-4 h-4" /> Configuration rapide
                    </div>
                </motion.div>
            </div>

            {/* Current Features */}
            <motion.div id="features" variants={container} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full text-left relative z-10 px-4">
                {[
                    { icon: Zap, title: "Instantané", desc: "Décrivez, c'est prêt. Notre IA comprend votre jargon technique.", color: "text-amber-500" },
                    { icon: FileText, title: "Professionnel", desc: "Mise en page, mentions légales, calculs de TVA : tout est géré.", color: "text-blue-500" },
                    { icon: ShieldCheck, title: "Sécurisé", desc: "Vos données clients sont chiffrées et stockées localement.", color: "text-emerald-500" }
                ].map((feature, i) => (
                    <motion.div
                        key={i}
                        variants={item}
                        className="group relative p-8 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1"
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-zinc-50 dark:bg-zinc-800/50 ${feature.color} bg-opacity-50`}>
                            <feature.icon className={`w-7 h-7 ${feature.color}`} />
                        </div>
                        <h3 className="font-bold text-xl mb-3 text-zinc-900 dark:text-white">{feature.title}</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* Coming Soon Section */}
            <motion.div variants={item} className="w-full max-w-4xl mx-auto relative z-10 px-4 pt-10">
                <div className="flex items-center gap-4 mb-10 opacity-60">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-300 dark:to-zinc-700" />
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Bientôt disponible</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-300 dark:to-zinc-700" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Changed Order: Templates First */}
                    <div className="relative p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 overflow-hidden flex items-center gap-4 opacity-75 hover:opacity-100 transition-opacity cursor-default group">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <LayoutTemplate className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-semibold text-zinc-900 dark:text-white">Templates Personnalisés</h4>
                            <p className="text-sm text-zinc-500">Importez vos propres modèles de documents.</p>
                        </div>
                        <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-500">V2.1</div>
                    </div>

                    <div className="relative p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 overflow-hidden flex items-center gap-4 opacity-75 hover:opacity-100 transition-opacity cursor-default group">
                        <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Mic className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-semibold text-zinc-900 dark:text-white">Commande Vocale</h4>
                            <p className="text-sm text-zinc-500">Dictez vos devis directement à l'IA.</p>
                        </div>
                        <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-500">V2.2</div>
                    </div>
                </div>
            </motion.div>

            {/* Contact Form Section */}
            <motion.div variants={item} className="w-full max-w-lg mx-auto relative z-10 px-4 pb-20">
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">
                    <h3 className="font-bold text-2xl mb-2 text-zinc-900 dark:text-white">Nous contacter</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm">Une question ou un projet ? Écrivez-nous.</p>

                    <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 ml-1 uppercase tracking-wide">
                                Votre Email
                            </label>
                            <input
                                type="email"
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black/50 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-white transition-all"
                                placeholder="nom@exemple.com"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 ml-1 uppercase tracking-wide">
                                Message
                            </label>
                            <textarea
                                className="w-full h-32 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-black/50 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-white resize-none transition-all"
                                placeholder="Bonjour, je souhaiterais..."
                                value={contactMessage}
                                onChange={(e) => setContactMessage(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full rounded-xl py-3 text-base flex justify-center items-center gap-2">
                            Envoyer le message <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
}
