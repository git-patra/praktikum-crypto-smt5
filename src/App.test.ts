// @vitest-environment jsdom
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, it, expect, vi, afterEach } from 'vitest';
import App from './App.vue';
import payload from '../tests/fixtures/coinlore.json';
const http = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('axios', () => ({ default: http }));
const stubs = {
  IonApp: { template: '<div><slot /></div>' }, IonPage: { template: '<div><slot /></div>' },
  IonContent: { template: '<div><slot /></div>' }, IonCard: { template: '<section><slot /></section>' },
  IonList: { template: '<div><slot /></div>' }, IonItem: { template: '<div><slot /></div>' },
  IonSpinner: { template: '<span />' },
  IonButton: { props: ['disabled'], template: '<button :disabled="disabled"><slot /></button>' },
};
let app: ReturnType<typeof mount> | undefined;
function render() { app = mount(App, { global: { stubs } }); return app; }
function response(value: unknown = payload) { return { data: value }; }
afterEach(() => { app?.unmount(); app = undefined; http.get.mockReset(); vi.useRealTimers(); });
describe('Aplikasi cryptocurrency', () => {
  it('langsung mengambil CoinLore dan menampilkan sisa data pada halaman terakhir', async () => {
    http.get.mockImplementation( async (url: string) => {
      if (url !== 'https://api.coinlore.net/api/tickers/') throw new Error('Sumber bukan CoinLore');
      return response({ data: payload.data.slice(0, 23) });
    });
    const view = render(); await flushPromises();
    expect(view.findAll('.coin-row')).toHaveLength(10);
    await view.get('#next-page').trigger('click');
    await view.get('#next-page').trigger('click');
    expect(view.findAll('.coin-row')).toHaveLength(3);
    expect(view.get('#page-info').text()).toBe('Halaman 3 dari 3');
    expect(view.get('#next-page').attributes('disabled')).toBeDefined();
  });
  it('memuat seluruh data, lalu refresh menampilkan harga baru tanpa duplikasi', async () => {
    let finish!: (value: ReturnType<typeof response>) => void;
    const fetcher = vi.fn().mockReturnValueOnce(new Promise(done => { finish = done; }))
      .mockResolvedValueOnce(response({ data: [{...payload.data[0], price_usd: '90000.1234'}] }));
    http.get.mockImplementation( fetcher);
    const view = render(); await nextTick();
    expect(view.get('#refresh').attributes('disabled')).toBeDefined();
    expect(view.get('[role="status"]').text()).toContain('Mengambil');
    finish(response()); await flushPromises();
    expect(view.findAll('.coin-row')).toHaveLength(10);
    expect(view.get('.coin-row').text()).toContain('Bitcoin');
    expect(view.get('.coin-row').text()).toContain('BTC');
    expect(view.get('.coin-row').text()).toContain('80217.70');
    expect(view.get('#previous-page').attributes('disabled')).toBeDefined();
    await view.get('#next-page').trigger('click');
    expect(view.get('#page-info').text()).toBe('Halaman 2 dari 10');
    expect(view.get('.coin-row').text()).toContain('Staked Ether');
    for (let i = 0; i < 8; i++) await view.get('#next-page').trigger('click');
    expect(view.get('#page-info').text()).toBe('Halaman 10 dari 10');
    expect(view.get('#next-page').attributes('disabled')).toBeDefined();
    await view.get('#previous-page').trigger('click');
    expect(view.get('#page-info').text()).toBe('Halaman 9 dari 10');
    await view.get('#refresh').trigger('click'); await flushPromises();
    expect(view.findAll('.coin-row')).toHaveLength(1);
    expect(view.get('.coin-row').text()).toContain('90000.1234');
    expect(view.get('#page-info').text()).toBe('Halaman 1 dari 1');
  });
  it('menampilkan error awal kemudian dapat mencoba kembali', async () => {
    http.get.mockImplementation( vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(response()));
    const view = render(); await flushPromises();
    expect(view.get('[role="alert"]').text()).toContain('offline');
    expect(view.findAll('.coin-row')).toHaveLength(0);
    await view.get('#refresh').trigger('click'); await flushPromises();
    expect(view.find('[role="alert"]').exists()).toBe(false);
    expect(view.findAll('.coin-row')).toHaveLength(10);
  });
  it('mempertahankan hasil sebelumnya dengan keterangan ketika refresh gagal', async () => {
    http.get.mockImplementation( vi.fn().mockResolvedValueOnce(response()).mockRejectedValueOnce(new Error('offline')));
    const view = render(); await flushPromises();
    await view.get('#refresh').trigger('click'); await flushPromises();
    expect(view.findAll('.coin-row')).toHaveLength(10);
    expect(view.get('[role="alert"]').text()).toContain('sebelumnya');
  });
  it('menampilkan kondisi API kosong', async () => {
    http.get.mockImplementation( async () => response({ data: [] }));
    const view = render(); await flushPromises();
    expect(view.get('[role="status"]').text()).toContain('tidak mengembalikan');
    expect(view.findAll('.coin-row')).toHaveLength(0);
  });
  it('menghentikan permintaan setelah 15 detik dan mengaktifkan refresh kembali', async () => {
    vi.useFakeTimers();
    http.get.mockImplementation( (_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const view = render(); await nextTick();
    await vi.advanceTimersByTimeAsync(15000); await nextTick();
    expect(view.get('[role="alert"]').text()).toContain('15 detik');
    expect(view.get('#refresh').attributes('disabled')).toBeUndefined();
  });
  it('membatalkan permintaan saat komponen ditutup', () => {
    let signal: AbortSignal | null | undefined;
    http.get.mockImplementation( (_url: string, options: RequestInit) => {
      signal = options.signal; return new Promise(() => {});
    });
    render(); app?.unmount(); app = undefined;
    expect(signal?.aborted).toBe(true);
  });
});
