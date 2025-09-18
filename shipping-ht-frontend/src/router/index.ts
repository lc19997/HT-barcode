import { createRouter, createWebHistory } from 'vue-router';
import ShipperList from '../views/ShipperList.vue';
import OrderList from '../views/OrderList.vue'; // Assume this exists
import Allocated from "../views/Allocated.vue";
import Summary from "../views/Summary.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: ShipperList }, // First page
        { path: '/orders', component: OrderList },
        { path: "/allocated/:shippingNo", component: Allocated, props: true },
        { path: "/summary", component: Summary },
        // { path: '/', component: OrderList }, // First page
    ],
});

export default router;