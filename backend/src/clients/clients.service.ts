import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { mapAppointment } from 'src/common/appointment.mapper';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(q?: string) {
    const where =
      q && q.trim()
        ? {
            OR: [
              { name: { contains: q.trim(), mode: 'insensitive' as const } },
              { phone: { contains: q.trim(), mode: 'insensitive' as const } },
            ],
          }
        : undefined;

    return this.prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async findAppointments(id: string) {
    await this.findOne(id);
    const appointments = await this.prisma.appointment.findMany({
      where: { clientId: id },
      include: { client: true, service: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    return appointments.map(mapAppointment);
  }
}
