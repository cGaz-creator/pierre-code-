import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '../components/UI/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Devis.ai - Assistant Devis',
    description: "Générez vos devis par chat avec l'IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body className={`${inter.className} bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 h-screen overflow-hidden`}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    {children}
                    <Toaster position="top-center" toastOptions={{
                        className: 'dark:bg-zinc-800 dark:text-white border dark:border-zinc-700',
                    }} />
                </ThemeProvider>
            </body>
        </html>
    );
}
