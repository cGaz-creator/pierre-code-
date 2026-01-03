import { ChatResponse, Client, Entreprise, Devis, PriceItem } from './types';

const API_BASE = '/api';
export const getBaseUrl = () => API_BASE;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    try {
        const res = await fetch(url, { ...options, headers });
        if (!res.ok) {
            let errorDetail = `Error ${res.status}`;
            try {
                const errorJson = await res.json();
                errorDetail = errorJson.detail || errorJson.message || errorDetail;
            } catch (e) {
                // If JSON parse fails, try text
                const errorText = await res.text().catch(() => '');
                errorDetail = `${errorDetail} (${errorText.slice(0, 50)})`;
            }
            throw new Error(errorDetail);
        }
        return res.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

export const api = {
    getBaseUrl: () => API_BASE,
    health: () => request('/health'),

    // Chat
    startChat: (clientId?: string, client?: Client, theme?: string, entrepriseNom?: string) =>
        request<ChatResponse>('/chat/start', {
            method: 'POST',
            body: JSON.stringify({ client_id: clientId, client, theme, entreprise_nom: entrepriseNom })
        }),

    chatTurn: (sessionId: string, message: string, includeDetailedDescription: boolean = false, priceList: any[] = [], imageBase64?: string) =>
        request<ChatResponse>('/chat/turn', {
            method: 'POST',
            body: JSON.stringify({
                session_id: sessionId,
                message,
                includeDetailedDescription,
                price_list: priceList,
                image_base64: imageBase64
            })
        }),

    // Devis
    getDevisPdfUrl: (devisId: string) => `${API_BASE}/devis/${devisId}/pdf`,

    listDevis: (entrepriseNom?: string) => {
        const params = new URLSearchParams();
        if (entrepriseNom) params.append('entreprise_nom', entrepriseNom);
        return request<Devis[]>(`/devis?${params.toString()}`);
    },

    updateDevis: (devisId: string, data: Partial<Devis>) =>
        request<Devis>(`/devis/${devisId}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    sendDevisEmail: (devisId: string, data: { to_email: string; subject: string; message: string }) =>
        request<{ ok: boolean }>(`/devis/${devisId}/send`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    // Upload
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        return res.json() as Promise<{ url: string }>;
    },

    uploadPriceList: async (file: File, entrepriseNom: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entreprise_nom', entrepriseNom);
        const res = await fetch(`${API_BASE}/upload/price-list`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        return res.json() as Promise<{ items: any[] }>;
    },

    // Clients
    searchClients: (query: string, entrepriseNom?: string) => {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (entrepriseNom) params.append('entreprise_nom', entrepriseNom);
        return request<Client[]>(`/clients?${params.toString()}`);
    },

    // Entreprise
    loginEntreprise: (data: { nom: string; password: string }) =>
        request<Entreprise>('/entreprise/login', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    registerEntreprise: (data: Entreprise) =>
        request<Entreprise>('/entreprise/register', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    updateEntreprise: (id: number, data: Partial<Entreprise>) =>
        request<Entreprise>(`/entreprise/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    // Catalog (PriceList)
    listCatalog: (entrepriseNom: string, query?: string) => {
        const params = new URLSearchParams();
        params.append('entreprise_nom', entrepriseNom);
        if (query) params.append('q', query);
        return request<PriceItem[]>(`/pricelist?${params.toString()}`);
    },

    createCatalogItem: (item: PriceItem) =>
        request<PriceItem>('/pricelist', {
            method: 'POST',
            body: JSON.stringify(item)
        }),

    updateCatalogItem: (id: number, item: Partial<PriceItem>) =>
        request<PriceItem>(`/pricelist/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(item)
        }),

    deleteCatalogItem: (id: number) =>
        request<{ ok: boolean }>(`/pricelist/${id}`, {
            method: 'DELETE'
        }),

    deleteCatalogItems: (ids: number[]) =>
        request<{ count: number }>(`/pricelist/bulk-delete`, {
            method: 'POST',
            body: JSON.stringify(ids)
        }),
};
