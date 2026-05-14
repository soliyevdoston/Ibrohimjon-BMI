import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddressesService } from './addresses.service';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.addresses.list(userId);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() body: { label: string; addressText: string; lat: number; lng: number; isDefault?: boolean },
  ) {
    return this.addresses.create(userId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: Partial<{ label: string; addressText: string; lat: number; lng: number; isDefault: boolean }>,
  ) {
    return this.addresses.update(userId, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.addresses.remove(userId, id);
  }
}
