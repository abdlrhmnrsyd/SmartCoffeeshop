'use server';

import { prisma } from '@/lib/db';
import { OrderStatus, PayStatus, PayMethod, NotificationTarget } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Helper to generate unique order number e.g. CS-20260707-0001
async function generateOrderNumber() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `CS-${dateStr}-`;

  // Count orders today
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const count = await prisma.order.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const nextNumber = String(count + 1).padStart(4, '0');
  return `${prefix}${nextNumber}`;
}

export async function createCustomerOrder(data: {
  customerName: string;
  tableNumber: number;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size: string;
    sizePriceAdjustment: number;
    sugarLevel: string;
    iceLevel: string;
    toppings: Array<{ name: string; price: number }>;
    notes: string;
  }>;
  notes?: string;
}) {
  try {
    const table = await prisma.table.findUnique({
      where: { number: data.tableNumber },
    });

    if (!table) {
      throw new Error(`Table number ${data.tableNumber} not found.`);
    }

    const orderNumber = await generateOrderNumber();

    // Calculate totals
    let subtotal = 0;
    const orderItemsCreate = data.items.map((item) => {
      const itemToppingsPrice = item.toppings.reduce((sum, t) => sum + t.price, 0);
      const itemPrice = Number(item.price) + Number(item.sizePriceAdjustment) + itemToppingsPrice;
      subtotal += itemPrice * item.quantity;

      return {
        productId: item.productId,
        name: item.name,
        price: itemPrice,
        quantity: item.quantity,
        size: item.size,
        sugarLevel: item.sugarLevel,
        iceLevel: item.iceLevel,
        toppings: item.toppings,
        notes: item.notes,
      };
    });

    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // Update table status to occupied
    await prisma.table.update({
      where: { id: table.id },
      data: { status: 'OCCUPIED' },
    });

    // Create Order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        tableId: table.id,
        tableNumber: table.number,
        customerName: data.customerName,
        status: OrderStatus.PENDING_PAYMENT, // Defaults to pending payment
        subtotal,
        tax,
        total,
        notes: data.notes || '',
        items: {
          create: orderItemsCreate,
        },
      },
      include: {
        items: true,
      },
    });

    // Create notification for cashier
    await prisma.notification.create({
      data: {
        title: 'Pesanan Baru Masuk',
        message: `${data.customerName} (Meja ${table.number}) memesan ${data.items.length} item.`,
        role: NotificationTarget.CASHIER,
        tableNumber: table.number,
      },
    });

    return { success: true, orderId: order.id, orderNumber: order.orderNumber };
  } catch (error: any) {
    console.error('Create Order Error:', error);
    return { success: false, error: error.message };
  }
}

export async function callWaiter(tableNumber: number) {
  try {
    await prisma.notification.create({
      data: {
        title: 'Panggilan Pelayan',
        message: `Meja ${tableNumber} memanggil pelayan.`,
        role: NotificationTarget.CASHIER,
        tableNumber,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function requestBill(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new Error('Order not found.');

    await prisma.notification.create({
      data: {
        title: 'Minta Struk Pembayaran',
        message: `Meja ${order.tableNumber} meminta tagihan/bill.`,
        role: NotificationTarget.CASHIER,
        tableNumber: order.tableNumber,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getOrderDetails(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        reviews: true,
      },
    });

    if (!order) {
      return { success: true, order: null };
    }

    const formattedOrder = {
      ...order,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      tax: Number(order.tax),
      total: Number(order.total),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
      payments: order.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    };

    return { success: true, order: formattedOrder };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitOrderReview(orderId: string, rating: number, comment: string) {
  try {
    const review = await prisma.review.create({
      data: {
        orderId,
        rating,
        comment,
      },
    });
    return { success: true, reviewId: review.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
