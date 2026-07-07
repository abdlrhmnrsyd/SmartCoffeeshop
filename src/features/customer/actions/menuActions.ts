'use server';

import { prisma } from '@/lib/db';

export async function getMenuData() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      include: {
        options: true,
      },
      orderBy: { name: 'asc' },
    });

    const toppings = await prisma.topping.findMany({
      where: { isAvailable: true },
      orderBy: { name: 'asc' },
    });

    // Transform products to group their options by option name (e.g. Size, Sugar)
    const formattedProducts = products.map((product) => {
      const formattedOptions = product.options.map((opt) => ({
        ...opt,
        priceAdjustment: Number(opt.priceAdjustment),
      }));

      const groupedOptions: Record<string, typeof formattedOptions> = {};
      
      formattedOptions.forEach((opt) => {
        if (!groupedOptions[opt.name]) {
          groupedOptions[opt.name] = [];
        }
        groupedOptions[opt.name].push(opt);
      });

      return {
        ...product,
        price: Number(product.price),
        options: formattedOptions,
        groupedOptions,
      };
    });

    const formattedToppings = toppings.map((t) => ({
      ...t,
      price: Number(t.price),
    }));

    return {
      success: true,
      categories,
      products: formattedProducts,
      toppings: formattedToppings,
    };
  } catch (error: any) {
    console.error('Fetch Menu Error:', error);
    return { success: false, error: error.message };
  }
}
