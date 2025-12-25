export interface Ligne {
    ligne_type: string;
    designation: string;
    qte: number;
    unite: string;
    pu_ht: number | null;
    tva: number;
    lot?: string | null;
    option?: boolean;
    note?: string | null;
    total_ht?: number;
}

export interface Totaux {
    ht: number;
    tva: number;
    ttc: number;
    tva_by_rate: Record<string, number>;
    acompte_ttc: number;
    reste_a_payer_ttc: number;
}

export interface Client {
    id?: string;
    nom: string;
    client_type: string;
    adresse?: string;
    email?: string;
    tel?: string;
    adresse_chantier?: string;
    entreprise_nom?: string; // Scoping
}

export interface Entreprise {
    id?: number;
    nom: string;
    forme?: string;
    siret?: string;
    tva_intracom?: string;
    adresse?: string;
    email?: string;
    tel?: string;
    telephone?: string; // Alias for UI
    logo_url?: string;
    iban?: string;
    bic?: string;
    password?: string; // For auth
}

export interface Devis {
    id: string;
    date: string;
    devise: string;
    statut: string;
    theme: string;
    accent_hex: string;
    objet?: string;
    client?: Client;
    lignes: Ligne[];
    totaux: Totaux;
    detailed_description?: string;
}

export interface ChatResponse {
    session_id: string;
    assistant_message: string;
    chips: string[];
    devis_id: string;
    devis: Devis;
}

export interface PriceItem {
    id: string;
    label: string;
    price_ht: number;
    tva: number;
    category?: string;
}
