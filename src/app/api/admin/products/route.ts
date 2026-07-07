import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, price, categoryId, photo, stock } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json({ success: false, error: 'Harap lengkapi field wajib.' }, { status: 400 });
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price,
        categoryId,
        photo: photo || null,
        stock: stock ? parseInt(stock, 10) : 999,
      },
    });

    // Automatically attach default coffee shop options so the product is instantly ready for client customizations
    await prisma.productOption.createMany({
      data: [
        // Sizes
        { productId: product.id, name: 'Size', value: 'Regular', priceAdjustment: 0.00 },
        { productId: product.id, name: 'Size', value: 'Large', priceAdjustment: 5000.00 },
        // Sugar
        { productId: product.id, name: 'Sugar', value: 'Normal', priceAdjustment: 0.00 },
        { productId: product.id, name: 'Sugar', value: 'Less Sugar', priceAdjustment: 0.00 },
        { productId: product.id, name: 'Sugar', value: 'No Sugar', priceAdjustment: 0.00 },
        // Ice
        { productId: product.id, name: 'Ice', value: 'Normal Ice', priceAdjustment: 0.00 },
        { productId: product.id, name: 'Ice', value: 'Less Ice', priceAdjustment: 0.00 },
        { productId: product.id, name: 'Ice', value: 'No Ice', priceAdjustment: 0.00 },
      ],
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required.' }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
