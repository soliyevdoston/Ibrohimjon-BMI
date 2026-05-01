import { Injectable } from '@nestjs/common';
import { VehicleType } from '@prisma/client';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeService {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  publishOrderStatus(orderId: string, status: string, extra: Record<string, unknown> = {}) {
    this.realtimeGateway.emitOrderStatus(orderId, {
      orderId,
      status,
      timestamp: new Date().toISOString(),
      ...extra,
    });
  }

  publishDeliveryStatus(deliveryId: string, status: string, extra: Record<string, unknown> = {}) {
    this.realtimeGateway.emitDeliveryStatus(deliveryId, {
      deliveryId,
      status,
      timestamp: new Date().toISOString(),
      ...extra,
    });
  }

  publishCourierLocation(
    deliveryId: string,
    payload: { lat: number; lng: number; speedMps?: number; headingDeg?: number; etaMinutes?: number },
  ) {
    this.realtimeGateway.emitCourierLocation(deliveryId, {
      deliveryId,
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  /** Push a freshly-created order to the seller's dashboard in real time. */
  notifySellerNewOrder(
    sellerId: string,
    order: {
      id: string;
      totalAmount: number;
      requiredVehicle: VehicleType;
      totalWeightKg: number;
      itemCount: number;
    },
  ) {
    this.realtimeGateway.emitNewOrderToSeller(sellerId, {
      ...order,
      timestamp: new Date().toISOString(),
    });
  }

  /** When seller status changes (or anything affecting the seller queue). */
  notifySellerOrderUpdate(sellerId: string, orderId: string, status: string) {
    this.realtimeGateway.emitOrderUpdateToSeller(sellerId, {
      orderId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Tell compatible couriers a new pickup is available. Only couriers whose
   * vehicle tier >= requiredVehicle receive this event.
   */
  notifyCouriersDeliveryAvailable(payload: {
    deliveryId: string;
    orderId: string;
    requiredVehicle: VehicleType;
    totalWeightKg: number;
    distanceKm?: number;
    courierFeeAmount?: number;
    pickupAddress?: string;
    deliveryAddress?: string;
  }) {
    this.realtimeGateway.emitAvailableDeliveryToCouriers(payload.requiredVehicle, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  /** Tell couriers a delivery has been picked up by someone else. */
  notifyDeliveryClaimed(deliveryId: string, courierId: string) {
    this.realtimeGateway.emitDeliveryClaimed({
      deliveryId,
      courierId,
      timestamp: new Date().toISOString(),
    });
  }
}
