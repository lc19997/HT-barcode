<!-- <template>
  <div class="app-container">

    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

  
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAppStore } from './stores/appStore'; // Pinia store
import { onMounted } from 'vue';

const router = useRouter();
const store = useAppStore();

// Auto-navigate to Order List if shipper is in cookie
onMounted(() => {
  store.loadShipper(); // Load from cookie
  if (store.selectedShipper && router.currentRoute.value.path === '/') {
    router.push('/orders');
  }
});
</script>

<style scoped>
.app-container {
  max-width: 375px; /* iPhone SE3 logical width */
  margin: 0 auto;
  height: 667px; /* iPhone SE3 logical height */
  overflow-y: auto; /* Scrollable if content exceeds */
  background-color: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative; /* For absolute positioning if needed */
}

.app-header {
  background-color: #007aff; /* Blue from spec images */
  color: white;
  text-align: center;
  padding: 10px 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.app-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.app-header .date {
  margin: 0;
  font-size: 12px;
  opacity: 0.8;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}


.app-footer {
  position: sticky;
  bottom: 0;
  background-color: #007aff;
  padding: 10px;
  text-align: center;
  display: none; 
}

.app-footer button {
  background-color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
}

.app-footer button:hover {
  background-color: #e0e0e0;
}
</style> -->

<template>
  <ShowErrorTest />
</template>

<script setup>
import ShowErrorTest from "./components/ShowErrorTest.vue";
</script>