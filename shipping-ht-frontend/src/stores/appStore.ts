import { defineStore } from 'pinia';
import Cookies from 'js-cookie';

interface Shipper {
    name: string;
    code: string;
    factorycode: string;
}

interface Order {
    shippingNo: string;
    fgrade: string;
    ffabricnum: string;
    fpoppcs: string;
    flotno: string;
}

interface Order {
    shippingNo: string;
    fgrade: string;
    ffabricnum: string;
    fpoppcs: string;
    flotno: string;
}

interface Barcode {
    lotNo: string;
    subLotNo: string;
    grade: string;
    length: number;
    odrflg: string;
}

export const useAppStore = defineStore('app', {
    state: () => ({
        selectedShipper: null as Shipper | null,
        currentOrder: null as Order | null,
        allocatedItems: [] as Order[],
        barcodeDataList: [] as Barcode[],
    }),
    actions: {
        setShipper(shipper: Shipper) {
            this.selectedShipper = shipper;
            Cookies.set('selectedShipper', JSON.stringify(shipper), { expires: 7 });
        },
        loadShipper(): boolean { // Explicitly return boolean
            const cookie = Cookies.get('selectedShipper');
            if (cookie) {
                try {
                    this.selectedShipper = JSON.parse(cookie) as Shipper;
                    return true; // Return true if shipper is loaded
                } catch (e) {
                    console.error('Invalid shipper cookie:', e);
                    this.selectedShipper = null;
                    return false; // Return false on error
                }
            }
            return false; // Return false if no cookie
        },
        setCurrentOrder(order: Order) {
            this.currentOrder = order;
        },
        addAllocatedItem(item: Order) {
            this.allocatedItems.push(item);
        },
        addBarcodeDataList(item: Barcode) {
            this.barcodeDataList.push(item);
        },
    },
});