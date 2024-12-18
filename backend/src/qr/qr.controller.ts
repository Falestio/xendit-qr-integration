import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { QrService } from './qr.service';
import { CreateQRCodeDto } from './dto/create-qr.dto';
import { XenditQRCodeDto } from './dto/xendit-qr-code.dto';

@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('get-qr')
  async fetchQrCode(@Body() createQRCodeDto: CreateQRCodeDto) {
    console.log('Incoming get-qr request:', createQRCodeDto);
    // Memeriksa apakah QR code sudah ada di database
    const existingQRCode = await this.qrService.getQRCode(
      createQRCodeDto.userId,
      createQRCodeDto.productId,
    );

    let isPaid = false;

    if (existingQRCode) {
      // Check if the existing QR code is expired
      const isExpired = await this.qrService.isExpired(existingQRCode);
      if (isExpired) {
        // If expired, delete the existing QR code
        await this.qrService.deleteQRCode(existingQRCode.id);
        console.log(`Expired QR code deleted: ${existingQRCode.id}`);
      } else {
        // If QR code is not expired, return the existing QR code
        isPaid = await this.qrService.isQRCodePaid(existingQRCode);
        return { qrCode: existingQRCode, isPaid };
      }
    }

    // If no QR code exists or the existing one was deleted, create a new QR code
    const newQRCode = await this.qrService.createQRCode(createQRCodeDto);
    return { qrCode: newQRCode, isPaid };
  }

  @Get('check-qr-payment/:id')
  async checkPayment(@Param('id') qrId: string) {
    // Fetch the QR code using the service
    const qrCode = await this.qrService.getQRCodeFromXendit(qrId);

    if (qrCode) {
      // If the QR code is found, return its status
      const isPaid = await this.qrService.isQRCodePaid(qrCode);
      return {
        qrCode,
        isPaid,
      };
    } else {
      // If the QR code is not found, return a not found status
      return {
        message: 'NOT_FOUND',
      };
    }
  }

  @Get('list-qr-codes/:userId')
  async listQrCodes(
    @Param('userId') userId: string,
  ): Promise<XenditQRCodeDto[]> {
    return this.qrService.listQrData(userId);
  }

  @Post('callback-qr-paid')
  async handleCallback(@Body(``) callbackDto: any) {
    console.log(callbackDto);
  }
}
