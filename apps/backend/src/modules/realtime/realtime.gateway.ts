import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { VehicleType } from '@prisma/client';
import { Server, Socket } from 'socket.io';

const VEHICLE_RANK: Record<VehicleType, number> = {
  BIKE: 0,
  CAR: 1,
  VAN: 2,
  TRUCK: 3,
};

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: '*' },
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  // ---- Per-entity rooms ----
  @SubscribeMessage('order:join')
  joinOrderRoom(@ConnectedSocket() client: Socket, @MessageBody() body: { orderId: string }) {
    client.join(`order:${body.orderId}`);
    return { joined: true, room: `order:${body.orderId}` };
  }

  @SubscribeMessage('delivery:join')
  joinDeliveryRoom(@ConnectedSocket() client: Socket, @MessageBody() body: { deliveryId: string }) {
    client.join(`delivery:${body.deliveryId}`);
    return { joined: true, room: `delivery:${body.deliveryId}` };
  }

  // ---- Per-role rooms (used for new-order / new-delivery alerts) ----
  @SubscribeMessage('seller:join')
  joinSellerRoom(@ConnectedSocket() client: Socket, @MessageBody() body: { sellerId: string }) {
    if (!body?.sellerId) return { joined: false };
    client.join(`seller:${body.sellerId}`);
    return { joined: true, room: `seller:${body.sellerId}` };
  }

  /**
   * Couriers join all vehicle-tier rooms at-or-below their own (a TRUCK courier
   * also gets BIKE/CAR/VAN deliveries since they fit). Frontend passes the
   * courier's vehicleType; backend computes the tier set.
   */
  @SubscribeMessage('courier:join')
  joinCourierRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { courierId: string; vehicleType?: VehicleType },
  ) {
    if (!body?.courierId) return { joined: false };
    client.join(`courier:${body.courierId}`);

    const myTier = VEHICLE_RANK[body.vehicleType ?? VehicleType.BIKE] ?? 0;
    const subscribedTiers: VehicleType[] = [];
    for (const v of Object.values(VehicleType)) {
      if (VEHICLE_RANK[v] <= myTier) {
        client.join(`couriers:vehicle:${v}`);
        subscribedTiers.push(v);
      }
    }
    return { joined: true, courier: body.courierId, tiers: subscribedTiers };
  }

  // ---- Emitters ----
  emitOrderStatus(orderId: string, payload: Record<string, unknown>) {
    this.server.to(`order:${orderId}`).emit('order:status', payload);
  }

  emitDeliveryStatus(deliveryId: string, payload: Record<string, unknown>) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:status', payload);
  }

  emitCourierLocation(deliveryId: string, payload: Record<string, unknown>) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:location', payload);
  }

  emitNewOrderToSeller(sellerId: string, payload: Record<string, unknown>) {
    this.server.to(`seller:${sellerId}`).emit('order:new', payload);
  }

  emitOrderUpdateToSeller(sellerId: string, payload: Record<string, unknown>) {
    this.server.to(`seller:${sellerId}`).emit('order:update', payload);
  }

  /**
   * Broadcast a newly-available delivery to every courier whose vehicle tier
   * is >= the required vehicle (so a BIKE order reaches BIKE/CAR/VAN/TRUCK,
   * but a TRUCK order only reaches TRUCK couriers).
   */
  emitAvailableDeliveryToCouriers(requiredVehicle: VehicleType, payload: Record<string, unknown>) {
    const required = VEHICLE_RANK[requiredVehicle] ?? 0;
    const targetTiers = Object.values(VehicleType).filter(
      (v) => VEHICLE_RANK[v] >= required,
    );
    for (const tier of targetTiers) {
      this.server.to(`couriers:vehicle:${tier}`).emit('delivery:available', payload);
    }
  }

  emitDeliveryClaimed(payload: Record<string, unknown>) {
    // Tell every courier room to remove this delivery from their pickable list.
    for (const tier of Object.values(VehicleType)) {
      this.server.to(`couriers:vehicle:${tier}`).emit('delivery:claimed', payload);
    }
  }
}
