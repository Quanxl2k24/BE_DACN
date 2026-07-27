import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissonsService } from './permissons.service';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Permissions - Quyền')
@Controller('permissons')
export class PermissonsController {
  constructor(private permissonsService: PermissonsService) {}

  @Get('list-permissons')
  @UseGuards(AccessTokenGuard)
  @Roles('Owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách quyền', description: 'Lấy danh sách tất cả quyền có sẵn trong hệ thống để gán cho vai trò.' })
  listPermisson() {
    return this.permissonsService.listPermisson();
  }
}
