'use server';

import { prisma } from '@/lib/db';
import { OrderStatus, PayStatus, PayMethod, ShiftStatus, PaymentStatus, NotificationTarget } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Helper to generate order number
async function generateOrderNumber() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `CS-${dateStr}-`;

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

// 1. Shift Actions
export async function getActiveShift(cashierId: string) {
  try {
    const shift = await prisma.shift.findFirst({
      where: {
        cashierId,
        status: ShiftStatus.OPEN,
      },
    });
    if (!shift) {
      return { success: true, shift: null };
    }
    const formattedShift = {
      ...shift,
      startCash: Number(shift.startCash),
      endCash: shift.endCash ? Number(shift.endCash) : null,
      actualCash: shift.actualCash ? Number(shift.actualCash) : null,
    };
    return { success: true, shift: formattedShift };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function openShift(cashierId: string, startCash: number, notes?: string) {
  try {
    // Check if there is already an open shift
    const existing = await prisma.shift.findFirst({
      where: { cashierId, status: ShiftStatus.OPEN },
    });

    if (existing) {
      throw new Error('Ada shift yang masih terbuka untuk kasir ini.');
    }

    const shift = await prisma.shift.create({
      data: {
        cashierId,
        startCash,
        notes: notes || '',
        status: ShiftStatus.OPEN,
      },
    });

    const formattedShift = {
      ...shift,
      startCash: Number(shift.startCash),
      endCash: shift.endCash ? Number(shift.endCash) : null,
      actualCash: shift.actualCash ? Number(shift.actualCash) : null,
    };

    return { success: true, shift: formattedShift };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function closeShift(data: {
  shiftId: string;
  endCash: number;
  actualCash: number;
  notes?: string;
}) {
  try {
    const shift = await prisma.shift.update({
      where: { id: data.shiftId },
      data: {
        endTime: new Date(),
        endCash: data.endCash,
        actualCash: data.actualCash,
        notes: data.notes || '',
        status: ShiftStatus.CLOSED,
      },
    });

    const formattedShift = {
      ...shift,
      startCash: Number(shift.startCash),
      endCash: shift.endCash ? Number(shift.endCash) : null,
      actualCash: shift.actualCash ? Number(shift.actualCash) : null,
    };

    return { success: true, shift: formattedShift };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Order POS Checkout Actions
export async function checkoutPosOrder(data: {
  cashierId: string;
  customerName: string;
  tableNumber: number | null;
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
  paymentMethod: PayMethod;
  voucherCode?: string;
  discount: number;
  notes?: string;
}) {
  try {
    const orderNumber = await generateOrderNumber();

    // Verify cashier shift is open
    const shift = await prisma.shift.findFirst({
      where: { cashierId: data.cashierId, status: ShiftStatus.OPEN },
    });
    if (!shift) {
      throw new Error('Anda harus membuka shift terlebih dahulu sebelum melakukan transaksi.');
    }

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

    const tax = (subtotal - data.discount) * 0.1;
    const total = subtotal - data.discount + tax;

    let tableId = null;
    if (data.tableNumber) {
      const tbl = await prisma.table.findUnique({ where: { number: data.tableNumber } });
      if (tbl) {
        tableId = tbl.id;
        await prisma.table.update({
          where: { id: tbl.id },
          data: { status: 'OCCUPIED' },
        });
      }
    }

    // Create Order (Directly PAID and ACCEPTED since it's manual cashier POS checkout)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        tableId,
        tableNumber: data.tableNumber,
        customerName: data.customerName,
        cashierId: data.cashierId,
        status: OrderStatus.ACCEPTED, // Flows directly to barista
        subtotal,
        discount: data.discount,
        tax,
        total,
        paymentStatus: PayStatus.PAID,
        paymentMethod: data.paymentMethod,
        voucherCode: data.voucherCode || null,
        notes: data.notes || '',
        items: {
          create: orderItemsCreate,
        },
      },
    });

    // Create Payment Log
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: total,
        paymentType: data.paymentMethod,
        status: PaymentStatus.COMPLETED,
      },
    });

    return { success: true, orderId: order.id, orderNumber: order.orderNumber };
  } catch (error: any) {
    console.error('POS Checkout Error:', error);
    return { success: false, error: error.message };
  }
}

// 3. Payment Processing for incoming customer orders
export async function processCustomerPayment(data: {
  orderId: string;
  cashierId: string;
  paymentMethod: PayMethod;
  amountPaid: number;
}) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) throw new Error('Order not found.');

    // Update order payment status
    await prisma.order.update({
      where: { id: data.orderId },
      data: {
        cashierId: data.cashierId,
        paymentStatus: PayStatus.PAID,
        paymentMethod: data.paymentMethod,
        status: OrderStatus.ACCEPTED, // Accept order, pushes to barista
      },
    });

    // Save payment log
    await prisma.payment.create({
      data: {
        orderId: data.orderId,
        amount: order.total,
        paymentType: data.paymentMethod,
        status: PaymentStatus.COMPLETED,
      },
    });

    // Notification to barista
    await prisma.notification.create({
      data: {
        title: 'Pesanan Masuk Barista',
        message: `Mulai pengerjaan untuk order ${order.orderNumber} (Meja ${order.tableNumber || 'Take-away'}).`,
        role: NotificationTarget.BARISTA,
        tableNumber: order.tableNumber,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Update Order Status (Barista & Cashier Status manager)
export async function updateOrderStatus(orderId: string, status: OrderStatus, userId?: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) throw new Error('Order not found.');

    // Critical Requirement: Deduct stock when order is completed
    if (status === OrderStatus.COMPLETED && order.status !== OrderStatus.COMPLETED) {
      
      // Deduct ingredients based on recipe
      for (const item of order.items) {
        const recipes = await prisma.recipe.findMany({
          where: { productId: item.productId },
          include: { ingredient: true },
        });

        for (const recipe of recipes) {
          const totalDeduct = Number(recipe.quantity) * item.quantity;
          
          // Decrement stock
          await prisma.ingredient.update({
            where: { id: recipe.ingredientId },
            data: {
              stock: {
                decrement: totalDeduct,
              },
            },
          });

          // Log stock change
          await prisma.inventoryLog.create({
            data: {
              ingredientId: recipe.ingredientId,
              change: -totalDeduct,
              reason: `Deduction for completed order ${order.orderNumber}`,
              userId: userId || null,
            },
          });
        }
      }

      // Update table status to AVAILABLE when completed
      if (order.tableId) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // Notify customer
    let notifyMessage = '';
    let target = NotificationTarget.CUSTOMER;

    if (status === OrderStatus.READY) {
      notifyMessage = `Pesanan ${order.orderNumber} siap disajikan!`;
    } else if (status === OrderStatus.COMPLETED) {
      notifyMessage = `Pesanan ${order.orderNumber} telah selesai diserahkan.`;
    }

    if (notifyMessage) {
      await prisma.notification.create({
        data: {
          title: 'Update Status Pesanan',
          message: notifyMessage,
          role: target,
          tableNumber: order.tableNumber,
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Update Order Status Error:', error);
    return { success: false, error: error.message };
  }
}

// 5. Refund Transactions
export async function refundOrder(orderId: string, cashierId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new Error('Order not found.');

    // Update order status and payment status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: PayStatus.REFUNDED,
      },
    });

    // Update payment log to REFUNDED
    await prisma.payment.updateMany({
      where: { orderId },
      data: { status: PaymentStatus.REFUNDED },
    });

    // Set table back to available
    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Fetch Orders list for Cashier Dashboard
export async function getCashierOrdersData() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedOrders = orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      tax: Number(o.tax),
      total: Number(o.total),
      items: o.items.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
    }));

    return { success: true, orders: formattedOrders };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
