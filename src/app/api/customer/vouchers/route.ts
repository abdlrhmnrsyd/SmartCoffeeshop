import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const totalStr = searchParams.get('total');

    if (!code) {
      return NextResponse.json({ success: false, error: 'Voucher code is required' }, { status: 400 });
    }

    const total = totalStr ? Number(totalStr) : 0;

    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!voucher) {
      return NextResponse.json({ success: false, error: 'Voucher tidak ditemukan.' }, { status: 404 });
    }

    if (!voucher.isActive) {
      return NextResponse.json({ success: false, error: 'Voucher sudah tidak aktif.' }, { status: 400 });
    }

    if (new Date() > new Date(voucher.expiryDate)) {
      return NextResponse.json({ success: false, error: 'Voucher telah kedaluwarsa.' }, { status: 400 });
    }

    if (total < Number(voucher.minOrderAmount)) {
      return NextResponse.json({ 
        success: false, 
        error: `Minimum pembelanjaan untuk voucher ini adalah Rp ${Number(voucher.minOrderAmount).toLocaleString('id-ID')}.` 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: Number(voucher.discountValue),
        maxDiscount: voucher.maxDiscount ? Number(voucher.maxDiscount) : null,
        minOrderAmount: Number(voucher.minOrderAmount),
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
