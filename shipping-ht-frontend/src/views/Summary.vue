<template>
  <div class="container">
    <!-- Header -->
    <header class="nav-bar">
      <button class="nav-button left" @click="goBack">
        {{ store.currentOrder?.shippingNo || '出荷No' }}
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
            <td>{{ totalRecords }}</td>
            <td>{{ totalLength }}</td>
          </tr>

          <!-- 等級ごと -->
          <tr
            v-for="grade in groupedByGrade"
            :key="grade.grade"
            class="summary-row grade"
          >
            <td>{{store.currentOrder?.flotno }}</td>
            <td>{{ store.currentOrder?.fgrade }}</td>
            <td>{{ store.currentOrder?.fpoppcs }}</td>
            <td>{{ store.currentOrder?.ffabricnum }}</td>
          </tr>

          <!-- 等級 + 長さごと -->
          <tr
            v-for="item in groupedByGradeLength"
            :key="item.grade + '-' + item.length"
            class="summary-row detail"
          >
            <td>{{ store.barcodeDataList?.grade }} {{ store.barcodeDataList?.length }}</td>
            <td>{{ store.barcodeDataList?.p }}</td>
            <td>{{ item.total }}</td>
          </tr>
        </tbody>
      </table>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <button class="save-btn" @click="saveData">保存</button>
    </footer>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/appStore";
import axios from "axios";

const router = useRouter();
const store = useAppStore();

// --- 集計データ ---
const totalQty = computed(() =>
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
  try {
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/save`, {
      shippingNo: store.currentOrder.shippingNo,
      allocations,
    });
    router.push("/orders");
  } catch (err) {
    console.error("保存に失敗しました:", err);
    alert("保存に失敗しました");
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 375px;
  margin: 0 auto;
  background: #fff;
}

/* Header */
.nav-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center; /* center contents */
  height: 44px;
  padding: 0 8px;
  border-bottom: 1px solid #dcdcdc;
  background: #fff;
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
.footer {
  border-top: 1px solid #ddd;
  padding: 8px;
  background: #f9f9f9;
}
.save-btn {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 6px;
}
</style>
