<template>
  <div class="container">
    <!-- Header -->
    <header class="nav-bar">
      <button class="back-btn" @click="router.push('/orders')">&lt; 出荷No.選択</button>
      <h1 class="title">{{ order?.shippingNo }}</h1>
      <button class="action-btn" @click="router.push('/summary')">集計</button>
    </header>

    <!-- Lot / SubLot list -->
    <ul v-if="barcodeDataList.length > 0" class="lot-list">
      <li v-for="(item, idx) in barcodeDataList" :key="idx" class="lot-row">
        <span class="check">✔</span>
        <span class="lot">{{ item.lotNo }}-{{ item.subLotNo }}</span>
        <span class="grade">{{ item.grade }}</span>
        <span class="length">{{ item.length }}m</span>
      </li>
    </ul>

    <!-- Order Details -->
    <section class="order-info" v-if="order">
      <div class="detail-row">在庫No: {{ order.flotno || 'N/A' }}</div>
      <!-- <div class="detail-row">加工No: {{ order.processNo || 'N/A' }}</div> -->
      <div class="detail-row">等級: {{ order.fgrade || 'N/A' }}</div>
      <div class="detail-row">反数: {{ order.ffabricnum || 'N/A' }}</div>
    </section>
    <div v-else class="no-data">注文データがありません</div>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-container">
        <input
          v-model="inputValue"
          placeholder=""
          class="input-box"
          ref="input"
          @input="handleBarcodeInput"
          @keypress.enter="processBarcode"
        />
        <button @click="showTenkey = true" class="keypad-btn">KeyPad</button>
      </div>
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
import { ref, onMounted, onBeforeUnmount } from "vue";
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
const barcodeDataList = ref([]);

let barcodeBuffer = "";
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
    if (barcodeBuffer.length === 13) processBarcode(barcodeBuffer);
    barcodeBuffer = "";
  }, 300);
};

const handleGlobalBarcodeInput = (e) => {
  if (barcodeTimer) clearTimeout(barcodeTimer);

  if (e.key === "Enter" && barcodeBuffer.length === 13) {
    processBarcode(barcodeBuffer);
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

// --- バーコード/入力値の処理 ---
const processBarcode = async (raw) => {
  const barcode = String(raw || inputValue.value || "").trim();
  if (barcode.length !== 13) {
    showError("バーコードは13桁である必要があります。");
    inputValue.value = "";
    return;
  }

  const lotNo = barcode.slice(0, 10);
  const subLotNo = barcode.slice(10, 13);

  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/barcode-data`,
      {
        params: {
          lotNo,
          subLotNo,
          shippingNo: order.value.shippingNo,
        },
      }
    );

    if (!res.data) {
      showError("データが見つかりませんでした。");
      return;
    }

    // --- エラーチェック ---
    if (order.value.flotno && order.value.flotno !== lotNo) {
      showError("在庫Noが一致しません。");
      return;
    }
    console.log("responsive data:", res.data[0]);

    // 正常時 → リストに追加
    barcodeDataList.value.push({
      lotNo: res.data[0].FLOTNO,
      subLotNo: res.data[0].FLOTNO2,
      grade: res.data[0].FRANK,
      length: res.data[0].FOHQTY,
    });

    inputValue.value = "";
    showTenkey.value = false;
  } catch (err) {
    console.error("Failed to process barcode:", err);
    showError("バーコードの処理に失敗しました。");
    inputValue.value = "";
  }
};

// --- エラー処理（音＋バイブ） ---
const showError = (msg) => {
    // アラート音
  const audio = new Audio("/error.mp3");
  audio.play().catch(() => {
    console.log("⚠️ Audio play failed, playing beep instead");
    playBeep();
  });

  // バイブレーション
  if (navigator.vibrate) {
    const didVibrate = navigator.vibrate([200, 100, 200]);
    console.log("✅ Vibrate triggered:", didVibrate);
  } else {
    console.log("❌ Vibrate not supported");
  }
  alert(msg);

  showTenkey.value = false;
};

const playBeep = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.type = "square"; // beep type
  osc.frequency.value = 440; // Hz (A4 note)
  osc.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3); // play 0.2 sec
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
  background-color: #f8f9fa;
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
  justify-content: center; 
  align-items: center;
  /* height: 48px; */
  padding: 8px;
  border-top: 1px solid #ddd;
  background: #f5f5f5;
  flex-shrink: 0;
}

.footer-container {
  width: 150px;
  position: relative;
}

.input-box {
  flex: 1;
  padding: 6px 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  width: 100%;
}

.input-box:focus,
.input-box:focus-visible {
  border-color: white;      /* white border on focus */
  outline: white;
  caret-color: #6486f6;         /* optional: caret color */
}

.keypad-btn {
  position: absolute;
  margin-left: 8px;
  padding: 6px 12px;
  font-size: 14px;
  border: none;
  background: #f9f9f9;
  color: #007aff;
  border-radius: 4px;
  box-sizing: border-box;
  top: 1px;
  right: -95px;
}

.lot-list {
  list-style: none;         /* remove front dots */
  padding: 0;
  margin: 16px 0;
  /* border: 1px solid #e0e0e0;
  border-radius: 8px; */
  overflow: hidden;
}

.lot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  background: #fff;
  transition: background 0.2s;
}

.lot-row:last-child {
  border-bottom: none;
}

/* .lot-row:hover {
  background: #f9f9f9;
} */

.check {
  color: #4caf50;           /* green check */
  font-weight: bold;
  margin-right: 8px;
}

.lot {
  flex: 2;
  font-weight: 600;
  color: #333;
}

.grade {
  flex: 1;
  text-align: center;
  font-weight: 500;
  color: #000000;           /* blue for grade */
}

.length {
  flex: 1;
  text-align: right;
  font-weight: 500;
  color: #555;
}

</style>