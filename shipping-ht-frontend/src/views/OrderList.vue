<template>
  <div class="container">
    <!-- Header -->
    <header class="nav-bar">
      <div class="left"></div> <!-- for spacing (or back button later) -->
      <h1 class="title">出荷No.選択</h1>
      <div class="username" @click="router.push('/')">
        {{ store.selectedShipper?.name || '' }}
      </div>
      <!-- <span class="username">{{ store.userName }}</span> -->
    </header>

    <!-- Orders list -->
    <ul v-if="orders.length > 0" class="order-list">
      <li
        v-for="order in orders"
        :key="order.shippingNo"
        class="order-row"
        @click="goToAllocated(order)"
      >
        <span class="col shipping">{{ order.shippingNo }}</span>
        <span class="col grade">{{ order.grade }}</span>
        <span class="col instructed">{{ order.instructedQty }}</span>
        <span class="col allocated">{{ order.allocatedQty }}</span>
        <span class="arrow">&gt;</span>
      </li>
    </ul>
    <div v-else class="no-data">データがありません</div>


    <!-- Footer with keypad -->
    <footer class="footer">
      <input
        v-model="filter"
        placeholder="出荷No入力"
        ref="input"
        @input="fetchOrders"
        class="filter-input"
      />
      <button @click="showTenkey = true" class="keypad-btn">KeyPad</button>
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
const orders = ref([]);
const showTenkey = ref(false);
const input = ref(null);
const router = useRouter();
const store = useAppStore();

let barcodeBuffer = ""; // temporary buffer for scanned code
let barcodeTimer = null;

onMounted(() => {
  if (!store.selectedShipper) router.push("/");

  // Focus input
  input.value.focus();
  fetchOrders();

  // Attach global keydown listener (for barcode scanners)
  window.addEventListener("keydown", handleBarcodeInput);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleBarcodeInput);
});

const fetchOrders = async () => {
  try {
    console.log("fetchOrders!!!");
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/orders`,
      {
        params: {
          filter: filter.value,
          shipper: store.selectedShipper?.name,
        },
      }
    );
    orders.value = res.data;
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    orders.value = [];
  }
};

// handle manual filtering
const handleTenkeyInput = (value) => {
  filter.value += value;
  fetchOrders();
  showTenkey.value = false;
};

// barcode scanning (keyboard wedge)
const handleBarcodeInput = (e) => {
  if (barcodeTimer) clearTimeout(barcodeTimer);

  // If Enter pressed → treat as full barcode
  if (barcodeBuffer.length > 9) {
    console.log("Scanned barcode:", barcodeBuffer);
    filter.value = barcodeBuffer;
    fetchOrders();
    barcodeBuffer = "";
    return;
  }

  // Append key to buffer
  if (/^[0-9a-zA-Z]$/.test(e.key)) {
    barcodeBuffer += e.key;
  }

  // Reset buffer if no input for 300ms (scanner usually types super fast)
  barcodeTimer = setTimeout(() => {
    barcodeBuffer = "";
  }, 300);
};

const goToAllocated = (order) => {
  store.currentOrder = order;
  router.push(`/allocated/:${order.shippingNo}`);
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
  background-color: #f9f3f3;
  position: relative;
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
  padding: 8px;
  border-top: 1px solid #ddd;
  background: #f9f9f9;
}


.filter-input {
  flex: 1;
  padding: 6px 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.keypad-btn {
  margin-left: 8px;
  padding: 6px 12px;
  font-size: 14px;
  border: none;
  background: #007aff;
  color: #fff;
  border-radius: 4px;
}
</style>
