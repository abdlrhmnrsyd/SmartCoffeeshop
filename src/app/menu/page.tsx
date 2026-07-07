import { getMenuData } from '@/features/customer/actions/menuActions';
import MenuBrowser from '@/features/customer/components/MenuBrowser';

interface Props {
  searchParams: Promise<{ table?: string }>;
}

export default async function MenuPage({ searchParams }: Props) {
  const params = await searchParams;
  const tableNo = params.table ? parseInt(params.table, 10) : 1;
  
  const menuResult = await getMenuData();
  
  const categories = menuResult.success && menuResult.categories ? menuResult.categories : [];
  const products = menuResult.success && menuResult.products ? menuResult.products : [];
  const toppings = menuResult.success && menuResult.toppings ? menuResult.toppings : [];

  return (
    <MenuBrowser 
      initialData={{ categories, products, toppings }} 
      tableNo={tableNo} 
    />
  );
}
