import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '@/config/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; details?: string }>) => {
    const message = error.response?.data?.error || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

// Auth endpoints
export const authAPI = {
  register: (data: {
    wallet_address: string;
    signature: string;
    message: string;
    referral_code?: string;
  }) => api.post('/auth/register', data),

  getUser: (wallet: string) => api.get(`/auth/user/${wallet}`),

  checkUser: (wallet: string) => api.get(`/auth/check/${wallet}`),
};

// Balance endpoints
export const balanceAPI = {
  getSOL: (wallet: string) => api.get(`/balance/${wallet}`),

  getToken: (wallet: string, mint: string) => api.get(`/balance/${wallet}/${mint}`),

  getAll: (wallet: string) => api.get(`/balance/${wallet}/all`),
};

// Escrow endpoints
export const escrowAPI = {
  deposit: (wallet_address: string, amount: number, token_mint?: string) =>
    api.post('/escrow/deposit', { wallet_address, amount, token_mint }),

  // Private send: from sender's shielded balance to recipient
  withdraw: (sender_wallet: string, recipient_wallet: string, amount: number) =>
    api.post('/escrow/withdraw', { sender_wallet, recipient_wallet, amount }),

  // Private send tokens: from sender's shielded balance to recipient
  withdrawTokens: (sender_wallet: string, recipient_wallet: string, mint: string, amount: number) =>
    api.post('/escrow/withdraw-tokens', { sender_wallet, recipient_wallet, mint, amount }),

  confirm: (transaction_id: string, tx_signature: string, status: 'confirmed' | 'failed') =>
    api.post('/escrow/confirm', { transaction_id, tx_signature, status }),
};

// Prices endpoints
export const pricesAPI = {
  getPrice: (mint: string) => api.get(`/prices/${mint}`),

  getMultiple: (tokens: string[]) => api.post('/prices/multi', { tokens }),

  getWallet: (wallet: string) => api.get(`/prices/wallet/${wallet}`),
};

// Tokens endpoints
export const tokensAPI = {
  getSupported: () => api.get('/tokens/supported'),

  getConstants: () => api.get('/tokens/meta/constants'),
};

// Referral endpoints
export const referralAPI = {
  validate: (code: string) => api.get(`/referral/validate/${code}`),

  getLeaderboard: (limit = 50) => api.get(`/referral/leaderboard?limit=${limit}`),

  getStats: (wallet: string) => api.get(`/referral/stats/${wallet}`),

  getRank: (wallet: string) => api.get(`/referral/rank/${wallet}`),
};

// Transactions endpoints
export const transactionsAPI = {
  getHistory: (wallet: string, limit = 50) =>
    api.get(`/transactions/${wallet}?limit=${limit}`),

  getSummary: (wallet: string) => api.get(`/transactions/${wallet}/summary`),
};

// ZK Payment endpoints (for private sends to other addresses)
export const paymentAPI = {
  // Step 1: Prepare payment - get commitment and nullifier
  prepare: (sender_wallet: string, receiver_wallet: string, amount: number, token_mint?: string) =>
    api.post('/payment/prepare', { sender_wallet, receiver_wallet, amount, token_mint }),

  // Step 2: Authorize payment - lock funds (optional, may not be needed)
  authorize: (sender_wallet: string, commitment: string, nullifier: string, amount: number, merchant: string) =>
    api.post('/payment/authorize', { sender_wallet, commitment, nullifier, amount, merchant }),

  // Step 3: Settle payment with ZK proof
  settle: (params: {
    sender_wallet: string;
    transaction_id?: string;
    commitment: string;
    proof: string;
    public_signals: string[];
    encrypted_amount?: number[];
  }) => api.post('/payment/settle', params),
};

export default api;
