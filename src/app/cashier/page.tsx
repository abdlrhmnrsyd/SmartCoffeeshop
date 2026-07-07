import { auth } from '@/auth';
import { getActiveShift } from '@/features/cashier/actions/cashierActions';
import { getMenuData } from '@/features/customer/actions/menuActions';
import PosConsole from '@/features/cashier/components/PosConsole';
import { prisma } from '@/lib/db';

export default async function CashierPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch active shift
  const shiftResult = userId ? await getActiveShift(userId) : { success: false, shift: null };
  const activeShift = shiftResult.success ? shiftResult.shift : null;

  // Fetch products, categories, toppings
  const menuData = await getMenuData();
  
  // Fetch active vouchers
  const vouchers = await prisma.voucher.findMany({
    where: { isActive: true },
  });

  const formattedVouchers = vouchers.map((v) => ({
    ...v,
    discountValue: Number(v.discountValue),
    minOrderAmount: Number(v.minOrderAmount),
    maxDiscount: v.maxDiscount ? Number(v.maxDiscount) : null,
  }));

  const initialData = {
    categories: menuData.success && menuData.categories ? menuData.categories : [],
    products: menuData.success && menuData.products ? menuData.products : [],
    toppings: menuData.success && menuData.toppings ? menuData.toppings : [],
    vouchers: formattedVouchers,
  };

  return (
    <PosConsole 
      initialData={initialData} 
      activeShift={activeShift} 
    />
  );
}
