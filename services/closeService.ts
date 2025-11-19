import { WebhookListResponse, WebhookSubscription, CreateWebhookPayload, UpdateWebhookPayload } from '../types';

const BASE_URL = 'https://api.close.com/api/v1';
// Use a CORS proxy to bypass browser restrictions since Close API doesn't support CORS for 3rd party origins
const PROXY_URL = 'https://corsproxy.io/?';

const getHeaders = (apiKey: string) => {
  return {
    'Authorization': `Basic ${btoa(`${apiKey}:`)}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
};

const fetchWithProxy = async (endpoint: string, options: RequestInit) => {
  // Encode the target URL to ensure special characters (like query params) don't interfere with the proxy
  const targetUrl = `${BASE_URL}${endpoint}`;
  const url = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;
  
  const response = await fetch(url, options);
  return response;
};

export const closeService = {
  listWebhooks: async (apiKey: string): Promise<WebhookListResponse> => {
    const response = await fetchWithProxy('/webhook/', {
      method: 'GET',
      headers: getHeaders(apiKey),
    });
    
    if (!response.ok) {
        // Try to get text if json fails, to see error details
        const text = await response.text().catch(() => '');
        throw new Error(`Failed to fetch webhooks: ${response.status} ${text}`);
    }
    return response.json();
  },

  getWebhook: async (apiKey: string, id: string): Promise<WebhookSubscription> => {
    const response = await fetchWithProxy(`/webhook/${id}/`, {
      method: 'GET',
      headers: getHeaders(apiKey),
    });
    if (!response.ok) throw new Error(`Failed to fetch webhook: ${response.statusText}`);
    return response.json();
  },

  createWebhook: async (apiKey: string, payload: CreateWebhookPayload): Promise<WebhookSubscription> => {
    const response = await fetchWithProxy('/webhook/', {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const errorMsg = err.error || (err.errors ? JSON.stringify(err.errors) : `Failed to create webhook: ${response.statusText}`);
        throw new Error(errorMsg);
    }
    return response.json();
  },

  updateWebhook: async (apiKey: string, id: string, payload: UpdateWebhookPayload): Promise<WebhookSubscription> => {
    const response = await fetchWithProxy(`/webhook/${id}/`, {
      method: 'PUT',
      headers: getHeaders(apiKey),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Failed to update webhook: ${response.statusText}`);
    return response.json();
  },

  deleteWebhook: async (apiKey: string, id: string): Promise<void> => {
    const response = await fetchWithProxy(`/webhook/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(apiKey),
    });
    if (!response.ok) throw new Error(`Failed to delete webhook: ${response.statusText}`);
  },
};