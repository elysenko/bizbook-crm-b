import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface RevenueMonth {
  month: string; // YYYY-MM
  totalCents: number;
  count: number;
}

@Injectable()
export class RevenueService {
  constructor(private prisma: PrismaService) {}

  /**
   * Sums `service.priceCents` of every `completed` appointment, grouped by the
   * appointment date's month (YYYY-MM), sorted descending. Non-completed
   * appointments contribute nothing.
   */
  async byMonth(): Promise<RevenueMonth[]> {
    const completed = await this.prisma.appointment.findMany({
      where: { status: 'completed' },
      select: { date: true, service: { select: { priceCents: true } } },
    });

    const buckets = new Map<string, { totalCents: number; count: number }>();
    for (const appt of completed) {
      const month = appt.date.toISOString().slice(0, 7); // YYYY-MM
      const bucket = buckets.get(month) ?? { totalCents: 0, count: 0 };
      bucket.totalCents += appt.service?.priceCents ?? 0;
      bucket.count += 1;
      buckets.set(month, bucket);
    }

    return Array.from(buckets.entries())
      .map(([month, v]) => ({ month, totalCents: v.totalCents, count: v.count }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }
}
