import { getAdminStats } from '@/features/admin/actions/adminActions';
import StatisticsDashboard from '@/features/admin/components/StatisticsDashboard';

export default async function AdminDashboardPage() {
  const result = await getAdminStats();
  
  const stats = result.success && result.stats ? result.stats : {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    lowStockIngredientsCount: 0,
    bestSellers: [],
    lowStockList: [],
    recentTransactions: [],
  };

  return <StatisticsDashboard stats={stats} />;
}
