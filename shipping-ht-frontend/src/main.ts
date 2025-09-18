import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAppStore } from './stores/appStore';

const app = createApp(App);
app.use(createPinia());
app.use(router);

app.mount('#app');

// Check cookie after mount
router.isReady().then(() => {
    // const store = useAppStore();
    // if (store.loadShipper() && router.currentRoute.value.path === '/') {
    router.push('/');
    // }
});