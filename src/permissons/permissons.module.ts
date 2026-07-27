import { Module } from '@nestjs/common';
import { PermissonsController } from './permissons.controller';
import { PermissonsService } from './permissons.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PermissonsController],
  providers: [PermissonsService],
})
export class PermissonsModule {}
