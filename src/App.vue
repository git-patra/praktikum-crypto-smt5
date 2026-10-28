<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { IonApp, IonPage, IonContent, IonCard, IonButton, IonSpinner, IonList, IonItem } from '@ionic/vue';
import { API_URL, fetchCoins, type Coin } from './crypto';

const coins = ref<Coin[]>([]);
const PAGE_SIZE = 10;
const page = ref(1);
const totalPages = computed(() => Math.ceil(coins.value.length / PAGE_SIZE));
const start = computed(() => (page.value - 1) * PAGE_SIZE);
const visibleCoins = computed(() => coins.value.slice(start.value, start.value + PAGE_SIZE));
const loading = ref(false);
const statusMessage = ref('Menyiapkan data cryptocurrency…');
const errorMessage = ref('');
const updatedAt = ref('');
let controller: AbortController | undefined;
let timeout: ReturnType<typeof setTimeout> | undefined;
let disposed = false;

async function refresh(): Promise<void> {
  if (loading.value) return;
  loading.value = true;
  page.value = 1;
  errorMessage.value = '';
  statusMessage.value = 'Mengambil data terbaru dari CoinLore…';
  const requestController = new AbortController();
  controller = requestController;
  timeout = setTimeout(() => requestController.abort(), 15000);
  try {
    const data = await fetchCoins(requestController.signal);
    if (disposed) return;
    coins.value = data;
    updatedAt.value = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Jakarta',
    }).format(new Date());
    statusMessage.value = data.length
      ? `${data.length} aset dimuat dari API CoinLore. Maksimal 10 data per halaman.`
      : 'API tidak mengembalikan data cryptocurrency. Silakan Refresh kembali.';
  } catch (cause) {
    if (disposed) return;
    statusMessage.value = 'Pembaruan data belum berhasil.';
    const reason = requestController.signal.aborted
      ? 'Waktu tunggu habis (15 detik).'
      : cause instanceof Error ? cause.message : 'Koneksi tidak tersedia.';
    errorMessage.value = `Gagal mengambil data. ${reason} Periksa koneksi dan tekan Refresh.`;
    if (coins.value.length) errorMessage.value += ' Daftar masih menampilkan data sebelumnya.';
  } finally {
    clearTimeout(timeout);
    if (!disposed) loading.value = false;
  }
}

onMounted(() => void refresh());
onBeforeUnmount(() => {
  disposed = true;
  controller?.abort();
  clearTimeout(timeout);
});
</script>

<template>
  <IonApp>
    <IonPage>
      <IonContent>
        <main class="container">
          <header class="intro">
            <div class="eyebrow">
              <span class="logo" aria-hidden="true">TS</span>
              <span>LAB PEMROGRAMAN</span>
              <span class="badge">Praktikum 03</span>
            </div>
            <p class="kicker">COINLORE / CRYPTOCURRENCY</p>
            <h1>Cryptocurrency.<br /><span>Harga dalam USD.</span></h1>
            <p class="description">Peringkat, nama, simbol, dan harga aset kripto dari CoinLore. Perbarui data kapan saja melalui tombol Refresh.</p>
          </header>

          <IonCard class="market-card" aria-labelledby="market-title">
            <div class="card-heading">
              <div>
                <p class="kicker">DATA CRYPTOCURRENCY</p>
                <h2 id="market-title">Daftar aset kripto</h2>
              </div>
              <IonButton id="refresh" :disabled="loading" @click="refresh">
                <IonSpinner v-if="loading" name="crescent" aria-hidden="true" />
                <span v-else class="refresh-icon" aria-hidden="true">↻</span>
                {{ loading ? 'Memuat…' : 'Refresh' }}
              </IonButton>
            </div>
            <div class="feedback">
              <p id="status" role="status" aria-live="polite">{{ statusMessage }}</p>
              <p v-if="updatedAt" class="updated">Terakhir diambil: {{ updatedAt }} WIB</p>
              <p v-if="errorMessage" id="error" role="alert">{{ errorMessage }}</p>
            </div>
            <div v-if="coins.length" class="data-heading" aria-hidden="true">
              <span>rank</span><span>name / symbol</span><span>price_usd</span>
            </div>
            <p v-if="coins.length" class="data-range">Data {{ start + 1 }}–{{ Math.min(start + PAGE_SIZE, coins.length) }} dari {{ coins.length }} aset</p>
            <IonList v-if="coins.length" aria-label="Daftar cryptocurrency" :aria-busy="loading">
              <IonItem v-for="coin in visibleCoins" :key="coin.id" lines="none" class="coin-item">
                <div class="coin-row">
                  <div class="rank-cell"><span class="field-label">Rank</span><span class="rank-value">{{ coin.rank }}</span></div>
                  <div class="name-cell"><span class="coin-name">{{ coin.name }}</span><strong class="symbol">{{ coin.symbol }}</strong></div>
                  <div class="price-cell"><span class="field-label">USD</span><span class="price">{{ coin.price_usd }}</span></div>
                </div>
              </IonItem>
            </IonList>
            <div v-else class="empty-state">
              <span class="empty-mark" aria-hidden="true">◇</span>
              <p>{{ loading ? 'Menyiapkan daftar aset…' : 'Belum ada data yang ditampilkan.' }}</p>
            </div>
            <nav v-if="coins.length" class="pagination" aria-label="Halaman data cryptocurrency">
              <IonButton id="previous-page" :disabled="loading || page === 1" @click="page--">Sebelumnya</IonButton>
              <span id="page-info" role="status" aria-live="polite">Halaman {{ page }} dari {{ totalPages }}</span>
              <IonButton id="next-page" :disabled="loading || page === totalPages" @click="page++">Berikutnya</IonButton>
            </nav>
          </IonCard>

          <details class="source">
            <summary>Sumber data dan cara kerja</summary>
            <p>Data diambil melalui GET dari endpoint pada soal. Field rank, name, symbol, dan price_usd ditampilkan sesuai respons API. Daftar menampilkan seluruh hasil endpoint ini secara bertahap, 10 data per halaman, bukan seluruh aset di basis data CoinLore.</p>
            <a :href="API_URL" target="_blank" rel="noopener noreferrer">{{ API_URL }}</a>
            <p>Harga dalam USD ditampilkan tanpa pembulatan tambahan. Nilai dan peringkat dapat berubah; Refresh dapat menghasilkan nilai yang sama jika API belum diperbarui.</p>
          </details>
          <footer><span>Tugas 3 · Praktikum API</span><span>Vue · Ionic · TypeScript</span></footer>
        </main>
      </IonContent>
    </IonPage>
  </IonApp>
</template>
