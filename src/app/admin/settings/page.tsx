'use client';

import { useState } from 'react';
import { Settings, ShieldCheck, HelpCircle, Store, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [shopName, setShopName] = useState<string>('Smart Coffee Shop');
  const [address, setAddress] = useState<string>('Jl. Arabica No. 10, Jakarta');
  const [phone, setPhone] = useState<string>('(021) 8888-9999');
  const [taxRate, setTaxRate] = useState<string>('10');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Pengaturan toko berhasil diperbarui!');
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-6.5 w-6.5 text-primary" /> Pengaturan Toko
        </h1>
        <p className="text-sm text-muted-foreground">Sesuaikan detail identitas kafe, persentase pajak transaksi, dan data struk POS.</p>
      </div>

      <Card className="border-border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <Store className="h-4.5 w-4.5 text-primary" /> Profil & Informasi Toko
          </CardTitle>
          <CardDescription className="text-3xs">Detail ini akan dicetak otomatis pada struk belanja kasir.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4 pt-4 text-xs font-semibold">
            
            <div className="space-y-1">
              <Label htmlFor="shopName" className="text-xs font-semibold">Nama Coffee Shop</Label>
              <Input 
                id="shopName"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="h-10 bg-background border-border text-xs rounded-xl"
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="shopAddr" className="text-xs font-semibold">Alamat Toko</Label>
              <Input 
                id="shopAddr"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-10 bg-background border-border text-xs rounded-xl"
                disabled={submitting}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="shopPhone" className="text-xs font-semibold">Nomor Telepon</Label>
                <Input 
                  id="shopPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 bg-background border-border text-xs rounded-xl"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="shopTax" className="text-xs font-semibold">Pajak Pertambahan Nilai (%)</Label>
                <Input 
                  id="shopTax"
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="h-10 bg-background border-border text-xs rounded-xl"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

          </CardContent>
          <CardFooter className="pt-2 border-t border-border/50 justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-[#322318] text-primary-foreground font-bold h-9 rounded-xl px-5 text-xs flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
