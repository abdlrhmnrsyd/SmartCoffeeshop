import { PrismaClient, TableStatus, ShiftStatus, OrderStatus, PayStatus, PayMethod, VoucherType, NotificationTarget } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcryptjs';

const rawUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/smart_coffee_shop";
const connectionString = rawUrl.replace(/^mysql:/, 'mariadb:');

const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing database...');
  
  // Delete in dependency order
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  console.log('Seeding database...');

  // 1. Roles
  const adminRole = await prisma.role.create({
    data: { name: 'ADMIN', description: 'System Administrator' },
  });
  const cashierRole = await prisma.role.create({
    data: { name: 'CASHIER', description: 'Cashier / POS Operator' },
  });
  const baristaRole = await prisma.role.create({
    data: { name: 'BARISTA', description: 'Barista / Beverage Maker' },
  });
  const customerRole = await prisma.role.create({
    data: { name: 'CUSTOMER', description: 'Customer' },
  });

  // 2. Users
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('password123', salt);
  const adminPassword = bcrypt.hashSync('admin123', salt);
  const cashierPassword = bcrypt.hashSync('kasir123', salt);
  const baristaPassword = bcrypt.hashSync('barista123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      username: 'admin',
      email: 'admin@coffeeshop.com',
      password: adminPassword,
      roleId: adminRole.id,
    },
  });

  const cashier = await prisma.user.create({
    data: {
      name: 'Sarah Kasir',
      username: 'kasir',
      email: 'cashier@coffeeshop.com',
      password: cashierPassword,
      roleId: cashierRole.id,
    },
  });

  const barista = await prisma.user.create({
    data: {
      name: 'Alex Barista',
      username: 'barista',
      email: 'barista@coffeeshop.com',
      password: baristaPassword,
      roleId: baristaRole.id,
    },
  });

  console.log('Seeded users and roles.');

  // 3. Tables
  for (let i = 1; i <= 10; i++) {
    await prisma.table.create({
      data: {
        number: i,
        capacity: i % 2 === 0 ? 4 : 2,
        status: TableStatus.AVAILABLE,
        qrCodeUrl: `/menu?table=${i}`,
      },
    });
  }
  console.log('Seeded tables 1 to 10.');

  // 4. Categories
  const catCoffee = await prisma.category.create({
    data: { name: 'Coffee', slug: 'coffee' },
  });
  const catNonCoffee = await prisma.category.create({
    data: { name: 'Non-Coffee', slug: 'non-coffee' },
  });
  const catPastries = await prisma.category.create({
    data: { name: 'Pastries', slug: 'pastries' },
  });
  const catTea = await prisma.category.create({
    data: { name: 'Tea', slug: 'tea' },
  });

  // 5. Toppings
  const toppingEspresso = await prisma.topping.create({
    data: { name: 'Extra Shot Espresso', price: 5000, stock: 100 },
  });
  const toppingOat = await prisma.topping.create({
    data: { name: 'Oat Milk Sub', price: 7000, stock: 80 },
  });
  const toppingJelly = await prisma.topping.create({
    data: { name: 'Grass Jelly', price: 4000, stock: 50 },
  });
  const toppingBobba = await prisma.topping.create({
    data: { name: 'Bobba Pearl', price: 5000, stock: 60 },
  });

  // 6. Ingredients
  const ingCoffee = await prisma.ingredient.create({
    data: { name: 'Coffee Beans', stock: 5000, unit: 'g' }, // 5kg
  });
  const ingMilk = await prisma.ingredient.create({
    data: { name: 'Fresh Milk', stock: 10000, unit: 'ml' }, // 10L
  });
  const ingSugar = await prisma.ingredient.create({
    data: { name: 'Sugar Syrup', stock: 2000, unit: 'ml' }, // 2L
  });
  const ingChocolate = await prisma.ingredient.create({
    data: { name: 'Chocolate Powder', stock: 1000, unit: 'g' }, // 1kg
  });
  const ingMatcha = await prisma.ingredient.create({
    data: { name: 'Matcha Powder', stock: 500, unit: 'g' }, // 500g
  });
  const ingOat = await prisma.ingredient.create({
    data: { name: 'Oat Milk', stock: 5000, unit: 'ml' }, // 5L
  });
  const ingCaramel = await prisma.ingredient.create({
    data: { name: 'Caramel Syrup', stock: 1000, unit: 'ml' }, // 1L
  });

  console.log('Seeded ingredients.');

  // Create initial log
  const ingredientsList = [ingCoffee, ingMilk, ingSugar, ingChocolate, ingMatcha, ingOat, ingCaramel];
  for (const ing of ingredientsList) {
    await prisma.inventoryLog.create({
      data: {
        ingredientId: ing.id,
        change: ing.stock,
        reason: 'Initial stock intake',
        userId: admin.id,
      },
    });
  }

  // 7. Products
  // Espresso
  const prodEspresso = await prisma.product.create({
    data: {
      name: 'Espresso',
      description: 'Rich, concentrated shot of espresso.',
      price: 15000,
      categoryId: catCoffee.id,
      photo: 'https://images.unsplash.com/photo-1510707577719-5d687b89de89?w=500&auto=format&fit=crop&q=60',
      stock: 999,
    },
  });
  // Cafe Latte
  const prodLatte = await prisma.product.create({
    data: {
      name: 'Cafe Latte',
      description: 'Double espresso with steamed milk and a thin layer of foam.',
      price: 25000,
      categoryId: catCoffee.id,
      photo: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60',
      stock: 999,
    },
  });
  // Cappuccino
  const prodCappuccino = await prisma.product.create({
    data: {
      name: 'Cappuccino',
      description: 'Espresso topped with equal parts steamed milk and milk foam.',
      price: 25000,
      categoryId: catCoffee.id,
      photo: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60',
      stock: 999,
    },
  });
  // Caramel Macchiato
  const prodCaramel = await prisma.product.create({
    data: {
      name: 'Caramel Macchiato',
      description: 'Espresso with vanilla syrup, steamed milk, and a caramel drizzle.',
      price: 28000,
      categoryId: catCoffee.id,
      photo: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500&auto=format&fit=crop&q=60',
      stock: 999,
    },
  });
  // Matcha Latte
  const prodMatcha = await prisma.product.create({
    data: {
      name: 'Matcha Latte',
      description: 'Creamy milk paired with premium Japanese green tea matcha powder.',
      price: 26000,
      categoryId: catNonCoffee.id,
      photo: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60',
      stock: 999,
    },
  });
  // Chocolate Latte
  const prodChocolate = await prisma.product.create({
    data: {
      name: 'Chocolate Latte',
      description: 'Decadent chocolate combined with steamed milk and sugar.',
      price: 24000,
      categoryId: catNonCoffee.id,
      photo: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=60',
      stock: 999,
    },
  });
  // Croissant
  const prodCroissant = await prisma.product.create({
    data: {
      name: 'Butter Croissant',
      description: 'Flaky, buttery, and freshly baked french pastry.',
      price: 18000,
      categoryId: catPastries.id,
      photo: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60',
      stock: 25,
    },
  });
  // Green Tea
  const prodGreenTea = await prisma.product.create({
    data: {
      name: 'Jasmine Green Tea',
      description: 'Light, fragrant green tea infused with jasmine blossoms.',
      price: 16000,
      categoryId: catTea.id,
      photo: 'https://images.unsplash.com/photo-1627435601357-3f6c7c371f4b?w=500&auto=format&fit=crop&q=60',
      stock: 999,
    },
  });

  console.log('Seeded products.');

  // 8. Recipes
  // Espresso Recipe: 18g coffee
  await prisma.recipe.create({
    data: { productId: prodEspresso.id, ingredientId: ingCoffee.id, quantity: 18 },
  });
  // Latte Recipe: 18g coffee, 200ml milk, 15ml sugar
  await prisma.recipe.create({
    data: { productId: prodLatte.id, ingredientId: ingCoffee.id, quantity: 18 },
  });
  await prisma.recipe.create({
    data: { productId: prodLatte.id, ingredientId: ingMilk.id, quantity: 200 },
  });
  await prisma.recipe.create({
    data: { productId: prodLatte.id, ingredientId: ingSugar.id, quantity: 15 },
  });
  // Cappuccino Recipe: 18g coffee, 150ml milk
  await prisma.recipe.create({
    data: { productId: prodCappuccino.id, ingredientId: ingCoffee.id, quantity: 18 },
  });
  await prisma.recipe.create({
    data: { productId: prodCappuccino.id, ingredientId: ingMilk.id, quantity: 150 },
  });
  // Caramel Macchiato: 18g coffee, 180ml milk, 15ml caramel
  await prisma.recipe.create({
    data: { productId: prodCaramel.id, ingredientId: ingCoffee.id, quantity: 18 },
  });
  await prisma.recipe.create({
    data: { productId: prodCaramel.id, ingredientId: ingMilk.id, quantity: 180 },
  });
  await prisma.recipe.create({
    data: { productId: prodCaramel.id, ingredientId: ingCaramel.id, quantity: 15 },
  });
  // Matcha Latte Recipe: 10g matcha, 200ml milk, 20ml sugar
  await prisma.recipe.create({
    data: { productId: prodMatcha.id, ingredientId: ingMatcha.id, quantity: 10 },
  });
  await prisma.recipe.create({
    data: { productId: prodMatcha.id, ingredientId: ingMilk.id, quantity: 200 },
  });
  await prisma.recipe.create({
    data: { productId: prodMatcha.id, ingredientId: ingSugar.id, quantity: 20 },
  });
  // Chocolate Latte Recipe: 15g chocolate, 200ml milk, 15ml sugar
  await prisma.recipe.create({
    data: { productId: prodChocolate.id, ingredientId: ingChocolate.id, quantity: 15 },
  });
  await prisma.recipe.create({
    data: { productId: prodChocolate.id, ingredientId: ingMilk.id, quantity: 200 },
  });
  await prisma.recipe.create({
    data: { productId: prodChocolate.id, ingredientId: ingSugar.id, quantity: 15 },
  });

  console.log('Seeded recipes.');

  // 9. Options
  const productsWithOptions = [prodLatte, prodCappuccino, prodCaramel, prodMatcha, prodChocolate, prodGreenTea];
  for (const prod of productsWithOptions) {
    // Sizes
    await prisma.productOption.create({
      data: { productId: prod.id, name: 'Size', value: 'Regular', priceAdjustment: 0 },
    });
    await prisma.productOption.create({
      data: { productId: prod.id, name: 'Size', value: 'Large', priceAdjustment: 5000 },
    });
    // Sugar
    await prisma.productOption.create({
      data: { productId: prod.id, name: 'Sugar', value: 'Normal', priceAdjustment: 0 },
    });
    await prisma.productOption.create({
      data: { productId: prod.id, name: 'Sugar', value: 'Less Sugar', priceAdjustment: 0 },
    });
    await prisma.productOption.create({
      data: { productId: prod.id, name: 'Sugar', value: 'No Sugar', priceAdjustment: 0 },
    });
    // Ice
    await prisma.productOption.create({
      data: { productId: prod.id, name: 'Ice', value: 'Normal Ice', priceAdjustment: 0 },
    });
    await prisma.productOption.create({
      data: { productId: prod.id, name: 'Ice', value: 'Less Ice', priceAdjustment: 0 },
    });
    await prisma.productOption.create({
      data: { productId: prod.id, name: 'Ice', value: 'No Ice', priceAdjustment: 0 },
    });
  }

  console.log('Seeded product options.');

  // 10. Vouchers
  await prisma.voucher.create({
    data: {
      code: 'COFFEE10',
      discountType: VoucherType.PERCENTAGE,
      discountValue: 10,
      maxDiscount: 10000,
      minOrderAmount: 20000,
      expiryDate: new Date('2027-12-31'),
    },
  });
  await prisma.voucher.create({
    data: {
      code: 'WELCOME5K',
      discountType: VoucherType.FIXED,
      discountValue: 5000,
      minOrderAmount: 15000,
      expiryDate: new Date('2027-12-31'),
    },
  });

  // 11. Promotions
  await prisma.promotion.create({
    data: {
      title: 'Espresso Morning Rush!',
      description: 'Get an extra shot espresso for half price before 10 AM.',
      discountValue: 2500,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    },
  });
  await prisma.promotion.create({
    data: {
      title: 'Matcha Weekend Special',
      description: 'Enjoy 15% discount on Matcha products every Saturday and Sunday.',
      discountValue: 15,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    },
  });

  // 12. Dummy Shifts and Transactions
  const closedShift = await prisma.shift.create({
    data: {
      cashierId: cashier.id,
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h ago
      endTime: new Date(Date.now() - 16 * 60 * 60 * 1000), // 16h ago
      startCash: 500000,
      endCash: 750000,
      actualCash: 750000,
      status: ShiftStatus.CLOSED,
      notes: 'Clean shift, cash matched perfectly',
    },
  });

  // Current active shift
  await prisma.shift.create({
    data: {
      cashierId: cashier.id,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
      startCash: 500000,
      status: ShiftStatus.OPEN,
    },
  });

  // Sample Past Completed Order (to populate analytics)
  const orderPast = await prisma.order.create({
    data: {
      orderNumber: 'CS-20260706-0001',
      tableNumber: 3,
      customerName: 'Budi',
      status: OrderStatus.COMPLETED,
      subtotal: 50000, // 2 Lattes (50k)
      discount: 5000, // WELCOME5K
      tax: 4500, // 10%
      total: 49500,
      paymentStatus: PayStatus.PAID,
      paymentMethod: PayMethod.QRIS,
      cashierId: cashier.id,
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: prodLatte.id,
            name: 'Cafe Latte',
            price: 25000,
            quantity: 2,
            size: 'Regular',
            sugarLevel: 'Normal',
            iceLevel: 'Normal Ice',
            toppings: JSON.stringify([]),
          }
        ]
      }
    }
  });

  await prisma.payment.create({
    data: {
      orderId: orderPast.id,
      amount: 49500,
      paymentType: PayMethod.QRIS,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    }
  });

  await prisma.review.create({
    data: {
      orderId: orderPast.id,
      rating: 5,
      comment: 'Latténya enak sekali, kopinya berasa premium!',
    }
  });

  // Another past completed order
  const orderPast2 = await prisma.order.create({
    data: {
      orderNumber: 'CS-20260706-0002',
      tableNumber: 1,
      customerName: 'Ani',
      status: OrderStatus.COMPLETED,
      subtotal: 33000, // 1 Green tea (16k) + 1 Croissant (17k adjusted)
      discount: 0,
      tax: 3300,
      total: 36300,
      paymentStatus: PayStatus.PAID,
      paymentMethod: PayMethod.CASH,
      cashierId: cashier.id,
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: prodGreenTea.id,
            name: 'Jasmine Green Tea',
            price: 16000,
            quantity: 1,
            size: 'Regular',
            sugarLevel: 'Less Sugar',
            iceLevel: 'Normal Ice',
          },
          {
            productId: prodCroissant.id,
            name: 'Butter Croissant',
            price: 18000,
            quantity: 1,
          }
        ]
      }
    }
  });

  await prisma.payment.create({
    data: {
      orderId: orderPast2.id,
      amount: 36300,
      paymentType: PayMethod.CASH,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    }
  });

  // Active Pending Order
  const orderActive = await prisma.order.create({
    data: {
      orderNumber: 'CS-20260707-0001',
      tableNumber: 5,
      customerName: 'Joni',
      status: OrderStatus.WAITING,
      subtotal: 35000, // Caramel Macchiato Large (28k + 5k) + bobba (5k)? wait total price
      discount: 0,
      tax: 3500,
      total: 38500,
      paymentStatus: PayStatus.PAID,
      paymentMethod: PayMethod.QRIS,
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
      items: {
        create: [
          {
            productId: prodCaramel.id,
            name: 'Caramel Macchiato',
            price: 28000,
            quantity: 1,
            size: 'Large', // +5k
            sugarLevel: 'Less Sugar',
            iceLevel: 'Normal Ice',
            toppings: JSON.stringify([{ name: 'Bobba Pearl', price: 5000 }]),
          }
        ]
      }
    }
  });

  await prisma.payment.create({
    data: {
      orderId: orderActive.id,
      amount: 38500,
      paymentType: PayMethod.QRIS,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    }
  });

  // Notifications
  await prisma.notification.create({
    data: {
      title: 'Order Baru Masuk',
      message: 'Meja 5 memesan 1x Caramel Macchiato.',
      role: NotificationTarget.CASHIER,
      tableNumber: 5,
    }
  });

  console.log('Seeded sample active transactions.');
  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
