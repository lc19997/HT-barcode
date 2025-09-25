<template>
  <div class="container">
    <!-- Header -->
    <header class="nav-bar">
      <div class="left"></div> <!-- for spacing (or back button later) -->
      <h1 class="title">出荷No.選択</h1>
      <div class="username" @click="router.push('/')">
        {{ store.selectedShipper?.name || '' }}
      </div>
    </header>

    <!-- ✅ directly render orders (already filtered by backend) -->
    <ul v-if="orders.length > 0" class="order-list" >
      <li
        v-for="(order, index) in orders"
        :key="order.shippingNo + '-' + index"
        class="order-row"
        @click="goToAllocated(order)"
      >
        <span class="col shipping">{{ order.shippingNo }}</span>
        <span class="col grade">{{ order.fgrade }}</span>
        <span class="col instructed">{{ order.ffabricnum }}</span>
        <span class="col allocated">{{ order.fpoppcs || "0" }}</span>
        <span class="arrow">&gt;</span>
      </li>
    </ul>
    <div v-else class="no-data">データがありません</div>

    <!-- Footer with keypad 出荷No入力 -->
    <footer class="footer">
      <div class="footer-container">
        <input
          name="filter"
          v-model="filter"
          ref="input"
          class="filter-input"
          placeholder=""
          @keydown.enter.prevent="fetchOrders"  
        />
        <button @click="showTenkey = true" class="keypad-btn">KeyPad</button>
      </div>
    </footer>

    <!-- Tenkey Pad -->
    <TenkeyPad
      v-if="showTenkey"
      @enter="handleTenkeyInput"
      @close="showTenkey = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/appStore";
import axios from "axios";
import TenkeyPad from "../components/TenkeyPad.vue";

const filter = ref("");
const orders = ref([]);           // ✅ only filtered data from backend
const showTenkey = ref(false);
const input = ref(null);
const router = useRouter();
const store = useAppStore();

let barcodeBuffer = "";
let barcodeTimer = null;

onMounted(async () => {
  if (!store.selectedShipper) router.push("/");

  // Focus input
  input.value.focus();

  // ✅ fetch first page (all orders or filtered by empty keyword)
  await fetchOrders();

  if (router.currentRoute.value.name === "OrderList") {
    window.addEventListener("keydown", handleBarcodeInput);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleBarcodeInput);
});

// ✅ now filtering happens on backend
const fetchOrders = async () => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/orders`,
      {
        params: {
          shipper: store.selectedShipper?.factorycode,
          keyword: filter.value || "",  // send filter keyword to backend
        },
      }
    );
    orders.value = [...res.data];
     console.log("Fetched orders:", orders.value);
  } catch (err) {
    console.error("Failed to fetch orders:", err);18
    orders.value = [];
  }
};

// handle keypad input
const handleTenkeyInput = (value) => {
  filter.value = value;
  showTenkey.value = false;
  fetchOrders();   // fetch again when keypad used
}  

// handle barcode input
const handleBarcodeInput = (e) => {
  if (barcodeTimer) clearTimeout(barcodeTimer);

  if ((e.key === "Enter" && barcodeBuffer.length > 0 )) {
    if (barcodeBuffer.length > 0) {
      filter.value = barcodeBuffer;
      console.log("Scanned barcode:", barcodeBuffer);
      fetchOrders();   // fetch from backend with scanned code
      barcodeBuffer = "";
    }
    return;
  }

  if (/^[0-9a-zA-Z]$/.test(e.key)) {
    barcodeBuffer += e.key;
  }
  console.log("barcode:", barcodeBuffer);

  barcodeTimer = setTimeout(() => {
    barcodeBuffer = "";
  }, 3000);
};

// navigate to allocated page
const goToAllocated = (order) => {
  store.currentOrder = order;
  router.push(`/allocated/${order.shippingNo}`);
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
  border: 0px solid #ccc;
  overflow:hidden;
}

/* Header */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 8px;
  border-bottom: 1px solid #dcdcdc;
  background-color: #f8f9fa;
  position: relative;
}

.order-list {
  -webkit-overflow-scrolling: touch;
}

.title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  font-weight: bold;
  margin: 0;
}

.username {
  font-size: 14px;
  color: #007aff;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #888;
}

.order-list {
  flex: 1;
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  padding-top: 5px;
}
.order-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  font-size: 15px;
  height: 20px;
}
.order-row:hover {
  background: #f5f5f5;
  cursor: pointer;
}
.col {
  flex: 1;
  text-align: left;
}
.col.shipping {
  flex: 2;
}
.col.grade,
.col.instructed,
.col.allocated {
  text-align: center;
}

.order-row .arrow {
  margin-left: auto;
  color: #999;
  font-weight: bold;
}

/* Footer */
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
  padding: 8px;
  border-top: 1px solid #ddd;
  background: #f5f5f5;
}

.footer-container {
  width: 150px;
  position: relative;
}


.filter-input {
  padding: 6px 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
}

.filter-input:focus,
.filter-input:focus-visible {
  border-color: white;      /* white border on focus */
  outline: white;
  caret-color: #6486f6;         /* optional: caret color */
}
.keypad-btn {
  position: absolute;
  padding: 6px 12px;
  font-size: 14px;
  border: none;
  background: #f9f9f9;
  color: #007aff;
  border-radius: 4px;
  top: 1px;
  right: -95px;
}
</style>
