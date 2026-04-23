import { Injectable } from '@nestjs/common';
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
}
