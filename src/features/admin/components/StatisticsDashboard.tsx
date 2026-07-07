'use client';

import { 
  TrendingUp, ShoppingBag, Users, AlertTriangle, 
  DollarSign, ArrowUpRight, Award, Box, RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface StatisticsDashboardProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    lowStockIngredientsCount: number;
    bestSellers: Array<{ name: string; salesCount: number }>;
    lowStockList: Array<{ id: string; name: string; stock: number; unit: string }>;
    recentTransactions: any[];
  };
}

export default function StatisticsDashboard({ stats }: StatisticsDashboardProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } },
  } as const;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <TrendingUp className="h-6.5 w-6.5 text-primary" /> Admin Statistics Overview
        </h1>
        <p className="text-sm text-muted-foreground">Monitor performance keuangan, tingkat penjualan, dan inventaris bahan.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue */}
        <motion.div variants={itemVariants}>
          <Card className="border-border bg-card shadow-3xs p-4 flex flex-col justify-between h-28 hover:shadow-2xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-extrabold uppercase tracking-wider text-muted-foreground">Revenue</span>
              <div className="bg-emerald-500/10 text-emerald-600 p-2 rounded-xl">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">Rp {stats.totalRevenue.toLocaleString('id-ID')}</h2>
              <p className="text-3xs text-emerald-600 font-semibold mt-0.5">+12.5% dari bulan lalu</p>
            </div>
          </Card>
        </motion.div>

        {/* Card 2: Orders */}
        <motion.div variants={itemVariants}>
          <Card className="border-border bg-card shadow-3xs p-4 flex flex-col justify-between h-28 hover:shadow-2xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-extrabold uppercase tracking-wider text-muted-foreground">Total Orders</span>
              <div className="bg-primary/10 text-primary p-2 rounded-xl">
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">{stats.totalOrders}</h2>
              <p className="text-3xs text-muted-foreground font-semibold mt-0.5">Semua status transaksi</p>
            </div>
          </Card>
        </motion.div>

        {/* Card 3: Customers */}
        <motion.div variants={itemVariants}>
          <Card className="border-border bg-card shadow-3xs p-4 flex flex-col justify-between h-28 hover:shadow-2xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-extrabold uppercase tracking-wider text-muted-foreground">Customers</span>
              <div className="bg-blue-500/10 text-blue-600 p-2 rounded-xl">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">{stats.totalCustomers}</h2>
              <p className="text-3xs text-muted-foreground font-semibold mt-0.5">Pengunjung meja terdaftar</p>
            </div>
          </Card>
        </motion.div>

        {/* Card 4: Low Stock Warnings */}
        <motion.div variants={itemVariants}>
          <Card className="border-border bg-card shadow-3xs p-4 flex flex-col justify-between h-28 hover:shadow-2xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-extrabold uppercase tracking-wider text-muted-foreground">Low Stock Warn</span>
              <div className={`p-2 rounded-xl ${stats.lowStockIngredientsCount > 0 ? 'bg-destructive/10 text-destructive' : 'bg-zinc-100 text-zinc-400'}`}>
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">{stats.lowStockIngredientsCount}</h2>
              <p className="text-3xs text-muted-foreground font-semibold mt-0.5">Bahan di bawah ambang batas</p>
            </div>
          </Card>
        </motion.div>

      </div>

      {/* Grid columns for Best Sellers, Low Stock Warnings, and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Best Sellers (Left 5 Cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
          <Card className="border-border shadow-xs bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-amber-500" /> Menu Terlaris (Top Sellers)
              </CardTitle>
              <CardDescription className="text-3xs">Paling banyak dipesan dan diselesaikan oleh barista.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {stats.bestSellers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Belum ada data penjualan.</p>
              ) : (
                stats.bestSellers.map((item, idx) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold">{item.name}</span>
                      <span className="font-bold text-primary">{item.salesCount} porsi</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (item.salesCount / Math.max(1, stats.bestSellers[0].salesCount)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Low Stock Warning List */}
          <Card className="border-border shadow-xs bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-destructive">
                <Box className="h-4.5 w-4.5" /> Peringatan Inventaris Rendah
              </CardTitle>
              <CardDescription className="text-3xs text-muted-foreground">Persediaan bahan baku kritis di bawah 1.000 unit.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {stats.lowStockList.length === 0 ? (
                <p className="text-xs text-emerald-600 text-center font-bold py-4">Semua bahan baku dalam kondisi aman!</p>
              ) : (
                stats.lowStockList.map((ing) => (
                  <div key={ing.id} className="flex items-center justify-between text-xs p-2 bg-destructive/5 rounded-xl border border-destructive/10">
                    <span className="font-semibold">{ing.name}</span>
                    <Badge variant="destructive" className="text-2xs font-extrabold uppercase">
                      Sisa: {Number(ing.stock).toLocaleString('id-ID')} {ing.unit}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Column 2: Recent Transactions (Right 7 Cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-7">
          <Card className="border-border shadow-xs bg-card h-full flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <ArrowUpRight className="h-4.5 w-4.5 text-primary" /> Transaksi Terbaru
                  </CardTitle>
                  <CardDescription className="text-3xs">Pemasukan kasir dari POS dan pesanan meja online.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10">
                      <TableHead className="text-xs font-bold font-sans">No Struk</TableHead>
                      <TableHead className="text-xs font-bold font-sans">Pelanggan</TableHead>
                      <TableHead className="text-xs font-bold font-sans text-right">Total</TableHead>
                      <TableHead className="text-xs font-bold font-sans text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-2xs">
                          Belum ada transaksi terekam.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stats.recentTransactions.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/10">
                          <TableCell className="font-mono text-3xs font-bold">{order.orderNumber}</TableCell>
                          <TableCell className="text-xs">{order.customerName}</TableCell>
                          <TableCell className="text-xs font-bold text-right">Rp {order.total.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={order.paymentStatus === 'PAID' ? 'secondary' : 'destructive'} className="text-[9px] font-semibold uppercase">
                              {order.paymentStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </div>
            <CardFooter className="py-3 bg-muted/20 border-t border-border/50 justify-center">
              <span className="text-3xs text-muted-foreground font-semibold">Tersinkronisasi Realtime dengan MySQL</span>
            </CardFooter>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
}
