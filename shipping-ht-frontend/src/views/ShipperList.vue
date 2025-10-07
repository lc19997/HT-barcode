<template>
  <div class="shipper-list-container">
    <!-- Navigation Bar -->
    <nav class="nav-bar">
      <button class="nav-button left" @click="goOrders">出荷No選択</button>
      <h1 class="nav-title">担当者選択</h1>
      <!-- <button class="nav-button right" @click="goSummary">処理数集計</button> -->
    </nav>

    <!-- Shipper List -->
    <ul v-if="shippers.length > 0" class="shipper-list">
      <li
        v-for="shipper in shippers"
        :key="shipper.code"
        @click="selectShipper(shipper)"
        :class="['shipper-item', { active: selectedShipper?.code === shipper.code }]"
      >
        <span class="shipper-text">{{ shipper.name }} - {{ shipper.code }}</span>
      </li>
    </ul>

    <!-- Loading or Error State -->
    <p v-else class="loading-text">担当者リストを読み込み中...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import axios from 'axios';

const shippers = ref([]);
const selectedShipper = ref(null); // ✅ 選択中の担当者
const router = useRouter();
const store = useAppStore();

onMounted(async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/shippers`);
    shippers.value = response.data.map(item => ({
      name: item.name || 'Unnamed',
      code: item.code || 'N/A',
      factorycode: item.factorycode || 'N/A',
    }));
  } catch (error) {
    console.error('Failed to fetch shippers:', error);
    shippers.value = [];
  }
});

// ✅ 担当者を選択（色反転だけ）
const selectShipper = (shipper) => {
  selectedShipper.value = shipper;
};

// ✅ 出荷No選択ボタンを押した時に orders へ遷移
const goOrders = () => {
  if (!selectedShipper.value) {
    alert("担当者を選択してください");
    return;
  }
  store.setShipper(selectedShipper.value);
  router.push('/orders');
};

const goSummary = () => {
  router.push('/summary'); // 処理数集計画面へ
};
</script>

<style scoped>
.shipper-list-container {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 375px;
  margin: 0 auto;
  background: #fff;
}
/* Navigation Bar */
.nav-bar {
  position: fixed;
  top: 0px;
  display: flex;
  align-items: center;
  justify-content: center; /* center contents */
  height: 44px;
  padding: 0 8px;
  border-bottom: 1px solid #dcdcdc;
  background: #e9e7e7;
  max-width: 359px;
  width: 100%;
}

.nav-title {
  font-size: 16px;
  font-weight: bold;
  position: absolute;
  left: 50%;
  transform: translateX(-50%); /* true center */
}

.nav-button.left {
  position: absolute;
  left: 5px;
}

.nav-button {
  -webkit-appearance: none;
  appearance: none;
}

.nav-button {
  font-size: 15px;
  color: #007aff;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.shipper-list {
  list-style: none;
  padding: 0;
  margin: 45px 0 0 0;
  background-color: white;
}

.shipper-item {
  padding: 12px 16px;
  border-bottom: 1px solid #dcdcdc;
  cursor: pointer;
  font-size: 16px;
}

/* ✅ 選択状態の色反転 */
.shipper-item.active {
  background-color: #007aff;
  color: #fff;
}
</style>
