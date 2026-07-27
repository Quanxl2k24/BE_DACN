import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissonsService } from './permissons.service';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';

@Controller('permissons')
export class PermissonsController {
  constructor(private permissonsService: PermissonsService) {}

  @Get('list-permissons')
  @UseGuards(AccessTokenGuard)
  @Roles('Owner')
  listPermisson() {
    return this.permissonsService.listPermisson();
  }
}
