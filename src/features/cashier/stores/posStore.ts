import { create } from 'zustand';

export interface PosTopping {
  name: string;
  price: number;
}

export interface PosItem {
  cartId: string;
  productId: string;
  name: string;
  price: number;
  photo: string | null;
  quantity: number;
  size: string;
  sizePriceAdjustment: number;
  sugarLevel: string;
  iceLevel: string;
  toppings: PosTopping[];
  notes: string;
}

interface PosState {
  items: PosItem[];
  customerName: string;
  tableNumber: number | null;
  selectedVoucher: any | null;
  setCustomerName: (name: string) => void;
  setTableNumber: (tableNumber: number | null) => void;
  setVoucher: (voucher: any | null) => void;
  addItem: (item: Omit<PosItem, 'cartId'>) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  customerName: '',
  tableNumber: null,
  selectedVoucher: null,
  setCustomerName: (customerName) => set({ customerName }),
  setTableNumber: (tableNumber) => set({ tableNumber }),
  setVoucher: (selectedVoucher) => set({ selectedVoucher }),
  addItem: (newItem) => {
    const items = get().items;
    const configId = `${newItem.productId}-${newItem.size}-${newItem.sugarLevel}-${newItem.iceLevel}-${newItem.toppings
      .map((t) => t.name)
      .sort()
      .join(',')}-${newItem.notes}`;

    const existingIndex = items.findIndex((item) => item.cartId === configId);

    if (existingIndex > -1) {
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += newItem.quantity;
      set({ items: updatedItems });
    } else {
      set({
        items: [...items, { ...newItem, cartId: configId }],
      });
    }
  },
  removeItem: (cartId) => {
    set({
      items: get().items.filter((item) => item.cartId !== cartId),
    });
  },
  updateQuantity: (cartId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(cartId);
      return;
    }
    set({
      items: get().items.map((item) =>
        item.cartId === cartId ? { ...item, quantity } : item
      ),
    });
  },
  clearCart: () => set({ items: [], customerName: '', tableNumber: null, selectedVoucher: null }),
  getCartTotal: () => {
    return get().items.reduce((total, item) => {
      const toppingsTotal = item.toppings.reduce((sum, t) => sum + t.price, 0);
      const itemPrice = Number(item.price) + Number(item.sizePriceAdjustment) + toppingsTotal;
      return total + itemPrice * item.quantity;
    }, 0);
  },
}));
