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
            <td>{{ grade.grade }}</td>
            <td>{{ grade.count }}</td>
            <td>{{ grade.length }}</td>
          </tr>

          <!-- 等級 + 長さごと -->
          <tr
            v-for="item in groupedByGradeLength"
            :key="item.grade + '-' + item.length"
            class="summary-row detail"
          >
            <td>{{ item.grade }} {{ item.length }}</td>
            <td>{{ item.count }}</td>
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

// Suppose store.currentOrder has `allocations` data
// Example: [{ grade: 'A', length: 514, count: 1 }, ...]
const allocations = store.currentOrder?.allocations || [];

// --- Computed summaries ---
const totalRecords = computed(() =>
  allocations.reduce((sum, row) => sum + row.count, 0)
);

const totalLength = computed(() =>
  allocations.reduce((sum, row) => sum + row.length * row.count, 0)
);

const groupedByGrade = computed(() => {
  const map = {};
  allocations.forEach((row) => {
    if (!map[row.grade]) {
      map[row.grade] = { grade: row.grade, count: 0, length: 0 };
    }
    map[row.grade].count += row.count;
    map[row.grade].length += row.length * row.count;
  });
  return Object.values(map);
});

const groupedByGradeLength = computed(() => {
  const map = {};
  allocations.forEach((row) => {
    const key = `${row.grade}-${row.length}`;
    if (!map[key]) {
      map[key] = {
        grade: row.grade,
        length: row.length,
        count: 0,
        total: 0,
      };
    }
    map[key].count += row.count;
    map[key].total += row.length * row.count;
  });
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
