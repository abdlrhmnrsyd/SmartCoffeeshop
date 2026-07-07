import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartTopping {
  name: string;
  price: number;
}

export interface CartItem {
  cartId: string; // Unique configuration identifier
  productId: string;
  name: string;
  price: number; // Base product price
  photo: string | null;
  quantity: number;
  size: string;
  sizePriceAdjustment: number;
  sugarLevel: string;
  iceLevel: string;
  toppings: CartTopping[];
  notes: string;
}

interface CartState {
  items: CartItem[];
  tableNumber: number | null;
  setTableNumber: (tableNumber: number | null) => void;
  addItem: (item: Omit<CartItem, 'cartId'>) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableNumber: null,
      setTableNumber: (tableNumber) => set({ tableNumber }),
      addItem: (newItem) => {
        const items = get().items;
        
        // Generate a unique configuration key to check for duplicates
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
      clearCart: () => set({ items: [] }),
      getCartTotal: () => {
        return get().items.reduce((total, item) => {
          const toppingsTotal = item.toppings.reduce((sum, t) => sum + t.price, 0);
          const itemPrice = Number(item.price) + Number(item.sizePriceAdjustment) + toppingsTotal;
          return total + itemPrice * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'smart-coffee-cart-storage',
    }
  )
);
