import { prisma } from '@/lib/db';
import ReportsView from '@/features/admin/components/ReportsView';

export default async function AdminReportsPage() {
  const shifts = await prisma.shift.findMany({
    include: {
      cashier: true,
    },
    orderBy: { startTime: 'desc' },
  });

  const formattedShifts = shifts.map((s) => ({
    ...s,
    startCash: Number(s.startCash),
    endCash: s.endCash ? Number(s.endCash) : null,
    actualCash: s.actualCash ? Number(s.actualCash) : null,
  }));

  return <ReportsView initialShifts={formattedShifts} />;
}
