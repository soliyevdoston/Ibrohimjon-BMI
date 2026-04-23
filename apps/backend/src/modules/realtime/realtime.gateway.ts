import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: '*' },
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

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

  emitOrderStatus(orderId: string, payload: Record<string, unknown>) {
    this.server.to(`order:${orderId}`).emit('order:status', payload);
  }

  emitDeliveryStatus(deliveryId: string, payload: Record<string, unknown>) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:status', payload);
  }

  emitCourierLocation(deliveryId: string, payload: Record<string, unknown>) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:location', payload);
  }
}
