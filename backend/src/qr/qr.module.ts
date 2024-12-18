import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QRCode } from './entities/qr.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QRCode])],
  controllers: [QrController],
  providers: [QrService],
})
export class QrModule {}
