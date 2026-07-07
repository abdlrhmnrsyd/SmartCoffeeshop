'use server';

import { prisma } from '@/lib/db';
import { TableStatus, VoucherType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// 1. Analytics & Statistics
export async function getAdminStats() {
  try {
    // Total Revenue from completed or paid orders
    const paymentsSum = await prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
        status: { not: 'CANCELLED' },
      },
      _sum: {
        total: true,
      },
    });
    const totalRevenue = Number(paymentsSum._sum.total || 0);

    // Total Orders Count
    const totalOrders = await prisma.order.count();

    // Total Unique Customers (based on distinct customer names)
    const customersCount = await prisma.order.groupBy({
      by: ['customerName'],
      where: { customerName: { not: null } },
    });
    const totalCustomers = customersCount.length;

    // Bestselling Products
    const itemsGroup = await prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      where: {
        order: {
          status: 'COMPLETED',
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });
    const bestSellers = itemsGroup.map((item) => ({
      name: item.name,
      salesCount: item._sum.quantity || 0,
    }));

    // Low Stock Ingredients (threshold e.g. < 1000g or 1000ml)
    const lowStockIngredients = await prisma.ingredient.findMany({
      where: {
        stock: {
          lt: 1000, // less than 1L / 1kg
        },
      },
    });

    // Recent Transactions
    const recentTransactions = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        bestSellers,
        lowStockIngredientsCount: lowStockIngredients.length,
        lowStockList: lowStockIngredients.map((ing) => ({
          ...ing,
          stock: Number(ing.stock),
        })),
        recentTransactions: recentTransactions.map((o) => ({
          ...o,
          subtotal: Number(o.subtotal),
          discount: Number(o.discount),
          tax: Number(o.tax),
          total: Number(o.total),
        })),
      },
    };
  } catch (error: any) {
    console.error('Fetch Stats Error:', error);
    return { success: false, error: error.message };
  }
}

// 2. CRUD: Categories
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return { success: true, categories };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCategory(name: string) {
  try {
    const slug = name.toLowerCase().replace(/ /g, '-');
    const category = await prisma.category.create({
      data: { name, slug },
    });
    return { success: true, category };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. CRUD: Tables
export async function getTables() {
  try {
    const tables = await prisma.table.findMany({ orderBy: { number: 'asc' } });
    return { success: true, tables };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTable(number: number, capacity: number) {
  try {
    const table = await prisma.table.create({
      data: {
        number,
        capacity,
        status: TableStatus.AVAILABLE,
        qrCodeUrl: `/menu?table=${number}`,
      },
    });
    return { success: true, table };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTable(id: string) {
  try {
    await prisma.table.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. CRUD: Vouchers
export async function getVouchers() {
  try {
    const vouchers = await prisma.voucher.findMany({ orderBy: { createdAt: 'desc' } });
    const formattedVouchers = vouchers.map((v) => ({
      ...v,
      discountValue: Number(v.discountValue),
      minOrderAmount: Number(v.minOrderAmount),
      maxDiscount: v.maxDiscount ? Number(v.maxDiscount) : null,
    }));
    return { success: true, vouchers: formattedVouchers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createVoucher(data: {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount: number;
  expiryDate: Date;
}) {
  try {
    const voucher = await prisma.voucher.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType as any,
        discountValue: data.discountValue,
        maxDiscount: data.maxDiscount || null,
        minOrderAmount: data.minOrderAmount,
        expiryDate: new Date(data.expiryDate),
      },
    });
    const formattedVoucher = {
      ...voucher,
      discountValue: Number(voucher.discountValue),
      minOrderAmount: Number(voucher.minOrderAmount),
      maxDiscount: voucher.maxDiscount ? Number(voucher.maxDiscount) : null,
    };
    return { success: true, voucher: formattedVoucher };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteVoucher(id: string) {
  try {
    await prisma.voucher.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. CRUD: Users
export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { name: 'asc' },
    });
    const roles = await prisma.role.findMany();
    return { success: true, users, roles };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createUser(data: any) {
  try {
    const salt = bcryptHashSync(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email || null,
        password: salt,
        roleId: data.roleId,
      },
    });
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import * as bcrypt from 'bcryptjs';
function bcryptHashSync(password: string) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Reports & Financials
export async function getSalesReport(startDate?: Date, endDate?: Date) {
  try {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        paymentStatus: 'PAID',
      },
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

    return { success: true, report: formattedOrders };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
