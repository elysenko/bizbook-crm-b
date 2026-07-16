import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { mapAppointment } from 'src/common/appointment.mapper';
import { isValidDateOnly } from './appointments.validators';

const INCLUDE = { client: true, service: true } as const;

function dateOnlyToUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftIso(dateStr: string, days: number): string {
  const d = dateOnlyToUtc(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findByDate(dateStr: string) {
    if (!isValidDateOnly(dateStr)) {
      throw new BadRequestException('date must be a valid YYYY-MM-DD value');
    }
    const appointments = await this.prisma.appointment.findMany({
      where: { date: dateOnlyToUtc(dateStr) },
      include: INCLUDE,
      orderBy: { startTime: 'asc' },
    });
    return appointments.map(mapAppointment);
  }

  async today() {
    const today = todayIso();
    const tomorrow = shiftIso(today, 1);

    const appointments = await this.findByDate(today);
    const tomorrowCount = await this.prisma.appointment.count({
      where: { date: dateOnlyToUtc(tomorrow) },
    });

    return { date: today, appointments, tomorrowCount };
  }

  async create(dto: CreateAppointmentDto) {
    const date = dateOnlyToUtc(dto.date);

    return this.prisma.$transaction(async (tx) => {
      const [client, service] = await Promise.all([
        tx.client.findUnique({ where: { id: dto.clientId } }),
        tx.service.findUnique({ where: { id: dto.serviceId } }),
      ]);
      if (!client) throw new BadRequestException('Client not found');
      if (!service) throw new BadRequestException('Service not found');

      // A slot is "taken" only by an active (status != cancelled) appointment.
      const clash = await tx.appointment.findFirst({
        where: {
          date,
          startTime: dto.startTime,
          status: { not: 'cancelled' },
        },
      });
      if (clash) throw new ConflictException('Time slot already booked');

      const created = await tx.appointment.create({
        data: {
          clientId: dto.clientId,
          serviceId: dto.serviceId,
          date,
          startTime: dto.startTime,
          status: 'scheduled',
        },
        include: INCLUDE,
      });
      return mapAppointment(created);
    });
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Appointment not found');

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status },
      include: INCLUDE,
    });
    return mapAppointment(updated);
  }
}
