import { describe, it, expect, vi, afterEach } from 'vitest';
import axios from 'axios';
import { parseCoins, fetchCoins } from './crypto';
import payload from '../tests/fixtures/coinlore.json';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('Data CoinLore', () => {
  it('menampilkan semua data dan mempertahankan field serta presisi harga API', () => {
    const result = parseCoins(payload);
    expect(result).toHaveLength(100);
    expect(result[0]).toEqual({ id: '90', rank: 1, name: 'Bitcoin', symbol: 'BTC', price_usd: '80217.70' });
    const small = { data: [{ id: 'x', rank: 1, name: 'Small', symbol: 'SM', price_usd: '0.00000042' }] };
    expect(parseCoins(small)[0].price_usd).toBe('0.00000042');
  });
  it('menerima data kosong dan harga nol', () => {
    expect(parseCoins({ data: [] })).toEqual([]);
    expect(parseCoins({ data: [{ ...payload.data[0], price_usd: '0.00' }] })[0].price_usd).toBe('0.00');
  });
  it.each([null, {}, {data: null}, {data: [{}]},
    {data: [{...payload.data[0], rank: -1}]},
    {data: [{...payload.data[0], price_usd: 'NaN'}]},
    {data: [{...payload.data[0], price_usd: null}]},
    {data: [{...payload.data[0], name: ''}]},
    {data: [payload.data[0], payload.data[0]]},
  ])('menolak respons yang tidak valid %#', input => {
    expect(() => parseCoins(input)).toThrow();
  });
  it('mengambil data Axios dan mempertahankan presisi harga', async () => {
    vi.stubGlobal('fetch', () => { throw new Error('Transport lama'); });
    vi.spyOn(axios, 'get').mockResolvedValue({ data: payload });
    const result = await fetchCoins();
    expect(result).toHaveLength(100);
    expect(result[0].price_usd).toBe('80217.70');
  });
  it('melaporkan HTTP gagal', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue(new axios.AxiosError('Request failed with status code 503'));
    await expect(fetchCoins()).rejects.toThrow('503');
  });
  it('melaporkan koneksi gagal', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue(new Error('offline'));
    await expect(fetchCoins()).rejects.toThrow('offline');
  });
});
