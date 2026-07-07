'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getOrderDetails, requestBill, callWaiter, submitOrderReview } from '../actions/customerActions';
import { 
  Coffee, ArrowLeft, RefreshCw, Bell, Receipt, 
  CheckCircle2, Clock, Check, Star, MessageSquare, Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function OrderStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [requestingBillLoading, setRequestingBillLoading] = useState<boolean>(false);
  const [callingWaiterLoading, setCallingWaiterLoading] = useState<boolean>(false);

  // Review State
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const fetchOrder = async (showLoader = false) => {
    if (!orderId) return;
    if (showLoader) setLoading(true);
    const res = await getOrderDetails(orderId);
    if (res.success && res.order) {
      setOrder(res.order);
      if (res.order.reviews && res.order.reviews.length > 0) {
        setReviewSubmitted(true);
      }
    } else {
      toast.error('Gagal mengambil detail pesanan.');
    }
    setLoading(false);
  };

  // Poll order status every 5 seconds
  useEffect(() => {
    fetchOrder(true);
    const interval = setInterval(() => {
      fetchOrder(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleCallWaiter = async () => {
    if (!order?.tableNumber) return;
    setCallingWaiterLoading(true);
    const res = await callWaiter(order.tableNumber);
    if (res.success) {
      toast.success('Panggilan terkirim. Pelayan segera datang.');
    } else {
      toast.error('Gagal memanggil pelayan.');
    }
    setCallingWaiterLoading(false);
  };

  const handleRequestBill = async () => {
    if (!orderId) return;
    setRequestingBillLoading(true);
    const res = await requestBill(orderId);
    if (res.success) {
      toast.success('Permintaan tagihan terkirim. Mohon tunggu kasir.');
    } else {
      toast.error('Gagal mengirim permintaan tagihan.');
    }
    setRequestingBillLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!orderId) return;
    setSubmittingReview(true);
    const res = await submitOrderReview(orderId, rating, reviewComment);
    if (res.success) {
      toast.success('Terima kasih atas ulasan Anda!');
      setReviewSubmitted(true);
    } else {
      toast.error('Gagal mengirim ulasan.');
    }
    setSubmittingReview(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Coffee className="h-10 w-10 text-primary animate-bounce mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Memuat status pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <h3 className="font-bold text-lg mb-2">Pesanan Tidak Ditemukan</h3>
        <p className="text-sm text-muted-foreground mb-6">Pastikan tautan atau scan QR Anda sudah benar.</p>
        <Button onClick={() => router.push('/menu')} variant="default">
          Kembali ke Menu
        </Button>
      </div>
    );
  }

  const getStatusStep = (status: string) => {
    const steps = ['PENDING_PAYMENT', 'WAITING', 'ACCEPTED', 'MAKING', 'READY', 'COMPLETED'];
    return steps.indexOf(status);
  };

  const getStatusText = (status: string, payStatus: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'Menunggu Pembayaran';
      case 'WAITING':
        return payStatus === 'PAID' ? 'Mengantri Konfirmasi' : 'Menunggu Konfirmasi Kasir';
      case 'ACCEPTED':
        return 'Diterima oleh Kasir';
      case 'MAKING':
        return 'Sedang Dibuat Barista';
      case 'READY':
        return 'Pesanan Siap Diambil!';
      case 'COMPLETED':
        return 'Selesai';
      case 'CANCELLED':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const currentStep = getStatusStep(order.status);

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      {/* Navbar header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border shadow-2xs px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/menu?table=${order.tableNumber}`)} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-extrabold text-sm">Status Pesanan</h2>
          <p className="text-3xs text-muted-foreground font-mono">{order.orderNumber}</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* Real-time tracker card */}
        <Card className="border-border shadow-xs bg-card">
          <CardHeader className="pb-3 text-center border-b border-border/50">
            <CardDescription className="text-2xs font-semibold uppercase tracking-wider text-primary">Meja {order.tableNumber} &bull; {order.customerName}</CardDescription>
            <CardTitle className="text-xl font-black mt-1 flex items-center justify-center gap-2">
              {getStatusText(order.status, order.paymentStatus)}
            </CardTitle>
            <p className="text-2xs text-muted-foreground mt-1">Status diperbarui otomatis dalam waktu nyata</p>
          </CardHeader>
          <CardContent className="pt-6">
            {order.status !== 'CANCELLED' ? (
              /* Steps workflow visualizer */
              <div className="relative pl-6 border-l-2 border-muted space-y-6 py-2">
                {[
                  { title: 'Menunggu Pembayaran', desc: 'Konfirmasi kasir untuk transaksi tunai/debit atau bayar via QRIS.', step: 0 },
                  { title: 'Mengantri Konfirmasi', desc: 'Pesanan sedang diverifikasi oleh sistem kasir.', step: 1 },
                  { title: 'Pesanan Diterima', desc: 'Antrian pesanan sudah masuk antrian barista.', step: 2 },
                  { title: 'Sedang Dibuat', desc: 'Barista sedang menyiapkan minuman spesial Anda.', step: 3 },
                  { title: 'Siap Diambil / Disajikan', desc: 'Minuman sudah jadi. Silakan ambil di konter barista atau tunggu pelayan mengantarkan.', step: 4 },
                  { title: 'Pesanan Selesai', desc: 'Transaksi selesai. Terima kasih telah berkunjung!', step: 5 }
                ].map((s) => {
                  const isDone = currentStep >= s.step;
                  const isCurrent = currentStep === s.step;

                  return (
                    <div key={s.step} className="relative">
                      {/* Indicator circle */}
                      <span className={`absolute left-[-31px] top-1.5 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isDone 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'bg-background border-muted text-muted-foreground'
                      }`}>
                        {isDone && <Check className="h-2.5 w-2.5" />}
                      </span>
                      
                      <div className="space-y-0.5">
                        <h4 className={`text-xs font-bold ${isCurrent ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {s.title}
                        </h4>
                        <p className={`text-3xs leading-relaxed ${isCurrent ? 'text-foreground/90 font-medium' : 'text-muted-foreground'}`}>
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-destructive flex flex-col items-center">
                <CheckCircle2 className="h-12 w-12 text-destructive/70 mb-2 rotate-180" />
                <h4 className="font-bold">Pesanan Dibatalkan</h4>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">Silakan hubungi kasir/pelayan jika Anda memerlukan klarifikasi.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/40 p-4 border-t border-border/50 grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs font-bold rounded-xl h-10 border-border bg-background" 
              onClick={handleCallWaiter}
              disabled={callingWaiterLoading}
            >
              <Bell className="h-4 w-4 mr-1.5" />
              Panggil Pelayan
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs font-bold rounded-xl h-10 border-border bg-background"
              onClick={handleRequestBill}
              disabled={requestingBillLoading}
            >
              <Receipt className="h-4 w-4 mr-1.5" />
              Minta Tagihan
            </Button>
          </CardFooter>
        </Card>

        {/* Rating and Review Card (only when order is COMPLETED) */}
        {order.status === 'COMPLETED' && (
          <Card className="border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/5">
            <CardHeader className="pb-3 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-1 animate-bounce" />
              <CardTitle className="text-base font-bold">Bagaimana Pelayanan Kami?</CardTitle>
              <CardDescription className="text-2xs">Bantu kami meningkatkan kualitas layanan dengan memberikan rating Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              {reviewSubmitted ? (
                <div className="text-center text-xs text-emerald-600 font-bold py-4 flex flex-col items-center justify-center gap-1">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  Ulasan Anda sudah kami terima. Terima kasih!
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stars select */}
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star className={`h-8 w-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reviewText" className="text-2xs font-bold text-muted-foreground uppercase">Tulis Masukan/Komentar (Opsional)</Label>
                    <Textarea 
                      id="reviewText"
                      placeholder="Bagikan pengalaman rasa kopi, kecepatan, atau keramahan kami..."
                      value={reviewComment}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewComment(e.target.value)}
                      className="text-xs rounded-xl bg-background border-border min-h-[70px]"
                    />
                  </div>

                  <Button 
                    onClick={handleSubmitReview}
                    className="w-full bg-primary hover:bg-[#322318] text-primary-foreground font-bold h-10 rounded-xl"
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Mengirim Ulasan...' : 'Kirim Masukan'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order details summary */}
        <Card className="border-border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-bold">Rincian Item</CardTitle>
          </CardHeader>
          <CardContent className="py-4 space-y-3">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start gap-2 text-xs">
                <div className="min-w-0">
                  <h4 className="font-semibold text-foreground truncate">{item.name} <span className="text-muted-foreground">x{item.quantity}</span></h4>
                  <p className="text-3xs text-muted-foreground">Size: {item.size} | Sugar: {item.sugarLevel} | Ice: {item.iceLevel}</p>
                  {item.notes && <p className="text-3xs text-muted-foreground italic">Catatan: &ldquo;{item.notes}&rdquo;</p>}
                </div>
                <span className="font-bold whitespace-nowrap">Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}</span>
              </div>
            ))}

            <div className="border-t border-border/50 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>Rp {Number(order.subtotal).toLocaleString('id-ID')}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon</span>
                  <span>-Rp {Number(order.discount).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Pajak (10%)</span>
                <span>Rp {Number(order.tax).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-foreground pt-1.5 border-t border-border">
                <span>Total Tagihan</span>
                <span>Rp {Number(order.total).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
