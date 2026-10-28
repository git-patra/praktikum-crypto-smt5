import axios from 'axios';

export const API_URL = 'https://api.coinlore.net/api/tickers/';

export interface Coin {
  id: string;
  rank: number;
  name: string;
  symbol: string;
  price_usd: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseCoins(value: unknown): Coin[] {
  if (!isObject(value) || !Array.isArray(value.data)) {
    throw new Error('Format respons CoinLore tidak sesuai.');
  }
  const ids = new Set<string>();
  return value.data.map((item: unknown) => {
    if (!isObject(item) ||
      typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id) ||
      typeof item.rank !== 'number' || !Number.isInteger(item.rank) || item.rank < 1 ||
      typeof item.name !== 'string' || !item.name.trim() ||
      typeof item.symbol !== 'string' || !item.symbol.trim() ||
      typeof item.price_usd !== 'string' || !/^\d+(\.\d+)?$/.test(item.price_usd)) {
      throw new Error('Data peringkat, nama, simbol, atau harga tidak valid.');
    }
    ids.add(item.id);
    // Harga tetap string agar seluruh digit dari API dipertahankan.
    return { id: item.id, rank: item.rank, name: item.name, symbol: item.symbol, price_usd: item.price_usd };
  });
}

export async function fetchCoins(signal?: AbortSignal): Promise<Coin[]> {
  const response = await axios.get<unknown>(API_URL, { signal });
  return parseCoins(response.data);
}
