<template>
  <div class="container">
    <!-- Header -->
    <header class="nav-bar">
      <button class="nav-button left" @click="goBack">
        &lt; {{ store.currentOrder?.shippingNo || '出荷No' }}
      </button>
      <h1 class="title">集計</h1>
      <div class="right"></div>
    </header>

    <!-- Summary Table -->
    <main class="summary-content">
      <table class="summary-table">
        <tbody>
          <!-- 合計 -->
          <tr class="summary-row total">
            <td>合計</td>
            <td></td>
            <td>{{ totalRecords }}</td>
            <td>{{ totalLength }}</td>
          </tr>

          <!-- 等級ごと -->
          <tr
            class="summary-row grade"
          >
            <td>{{store.currentOrder?.flotno }}</td>
            <td class="grade">{{ store.currentOrder?.fgrade }}</td>
            <td>{{ totalRecords }}</td>
            <td class="length">{{ totalLength }}</td>
          </tr>

          <!-- 等級 + 長さごと -->
          <tr
            v-for="(barcodeData, index) in store.barcodeDataList"
            :key="barcodeData.grade + '-' + index"
            class="summary-row detail"
          >
            <td></td>
            <td class="grade">{{ barcodeData?.grade }} {{ barcodeData?.length }}</td>
            <td>1</td>
            <td class="length">{{ barcodeData?.length }}</td>
          </tr>
        </tbody>
      </table>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <!-- <button class="save-btn" @click="saveData">保存</button> -->

      <button class="save-btn" @click="saveData" :disabled="isSaving">
        <span v-if="isSaving" class="spinner"></span>
        <span v-if="isSaving" class="btn-text">保存</span>
        <span v-if="!isSaving">保存</span>
      </button>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/appStore";
import axios from "axios";

const router = useRouter();
const store = useAppStore();

const isSaving = ref(false);

// --- 集計データ ---
const totalRecords = computed(() =>
  store.barcodeDataList?.reduce((sum, item) => sum + 1, 0) || 0
);

const totalLength = computed(() =>
  store.barcodeDataList?.reduce((sum, item) => sum + item.length, 0)
);

// --- グループ化（例: lotNoごと / gradeごと） ---
const groupedByLot = computed(() => {
  const map = {}; // no type annotation
  for (const item of store.barcodeDataList) {
    const key = item.lotNo + "-" + item.grade;
    if (!map[key]) {
      map[key] = { lotNo: item.lotNo, grade: item.grade, count: 0, length: 0 };
    }
    map[key].count++;
    map[key].length += item.length;
  }
  return Object.values(map);
});

// --- Navigation & save ---
const goBack = () => {
  router.push("/orders"); // back to 受注一覧
};

const saveData = async () => {
  console.log(store.barcodeDataList);
  isSaving.value = true;
  try {
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/save`, {
      barcodeData: store.barcodeDataList,
      fodrflg: store.currentOrder.fodrflg,
      fodrno: store.currentOrder.fodrno
    });
    router.push("/orders");
    isSaving.value = false;
  } catch (err) {
    console.error("保存に失敗しました:", err);
    alert("保存に失敗しました");
    isSaving.value = false;
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 622px;
  max-width: 375px;
  margin: 0 auto;
  background: #fff;
}

/* Header */
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

.title {
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

.nav-button.right {
  position: absolute;
  right: 5px;
}
.nav-button {
  font-size: 15px;
  color: #007aff;
  background: none;
  border: none;
}

/* Table */
.summary-content {
  flex: 1;
  overflow-y: auto;
  margin: 45px 0 0 0;
}
.summary-table {
  width: 100%;
  border-collapse: collapse;
}
.summary-row td {
  padding: 8px;
  border-bottom: 1px solid #eee;
  font-size: 15px;
}
.summary-row.total td {
  font-weight: bold;
}

/* Footer */
/* .footer {
  border-top: 1px solid #ddd;
  padding: 8px;
  background: #f9f9f9;
} */

.grade {
  text-align: left;
}

.length {
  text-align: right;
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
.save-btn {
  position: relative;
  width: 100%;
  padding: 10px;
  font-size: 16px;
  background: #fff;
  color: #d3d3d3;
  border: none;
  border-radius: 6px;

  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-text {
  position: fixed;
  right: 55px;
}

/* Spinner */
.spinner {
  border: 2px solid rgba(175, 170, 170, 0.3);
  border-top: 2px solid #fff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Footer */
.summary-table td {
  white-space: nowrap;
  text-align: center;
}
.summary-table td:first-child {
  text-align: left;
}

</style>
