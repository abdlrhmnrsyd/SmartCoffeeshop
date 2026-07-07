'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getCashierOrdersData, processCustomerPayment, updateOrderStatus, getActiveShift } from '../actions/cashierActions';
import { 
  ClipboardList, Check, Clock, ShieldAlert, AlertCircle, 
  DollarSign, Landmark, QrCode, Coffee, Eye, ArrowRight 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function OrdersList() {
  const { data: session } = useSession();
  const cashierId = session?.user?.id;

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeShift, setActiveShift] = useState<any>(null);
  
  // Payment processing state
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [payMethod, setPayMethod] = useState<'CASH' | 'DEBIT' | 'QRIS'>('CASH');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Detail view state
  const [detailedOrder, setDetailedOrder] = useState<any>(null);

  const fetchOrders = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    
    // Check shift
    if (cashierId) {
      const shiftRes = await getActiveShift(cashierId);
      if (shiftRes.success) setActiveShift(shiftRes.shift);
    }

    const res = await getCashierOrdersData();
    if (res.success && res.orders) {
      setOrders(res.orders);
    } else {
      toast.error('Gagal mengambil data pesanan.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders(true);
    // Poll orders every 5 seconds for live status
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [cashierId]);

  const handleAcceptPaidOrder = async (orderId: string) => {
    if (!cashierId || !activeShift) {
      toast.error('Anda harus membuka shift terlebih dahulu.');
      return;
    }
    setIsSubmitting(true);
    const res = await updateOrderStatus(orderId, 'ACCEPTED', cashierId);
    if (res.success) {
      toast.success('Pesanan diterima! Diteruskan ke barista.');
      fetchOrders(false);
    } else {
      toast.error(res.error || 'Gagal menerima pesanan.');
    }
    setIsSubmitting(false);
  };

  const handleOpenPayment = (order: any) => {
    if (!activeShift) {
      toast.error('Buka shift terlebih dahulu di halaman Shift Register.');
      return;
    }
    setSelectedOrder(order);
    setCashAmount('');
    setIsPaymentOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!cashierId || !selectedOrder) return;

    if (payMethod === 'CASH') {
      const parsedAmount = parseFloat(cashAmount);
      if (isNaN(parsedAmount) || parsedAmount < Number(selectedOrder.total)) {
        toast.error('Jumlah tunai pembayaran tidak mencukupi.');
        return;
      }
    }

    setIsSubmitting(true);
    const res = await processCustomerPayment({
      orderId: selectedOrder.id,
      cashierId,
      paymentMethod: payMethod,
      amountPaid: payMethod === 'CASH' ? Number(cashAmount) : Number(selectedOrder.total),
    });

    if (res.success) {
      toast.success('Pembayaran terkonfirmasi! Pesanan diteruskan ke barista.');
      setIsPaymentOpen(false);
      setSelectedOrder(null);
      fetchOrders(false);
    } else {
      toast.error(res.error || 'Gagal memproses pembayaran.');
    }
    setIsSubmitting(false);
  };

  const handleServeOrder = async (orderId: string) => {
    if (!cashierId) return;
    setIsSubmitting(true);
    const res = await updateOrderStatus(orderId, 'COMPLETED', cashierId);
    if (res.success) {
      toast.success('Pesanan telah diserahkan! Stok bahan resep dikurangi.');
      fetchOrders(false);
    } else {
      toast.error(res.error || 'Gagal memperbarui pesanan.');
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <ClipboardList className="h-10 w-10 text-primary animate-pulse mb-3" />
        <p className="text-sm text-muted-foreground font-semibold">Memuat antrian pesanan...</p>
      </div>
    );
  }

  // Filter orders by categories
  const waitingOrders = orders.filter((o) => o.status === 'PENDING_PAYMENT' || o.status === 'WAITING');
  const ongoingOrders = orders.filter((o) => o.status === 'ACCEPTED' || o.status === 'MAKING' || o.status === 'READY');
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'CANCELLED');

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Antrian Pesanan Meja</h1>
        <p className="text-sm text-muted-foreground">Konfirmasi pembayaran, terima pesanan baru, dan serahkan pesanan siap saji.</p>
      </div>

      {!activeShift && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>Laci kasir belum dibuka. Anda harus membuka shift di halaman Shift Register sebelum memproses pembayaran.</span>
        </div>
      )}

      {/* Grid columns for queues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Column 1: Waiting for Confirmation */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-extrabold">{waitingOrders.length}</Badge>
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Menunggu Konfirmasi / Bayar</h3>
          </div>

          {waitingOrders.length === 0 ? (
            <div className="py-8 text-center bg-card border border-dashed border-border rounded-xl text-xs text-muted-foreground">
              Tidak ada pesanan baru yang menunggu.
            </div>
          ) : (
            waitingOrders.map((order) => (
              <Card key={order.id} className="border-border shadow-3xs bg-card">
                <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                  <div>
                    <Badge variant="outline" className="bg-primary/5 text-primary text-[10px] font-bold">
                      Meja {order.tableNumber || 'Take-away'}
                    </Badge>
                    <CardTitle className="text-sm font-bold mt-1.5">{order.customerName}</CardTitle>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{order.orderNumber}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={order.paymentStatus === 'PAID' ? 'secondary' : 'destructive'} className="text-[9px] font-semibold uppercase">
                      {order.paymentStatus}
                    </Badge>
                    <span className="font-black text-xs">Rp {Number(order.total).toLocaleString('id-ID')}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 py-2 text-xs">
                  <div className="text-3xs text-muted-foreground border-b border-border/40 pb-2 mb-2">
                    {order.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
                  </div>
                  {order.notes && <p className="italic text-muted-foreground mt-1">&ldquo;{order.notes}&rdquo;</p>}
                </CardContent>
                <CardFooter className="p-4 pt-2 border-t border-border/30 flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setDetailedOrder(order)} 
                    className="h-8 text-2xs font-semibold"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> Detail
                  </Button>
                  
                  {order.paymentStatus === 'PAID' ? (
                    <Button
                      size="sm"
                      onClick={() => handleAcceptPaidOrder(order.id)}
                      className="h-8 text-2xs font-bold bg-primary text-primary-foreground"
                      disabled={isSubmitting}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Terima Pesanan
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleOpenPayment(order)}
                      className="h-8 text-2xs font-bold bg-[#865d3f] hover:bg-[#6c482f] text-white"
                      disabled={isSubmitting}
                    >
                      <DollarSign className="h-3.5 w-3.5 mr-1" /> Proses Bayar
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Column 2: In-Progress & Ready to Serve */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-extrabold">{ongoingOrders.length}</Badge>
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Sedang Diproses & Siap Saji</h3>
          </div>

          {ongoingOrders.length === 0 ? (
            <div className="py-8 text-center bg-card border border-dashed border-border rounded-xl text-xs text-muted-foreground">
              Tidak ada pesanan aktif saat ini.
            </div>
          ) : (
            ongoingOrders.map((order) => (
              <Card key={order.id} className="border-border shadow-3xs bg-card">
                <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                  <div>
                    <Badge variant="outline" className="bg-primary/5 text-primary text-[10px] font-bold">
                      Meja {order.tableNumber || 'Take-away'}
                    </Badge>
                    <CardTitle className="text-sm font-bold mt-1.5">{order.customerName}</CardTitle>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{order.orderNumber}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={order.status === 'READY' ? 'default' : 'secondary'} className="text-[9px] font-semibold uppercase animate-pulse">
                      {order.status}
                    </Badge>
                    <span className="font-black text-xs">Rp {Number(order.total).toLocaleString('id-ID')}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 py-2 text-xs">
                  <div className="text-3xs text-muted-foreground border-b border-border/40 pb-2 mb-2">
                    {order.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
                  </div>
                  {order.notes && <p className="italic text-muted-foreground mt-1">&ldquo;{order.notes}&rdquo;</p>}
                </CardContent>
                <CardFooter className="p-4 pt-2 border-t border-border/30 flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setDetailedOrder(order)} 
                    className="h-8 text-2xs font-semibold"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> Detail
                  </Button>
                  
                  {order.status === 'READY' && (
                    <Button
                      size="sm"
                      onClick={() => handleServeOrder(order.id)}
                      className="h-8 text-2xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isSubmitting}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Serahkan Pesanan
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>

      </div>

      {/* Payment Processing Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={(open) => !open && setSelectedOrder(null) && setIsPaymentOpen(false)}>
        {selectedOrder && (
          <DialogContent className="max-w-md bg-card text-card-foreground border-border rounded-2xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Proses Pembayaran : {selectedOrder.customerName}</DialogTitle>
              <DialogDescription className="text-3xs">Meja {selectedOrder.tableNumber || 'Take-away'} &bull; {selectedOrder.orderNumber}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={payMethod === 'CASH' ? 'default' : 'outline'}
                  onClick={() => setPayMethod('CASH')}
                  className="flex flex-col items-center justify-center h-16 rounded-xl gap-1"
                >
                  <DollarSign className="h-5 w-5" />
                  <span className="text-[10px] font-bold">TUNAI</span>
                </Button>
                <Button
                  type="button"
                  variant={payMethod === 'DEBIT' ? 'default' : 'outline'}
                  onClick={() => setPayMethod('DEBIT')}
                  className="flex flex-col items-center justify-center h-16 rounded-xl gap-1"
                >
                  <Landmark className="h-5 w-5" />
                  <span className="text-[10px] font-bold">DEBIT / EDC</span>
                </Button>
                <Button
                  type="button"
                  variant={payMethod === 'QRIS' ? 'default' : 'outline'}
                  onClick={() => setPayMethod('QRIS')}
                  className="flex flex-col items-center justify-center h-16 rounded-xl gap-1"
                >
                  <QrCode className="h-5 w-5" />
                  <span className="text-[10px] font-bold">QRIS</span>
                </Button>
              </div>

              <div className="bg-secondary/40 border border-border rounded-xl p-3 text-xs font-semibold space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>Rp {Number(selectedOrder.subtotal).toLocaleString('id-ID')}</span>
                </div>
                {Number(selectedOrder.discount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon:</span>
                    <span>-Rp {Number(selectedOrder.discount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Pajak (10%):</span>
                  <span>Rp {Number(selectedOrder.tax).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1.5 border-t border-border/50 text-primary">
                  <span>TOTAL BILL:</span>
                  <span>Rp {Number(selectedOrder.total).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {payMethod === 'CASH' && (
                <div className="space-y-2 border-t border-border pt-3">
                  <Label htmlFor="cashPaid" className="text-3xs font-extrabold uppercase text-muted-foreground">Jumlah Tunai Diterima</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground font-black text-xs">Rp</span>
                    <Input 
                      id="cashPaid"
                      type="number"
                      placeholder="Masukkan nominal uang tunai"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="pl-10 h-10 bg-background border-border text-xs rounded-xl"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  {Number(cashAmount) >= Number(selectedOrder.total) && (
                    <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-2xs font-bold text-emerald-600">
                      <span>Kembalian:</span>
                      <span className="text-xs font-black">Rp {(Number(cashAmount) - Number(selectedOrder.total)).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={() => setIsPaymentOpen(false)} disabled={isSubmitting} className="h-9 rounded-lg">
                Batal
              </Button>
              <Button onClick={handleProcessPayment} disabled={isSubmitting} className="h-9 bg-primary text-primary-foreground font-bold px-4 rounded-lg flex-1 text-xs">
                {isSubmitting ? 'Memverifikasi...' : 'Konfirmasi Pembayaran'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* View Detailed Items Dialog */}
      <Dialog open={detailedOrder !== null} onOpenChange={(open) => !open && setDetailedOrder(null)}>
        {detailedOrder && (
          <DialogContent className="max-w-md bg-card text-card-foreground border-border rounded-2xl shadow-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="pb-3 border-b border-border">
              <DialogTitle className="text-sm font-bold">Rincian Order: {detailedOrder.orderNumber}</DialogTitle>
              <DialogDescription className="text-3xs">
                Meja {detailedOrder.tableNumber || 'Take-away'} &bull; {detailedOrder.customerName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="space-y-2.5">
                {detailedOrder.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start text-xs border-b border-border/20 pb-2">
                    <div>
                      <h5 className="font-bold">{item.name} <span className="text-muted-foreground text-3xs">x{item.quantity}</span></h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Size: {item.size} | Sugar: {item.sugarLevel} | Ice: {item.iceLevel}</p>
                      {parseToppings(item.toppings).length > 0 && (
                        <p className="text-[9px] text-[#865d3f] font-semibold mt-0.5">
                          Toppings: {parseToppings(item.toppings).map((t: any) => t.name).join(', ')}
                        </p>
                      )}
                      {item.notes && <p className="text-[10px] text-muted-foreground italic mt-0.5">&ldquo;{item.notes}&rdquo;</p>}
                    </div>
                    <span className="font-extrabold">Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-xs font-semibold bg-muted/40 p-3 rounded-xl">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>Rp {Number(detailedOrder.subtotal).toLocaleString('id-ID')}</span>
                </div>
                {Number(detailedOrder.discount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon:</span>
                    <span>-Rp {Number(detailedOrder.discount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Pajak (10%):</span>
                  <span>Rp {Number(detailedOrder.tax).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-border/50 text-primary">
                  <span>TOTAL:</span>
                  <span>Rp {Number(detailedOrder.total).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-border">
              <Button size="sm" onClick={() => setDetailedOrder(null)} className="h-9 rounded-lg px-4 w-full">
                Tutup Rincian
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
