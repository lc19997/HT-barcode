<template>
  <div class="container" ref ="containerEl">
    <!-- Header -->
    <header class="nav-bar">
      <button class="back-btn" @click="router.push('/orders')">&lt; 出荷No.選択</button>
      <h1 class="title">{{ order?.shippingNo }}</h1>
      <button class="action-btn" @click="gotosummary()">集計</button>
    </header>

    <div class="data-container">
      <!-- Lot / SubLot list -->
      <ul v-if="barcodeDataList.length > 0" class="lot-list">
        <li v-for="(item, idx) in barcodeDataList" :key="item.id" class="lot-row">
          <span class="check">✔</span>
          <span class="lot">{{ item.lotNo }}-{{ String(item.subLotNo).padStart(3, '0') }}</span>
          <span class="grade">{{ item.grade }}</span>
          <span class="length">{{ item.length }}m</span>
        </li>
      </ul>

            <!-- Lot / SubLot list -->
      <ul v-if="unverfiedBarCodeDataList.length > 0" class="lot-list">
        <li v-for="(item, idx) in unverfiedBarCodeDataList" :key="item.id" class="lot-row">
          <span class="nocheck">     </span>
          <span class="lot">{{ item.lotNo }}-{{ String(item.subLotNo).padStart(3, '0') }}</span>
          <span class="grade">{{ item.grade }}</span>
          <span class="length">{{ item.length }}m</span>
        </li>
      </ul>

      <!-- Order Details -->
      <section class="order-info" v-if="order">
        <div class="detail-row"> &nbsp; &nbsp;在庫No: {{ order.flotno || 'N/A' }}</div>
        <!-- <div class="detail-row">加工No: {{ order.processNo || 'N/A' }}</div> -->
        <div class="detail-row"> &nbsp; &nbsp;等級: {{ order.fgrade || 'N/A' }}</div>
        <div class="detail-row"> &nbsp; &nbsp;反数: {{ order.ffabricnum || 'N/A' }}</div>
      </section>
      <div v-else class="no-data">注文データがありません</div>
    </div>
    

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-container">
        <input
          v-model="inputValue"
          name="inputValue"
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
      v-model="inputValue"
      @enter="handleTenkeyInput"
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
const unverfiedBarCodeDataList = ref([]);

let barcodeBuffer = "";
let barcodeTimer = null;

onMounted(() => {
  input.value.focus();
  if (store.currentOrder) {
    order.value = store.currentOrder;
  } else {
    fetchOrder(route.params.shippingNo);
  }
  fetchList(store.currentOrder.flotno, route.params.shippingNo);
  window.addEventListener("keydown", handleGlobalBarcodeInput);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleGlobalBarcodeInput);
});

const handleTenkeyInput = (value) => {
  inputValue.value = value;
  console.log("tenkey:", inputValue.value);
  //showTenkey.value = false;
  processBarcode(value);
  //fetchOrders();   // fetch again when keypad used
}  

const fetchList = async (barcode, fshpno) => {

  // const FODRFLG = order?.fodrflg;
  // const FODRNO = order?.fdrno;

  const FODRFLG = order.value.fodrflg;
  const FODRNO = order.value.fodrno;
  

  const res = await axios.get(
    `${import.meta.env.VITE_API_BASE_URL}/api/barcode/get`,
    {
      params: {
        FODRFLG,
        FODRNO,
      },
    }
  );
  res.data.data.forEach(element => {
    barcodeDataList.value.push({
      id : Date.now() + Math.random(),
      lotNo: element.FLOTNO,
      subLotNo: element.FLOTNO2,
      grade: element.FFLSEGMENT02.trim(),
      length: element.FPOPQTY,
      // ordflg: element.FODRFLG
    });
  });
  console.log(barcodeDataList.value);
}

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
    //inputValue.value = "";
    return;
  }

  const lotNo = barcode.slice(0, 10);
  const subLotNo = barcode.slice(10, 13);

  // 1. 在庫No一致チェック
  if (order.value.flotno && order.value.flotno !== lotNo) {
    showError("在庫Noが一致しません。");
    return;
  }

  try {
    // 2. DBに存在するかチェック
    const lookupRes = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/barcode/lookup`,
      {
        params: {
          barcode,
          fshpno: order.value.shippingNo
        }
      }
    );

     const alreadyExists = lookupRes.data.count > 0;
    // if (alreadyExists) {
    //     lookupRes.data.data.forEach(element => {
    //     unverfiedBarCodeDataList.value.push({
    //       lotNo: element.FLOTNO,
    //       subLotNo: element.FLOTNO2,
    //       grade: element.FRANK,
    //       length: element.FOHQTY,
    //     // ordflg: element.FODRFLG
    //     });
    //  });
    // }

    // 3. 登録API呼び出し (existsフラグは backend に送る)
    const addRes = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/add-barcode`,
      {
        barcode,
        fshpno: order.value.shippingNo,
        fpoptrnno: Date.now(), // FIXME: should be Oracle sequence
        isExist: alreadyExists
      }
    );

    console.log("Insert result:", addRes);

    // 4. フロントリストに追加
    if(!alreadyExists){
      unverfiedBarCodeDataList.value.push({
        id : Date.now() + Math.random(),
        lotNo: lotNo,
        subLotNo: subLotNo,
        grade: addRes.data.data[0].FRANK,
        length: addRes.data.data[0].FOHQTY,
      });
      console.log(unverfiedBarCodeDataList.value);
      //   store.addBarcodeDataList({
      //   lotNo: lotNo,
      //   subLotNo: subLotNo,
      //   grade: addRes.data.data[0].FRANK,
      //   length: addRes.data.data[0].FOHQTY,
      // });
    }else{
      barcodeDataList.value = barcodeDataList.value.filter(item =>
        !(normalizeLot(item.lotNo) === normalizeLot(lotNo) &&
          normalizeSub(item.subLotNo) === normalizeSub(subLotNo))
      );
    } 

    store.addBarcodeDataList({
      lotNo,
      subLotNo,
      grade: order.value.fgrade || "",
      length: order.value.fohqty || "",
    });

    inputValue.value = "";
    showTenkey.value = false;
  } catch (err) {
    console.error("Failed to process barcode:", err);
    showError("バーコード処理に失敗しました。");
    inputValue.value = "";
  }
};

const normalizeLot = (v) => String(v || "").trim();
const normalizeSub = (v) => String(v || "").trim().padStart(3, "0");

const removeFromBarcodeDataList = (lotNo, subLotNo) => {
  barcodeDataList.value = barcodeDataList.value.filter(
    (item) => !(item.lotNo === lotNo && String(item.subLotNo) === String(subLotNo))
  );
};

// --- エラー処理（音＋バイブ + シェイク） ---
const showError = (msg) => {
  playBeep(); // always beep
  triggerVibration(); // vibration or shake fallback
  setTimeout(() => alert(msg), 400);
  showTenkey.value = false;
};

// --- vibration + fallback ---
const triggerVibration = () => {
  shakeFallback();
  if ("vibrate" in navigator) {
    const didVibrate = navigator.vibrate([200, 100, 200]);
    console.log("✅ Vibrate triggered:", didVibrate);
  } else {
    console.log("❌ Vibrate not supported. Using shake fallback...");
    shakeFallback();
  }
};

const gotosummary = () => {
    // Merge verified + unverified barcodes
  const mergedBarcodes = [
    ...barcodeDataList.value,
    ...unverfiedBarCodeDataList.value
  ];

  // Clear store list first (optional)
  store.barcodeDataList = [];

  // Add each item to the store
  mergedBarcodes.forEach(item => store.addBarcodeDataList(item));
  router.push("/summary");
}

// --- shake fallback animation ---
const containerEl = ref(null);

const shakeFallback = () => {
  const el = containerEl.value || document.body; 
  el.classList.add("shake");
  setTimeout(() => el.classList.remove("shake"), 400);
};


const playBeep = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  const playTone = (freq, start, duration) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine"; // smoother error tone
    osc.frequency.value = freq;

    // fade out
    gainNode.gain.setValueAtTime(1, ctx.currentTime + start);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + start + duration
    );

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + duration);
  };

  // Error-like sound: high → low beep
  playTone(800, 0, 0.15);
  playTone(500, 0.18, 0.15);

  setTimeout(() => ctx.close(), 500);
};
</script>


<style scoped>
.container {
  max-width: 375px;
  margin: 0 auto;
  background: #fff;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  height: 100vh;
}
.nocheck{
  padding-left: 20px;
}

.nav-bar {
  position: fixed; /* make parent relative */
  top: 0px;
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 8px;
  border-bottom: 1px solid #dcdcdc;
  background-color: #f8f9fa;
  max-width: 359px;
  width: 100%;
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
  position: fixed;
  bottom: 40px;
  max-width: 375px;
  width: 100%;
  padding: 8px 0px;
  font-size: 14px;
  flex: 1;
  overflow-y: auto;
  background-color: #f5f5f5;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
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
  height: 48px;
  padding: 0px 0px;
  border-top: 1px solid #ddd;
  background: #f5f5f5;
  flex-shrink: 0;
}

.footer-container {
  /*width: 150px; */
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
  margin-left: 5px;
  padding: 6px 12px;
  font-size: 14px;
  border: none;
  background: #f5f5f5;
  color: #007aff;
  border-radius: 4px;
  box-sizing: border-box;
  top: 1px;
  right: -91px;
}

.data-container {
  margin: 45px 0 161px 0;
  overflow-y: auto;
}

.lot-list {
  list-style: none;         /* remove front dots */
  padding: 0;
  margin: 0 0 0 0;
}

.lot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
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

.footer {
  bottom: env(safe-area-inset-bottom); /* handles iPhone notch */
}


@keyframes shake {
  0%   { transform: translateX(0); }
  20%  { transform: translateX(-7px); }
  40%  { transform: translateX(5px); }
  60%  { transform: translateX(-3px); }
  80%  { transform: translateX(1px); }
  100% { transform: translateX(0); }
}

.shake {
  animation: shake 0.4s ease-in-out;
}


</style>