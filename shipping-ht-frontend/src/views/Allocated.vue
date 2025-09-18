<template>
  <div class="container">
    <!-- Header -->
    <header class="nav-bar">
      <button class="back-btn" @click="router.push('/orders')">← 出荷No.選択</button>
      <h1 class="title">{{ order?.shippingNo }}</h1>
      <button class="action-btn" @click="router.push('/summary')">集計</button>
    </header>

    <!-- Order Details -->
    <section class="order-info" v-if="order">
      <div class="detail-row">在庫No: {{ order.stockNo || 'N/A' }}</div>
      <div class="detail-row">加工No: {{ order.processNo || 'N/A' }}</div>
      <div class="detail-row">等級: {{ order.grade || 'N/A' }}</div>
      <div class="detail-row">反数: {{ order.qty || 'N/A' }}</div>
    </section>
    <div v-else class="no-data">注文データがありません</div>

    <!-- Barcode Input and Results -->
    <div class="barcode-section" v-if="barcodeData">
      <div class="detail-row">ロットNo: {{ barcodeData.lotNo }}</div>
      <div class="detail-row">サブロットNo: {{ barcodeData.subLotNo }}</div>
      <div class="detail-row">等級: {{ barcodeData.grade }}</div>
      <div class="detail-row">長さ: {{ barcodeData.length }}m</div>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <input
        v-model="inputValue"
        placeholder="バーコードをスキャン"
        class="input-box"
        ref="input"
        @input="handleBarcodeInput"
        @keypress.enter="processBarcode"
      />
      <button @click="showTenkey = true" class="keypad-btn">KeyPad</button>
    </footer>

    <!-- Tenkey Pad -->
    <TenkeyPad
      v-if="showTenkey"
      @enter="processBarcode"
      @close="showTenkey = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "../stores/appStore";
import axios from "axios";
import TenkeyPad from "../components/TenkeyPad.vue";

const router = useRouter();
const route = useRoute();
const store = useAppStore();

const order = ref(null);
const inputValue = ref("");
const showTenkey = ref(false);
const input = ref(null);
const barcodeData = ref(null);

let barcodeBuffer = ""; // Temporary buffer for scanned barcode
let barcodeTimer = null;

onMounted(() => {
  input.value.focus();
  if (store.currentOrder) {
    order.value = store.currentOrder;
  } else {
    fetchOrder(route.params.shippingNo);
  }
  window.addEventListener("keydown", handleGlobalBarcodeInput);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleGlobalBarcodeInput);
});

const fetchOrder = async (shippingNo) => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/orders/${shippingNo}`
    );
    order.value = res.data;
  } catch (err) {
    console.error("Failed to fetch order:", err);
  }
};

const handleBarcodeInput = () => {
  if (barcodeTimer) clearTimeout(barcodeTimer);
  barcodeBuffer = inputValue.value;
  barcodeTimer = setTimeout(() => {
    if (barcodeBuffer.length === 13) processBarcode();
    barcodeBuffer = "";
  }, 300);
};

const handleGlobalBarcodeInput = (e) => {
  if (barcodeTimer) clearTimeout(barcodeTimer);

  if (e.key === "Enter" && barcodeBuffer.length === 13) {
    inputValue.value = barcodeBuffer;
    processBarcode();
    barcodeBuffer = "";
    return;
  }

  if (/^[0-9]$/.test(e.key)) {
    barcodeBuffer += e.key;
  }

  barcodeTimer = setTimeout(() => {
    barcodeBuffer = "";
  }, 300);
};

const processBarcode = async () => {
  const barcode = inputValue.value.trim();
  if (barcode.length !== 13) {
    alert("バーコードは13桁である必要があります。");
    inputValue.value = "";
    return;
  }

  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/barcode/${barcode}`);
    barcodeData.value = {
      lotNo: barcode.slice(0, 7), // First 7 digits as lotNo
      subLotNo: barcode.slice(7, 13), // Last 6 digits as subLotNo
      grade: res.data.grade || 'A',
      length: res.data.length || '4反'
    };
    inputValue.value = ""; // Clear input after processing
  } catch (err) {
    console.error("Failed to process barcode:", err);
    alert("バーコードの処理に失敗しました。");
    barcodeData.value = null;
    inputValue.value = "";
  }
  showTenkey.value = false;
};
</script>

<style scoped>
.container {
  max-width: 375px;
  margin: 0 auto;
  background: #fff;
  height: 667px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-bar {
  position: relative; /* make parent relative */
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 8px;
  border-bottom: 1px solid #dcdcdc;
  background-color: #f9f3f3;
}

.title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  font-weight: bold;
  margin: 0;
}

.back-btn {
  position: absolute;
  left: 8px;
  background: none;
  border: none;
  font-size: 14px;
  color: #007aff;
}

.action-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  font-size: 14px;
  color: #007aff;
}

.back-btn,
.action-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: #007aff;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.order-info,
.barcode-section {
  padding: 12px;
  font-size: 14px;
  flex: 1;
  overflow-y: auto;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #888;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 375px;
  margin: 0 auto;
  display: flex;
  /* height: 48px; */
  padding: 8px;
  border-top: 1px solid #ddd;
  background: #f9f9f9;
  flex-shrink: 0;
}

.input-box {
  flex: 1;
  padding: 6px 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.keypad-btn {
  margin-left: 8px;
  padding: 6px 12px;
  font-size: 14px;
  border: none;
  background: #007aff;
  color: #fff;
  border-radius: 4px;
  box-sizing: border-box;
}
</style>