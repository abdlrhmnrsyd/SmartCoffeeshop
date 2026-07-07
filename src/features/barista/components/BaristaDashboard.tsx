'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getCashierOrdersData, updateOrderStatus } from '@/features/cashier/actions/cashierActions';
import { Coffee, ClipboardList, Check, Play, CheckSquare, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const parseToppings = (toppings: any): any[] => {
  if (!toppings) return [];
  try {
    const parsed = typeof toppings === 'string' ? JSON.parse(toppings) : toppings;
    const arrayParsed = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    return Array.isArray(arrayParsed) ? arrayParsed : [];
  } catch {
    return [];
  }
};

export default function BaristaDashboard() {
  const { data: session } = useSession();
  const baristaId = session?.user?.id;

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchOrders = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    const res = await getCashierOrdersData();
    if (res.success && res.orders) {
      // Filter only active orders in queue for Barista (ACCEPTED, MAKING, READY)
      const baristaQueue = res.orders.filter(
        (o) => o.status === 'ACCEPTED' || o.status === 'MAKING' || o.status === 'READY'
      );
      setOrders(baristaQueue);
    } else {
      toast.error('Gagal mengambil antrian barista.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders(true);
    // Poll orders database every 5 seconds for live status changes
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, status: 'MAKING' | 'READY' | 'COMPLETED') => {
    setIsUpdating(true);
    const res = await updateOrderStatus(orderId, status, baristaId);
    if (res.success) {
      let msg = '';
      if (status === 'MAKING') msg = 'Pesanan mulai dikerjakan!';
      if (status === 'READY') msg = 'Pesanan selesai dibuat dan siap disajikan!';
      if (status === 'COMPLETED') msg = 'Pesanan ditandai selesai diserahkan.';
      toast.success(msg);
      fetchOrders(false);
    } else {
      toast.error(res.error || 'Gagal memperbarui status pesanan.');
    }
    setIsUpdating(false);
  };

  // Helper to calculate elapsed time in minutes
  const getElapsedTime = (createdAt: Date) => {
    const elapsedMs = Date.now() - new Date(createdAt).getTime();
    const elapsedMins = Math.floor(elapsedMs / 1000 / 60);
    if (elapsedMins < 1) return 'Baru saja';
    return `${elapsedMins} menit lalu`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Coffee className="h-10 w-10 text-primary animate-bounce mb-3" />
        <p className="text-sm text-muted-foreground font-semibold">Memuat order barista...</p>
      </div>
    );
  }

  // Segment orders by status
  const queueOrders = orders.filter((o) => o.status === 'ACCEPTED');
  const makingOrders = orders.filter((o) => o.status === 'MAKING');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="h-6.5 w-6.5 text-primary" /> Barista Drink Station
          </h1>
          <p className="text-sm text-muted-foreground">Monitor daftar antrian minuman dan perbarui status pembuatan.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchOrders(true)} className="h-9 border-border bg-card">
          <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh Manual
        </Button>
      </div>

      {/* Primary Dashboard Columns Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Queue (ACCEPTED) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Badge variant="secondary" className="font-extrabold">{queueOrders.length}</Badge>
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Antrian (Queue)</h3>
          </div>

          {queueOrders.length === 0 ? (
            <div className="py-10 text-center bg-card border border-dashed border-border rounded-xl text-2xs text-muted-foreground">
              Tidak ada antrian minuman.
            </div>
          ) : (
            queueOrders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-amber-500 border-border bg-card shadow-3xs">
                <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-xs">Meja {order.tableNumber || 'Take-away'}</h4>
                    <p className="text-[9px] text-muted-foreground">{order.orderNumber}</p>
                  </div>
                  <Badge variant="outline" className="text-[8px] flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{getElapsedTime(order.createdAt)}</span>
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 py-2 space-y-2.5">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="text-xs bg-muted/30 p-2 rounded-lg">
                      <h5 className="font-bold">{item.name} <span className="text-muted-foreground text-3xs">x{item.quantity}</span></h5>
                      <p className="text-[10px] text-[#865d3f] font-semibold mt-0.5">Size: {item.size} | Sugar: {item.sugarLevel} | Ice: {item.iceLevel}</p>
                      {parseToppings(item.toppings).length > 0 && (
                        <p className="text-[9px] text-emerald-600 font-bold mt-0.5">
                          +Topping: {parseToppings(item.toppings).map((t: any) => t.name).join(', ')}
                        </p>
                      )}
                      {item.notes && <p className="text-[10px] text-muted-foreground italic mt-1 font-medium bg-background p-1 border border-border rounded-md">&ldquo;{item.notes}&rdquo;</p>}
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="p-4 pt-2 border-t border-border/30">
                  <Button
                    onClick={() => handleUpdateStatus(order.id, 'MAKING')}
                    className="w-full bg-[#865d3f] hover:bg-[#6c482f] text-white text-2xs font-bold h-8 rounded-lg"
                    disabled={isUpdating}
                  >
                    <Play className="h-3.5 w-3.5 mr-1" /> Mulai Buat
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Column 2: In-Progress (MAKING) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Badge variant="default" className="font-extrabold bg-[#865d3f]">{makingOrders.length}</Badge>
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Sedang Dibuat (Brewing)</h3>
          </div>

          {makingOrders.length === 0 ? (
            <div className="py-10 text-center bg-card border border-dashed border-border rounded-xl text-2xs text-muted-foreground">
              Tidak ada minuman sedang dibuat.
            </div>
          ) : (
            makingOrders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-blue-500 border-border bg-card shadow-3xs">
                <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-xs">Meja {order.tableNumber || 'Take-away'}</h4>
                    <p className="text-[9px] text-muted-foreground">{order.orderNumber}</p>
                  </div>
                  <Badge variant="outline" className="text-[8px] flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />
                    <span>{getElapsedTime(order.createdAt)}</span>
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 py-2 space-y-2.5">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="text-xs bg-muted/30 p-2 rounded-lg">
                      <h5 className="font-bold">{item.name} <span className="text-muted-foreground text-3xs">x{item.quantity}</span></h5>
                      <p className="text-[10px] text-[#865d3f] font-semibold mt-0.5">Size: {item.size} | Sugar: {item.sugarLevel} | Ice: {item.iceLevel}</p>
                      {parseToppings(item.toppings).length > 0 && (
                        <p className="text-[9px] text-emerald-600 font-bold mt-0.5">
                          +Topping: {parseToppings(item.toppings).map((t: any) => t.name).join(', ')}
                        </p>
                      )}
                      {item.notes && <p className="text-[10px] text-muted-foreground italic mt-1 font-medium bg-background p-1 border border-border rounded-md">&ldquo;{item.notes}&rdquo;</p>}
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="p-4 pt-2 border-t border-border/30">
                  <Button
                    onClick={() => handleUpdateStatus(order.id, 'READY')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-2xs font-bold h-8 rounded-lg"
                    disabled={isUpdating}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Siap Saji
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Column 3: Served / Ready (READY) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Badge variant="outline" className="font-extrabold border-emerald-500 text-emerald-600">{readyOrders.length}</Badge>
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Siap Diambil (Ready)</h3>
          </div>

          {readyOrders.length === 0 ? (
            <div className="py-10 text-center bg-card border border-dashed border-border rounded-xl text-2xs text-muted-foreground">
              Tidak ada pesanan siap saji.
            </div>
          ) : (
            readyOrders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-emerald-500 border-border bg-card shadow-3xs">
                <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-xs">Meja {order.tableNumber || 'Take-away'}</h4>
                    <p className="text-[9px] text-muted-foreground">{order.orderNumber}</p>
                  </div>
                  <Badge variant="outline" className="text-[8px] flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{getElapsedTime(order.createdAt)}</span>
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 py-2 space-y-2.5">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="text-xs bg-muted/30 p-2 rounded-lg">
                      <h5 className="font-bold">{item.name} <span className="text-muted-foreground text-3xs">x{item.quantity}</span></h5>
                      <p className="text-[10px] text-[#865d3f] font-semibold mt-0.5">Size: {item.size} | Sugar: {item.sugarLevel} | Ice: {item.iceLevel}</p>
                      {item.notes && <p className="text-[10px] text-muted-foreground italic mt-1 font-medium bg-background p-1 border border-border rounded-md">&ldquo;{item.notes}&rdquo;</p>}
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="p-4 pt-2 border-t border-border/30">
                  <Button
                    onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                    className="w-full bg-zinc-800 hover:bg-zinc-950 text-white text-2xs font-bold h-8 rounded-lg"
                    disabled={isUpdating}
                  >
                    <CheckSquare className="h-3.5 w-3.5 mr-1" /> Serahkan &amp; Selesai
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
