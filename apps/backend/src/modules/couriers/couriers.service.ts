import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { VehicleType } from "@prisma/client";
import { PrismaService } from "src/common/prisma.service";

const VEHICLE_TYPES: VehicleType[] = [
  VehicleType.BIKE,
  VehicleType.CAR,
  VehicleType.VAN,
  VehicleType.TRUCK,
];

interface UpsertProfileInput {
  vehicleType?: VehicleType | string;
  vehicleModel?: string | null;
  vehiclePlate?: string | null;
  maxLoadKg?: number;
}

@Injectable()
export class CouriersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertProfile(userId: string, payload: UpsertProfileInput) {
    const vehicleType = parseVehicleType(payload.vehicleType);
    const maxLoadKg =
      payload.maxLoadKg !== undefined && Number.isFinite(payload.maxLoadKg)
        ? payload.maxLoadKg
        : undefined;

    return this.prisma.courier.upsert({
      where: { userId },
      update: {
        ...(vehicleType ? { vehicleType } : {}),
        ...(payload.vehicleModel !== undefined ? { vehicleModel: payload.vehicleModel } : {}),
        ...(payload.vehiclePlate !== undefined ? { vehiclePlate: payload.vehiclePlate } : {}),
        ...(maxLoadKg !== undefined ? { maxLoadKg } : {}),
      },
      create: {
        userId,
        vehicleType: vehicleType ?? VehicleType.BIKE,
        vehicleModel: payload.vehicleModel ?? null,
        vehiclePlate: payload.vehiclePlate ?? null,
        ...(maxLoadKg !== undefined ? { maxLoadKg } : {}),
      },
    });
  }

  async setPresence(
    userId: string,
    body: { isOnline: boolean; isAvailable: boolean },
  ) {
    const courier = await this.prisma.courier.findFirst({ where: { userId } });
    if (!courier) {
      throw new NotFoundException("Courier profile not found");
    }

    return this.prisma.courier.update({
      where: { id: courier.id },
      data: {
        isOnline: body.isOnline,
        isAvailable: body.isAvailable,
        lastSeenAt: new Date(),
      },
    });
  }

  async myProfile(userId: string) {
    const courier = await this.prisma.courier.findFirst({ where: { userId } });
    if (!courier) {
      throw new NotFoundException("Courier profile not found");
    }
    return courier;
  }
}

function parseVehicleType(raw: VehicleType | string | undefined): VehicleType | undefined {
  if (!raw) return undefined;
  const upper = String(raw).toUpperCase() as VehicleType;
  if (!VEHICLE_TYPES.includes(upper)) {
    throw new BadRequestException("Vehicle type noto`g`ri (BIKE/CAR/VAN/TRUCK)");
  }
  return upper;
}
