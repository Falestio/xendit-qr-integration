import { Injectable } from '@nestjs/common';
import { CreateQRCodeDto } from './dto/create-qr.dto';
import { QRCode } from './entities/qr.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { PaymentConfig } from 'src/config';
import { XenditQRCodeDto } from './dto/xendit-qr-code.dto';

@Injectable()
export class QrService {
  constructor(
    @InjectRepository(QRCode)
    private readonly qrCodeRepository: Repository<QRCode>,
  ) {}

  async getQRCode(
    userId: string,
    productId: string,
  ): Promise<XenditQRCodeDto | null> {
    console.log(
      `Fetching QR code for userId: ${userId}, productId: ${productId}`,
    );

    // Fetch the existing QR code from the database
    const existingQrCode = await this.qrCodeRepository.findOne({
      where: { userId, productId },
    });

    if (existingQrCode) {
      console.log(`Found existing QR code: ${existingQrCode.qrCodeId}`);

      // Use the qrCodeId from the database to fetch the QR code data from Xendit
      const qrCodeDataFromXendit = await this.getQRCodeFromXendit(
        existingQrCode.qrCodeId,
      );

      // Return the QR code data fetched from Xendit
      return qrCodeDataFromXendit;
    }

    console.log('No existing QR code found.');
    return null; // Return null if no QR code is found
  }

  async getQRCodeFromXendit(qrCodeId: string): Promise<XenditQRCodeDto | null> {
    console.log(`Fetching QR code from Xendit with ID: ${qrCodeId}`);
    const xenditApiUrl = `https://api.xendit.co/qr_codes/${qrCodeId}`;
    const apiKey = PaymentConfig.XENDIT_API_KEY;
    const headers = {
      'Content-Type': 'application/json',
      'api-version': '2022-07-31',
      Authorization: `Basic ${Buffer.from(apiKey).toString('base64')}`,
    };

    try {
      const response = await axios.get(xenditApiUrl, { headers });
      console.log('Successfully fetched QR code from Xendit:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching QR code from Xendit:', error);
      throw new Error('Failed to fetch QR code from Xendit');
    }
  }

  async isExpired(qrCode: XenditQRCodeDto): Promise<boolean> {
    const expired = new Date(qrCode.expires_at) < new Date();
    console.log(`QR code with ID ${qrCode.id} is expired: ${expired}`);
    return expired;
  }

  async isQRCodePaid(qrCode: XenditQRCodeDto): Promise<boolean> {
    // Check if the QR code status is "INACTIVE" and not expired
    const isExpired = await this.isExpired(qrCode);
    const isPaid = qrCode.status === 'INACTIVE' && !isExpired;
    console.log(`QR code with ID ${qrCode.id} is paid: ${isPaid}`);
    return isPaid;
  }

  async createQRCode(
    createQRCodeDto: CreateQRCodeDto,
  ): Promise<XenditQRCodeDto> {
    console.log('Creating QR code with data:', createQRCodeDto);
    const qrData = await this.prepareQRData(createQRCodeDto);

    try {
      const qrCodeData = await this.requestQRCodeFromXendit(qrData);
      console.log('QR code created successfully:', qrCodeData);

      // Save the QR code to the database
      await this.saveQRCodeToDatabase(createQRCodeDto, qrCodeData);

      // Return the QR code data fetched from Xendit
      return qrCodeData;
    } catch (error) {
      console.error('Error creating QR code:', error);
      throw new Error('Failed to create QR code');
    }
  }

  async deleteQRCode(qrCodeId: string): Promise<void> {
    console.log(`Deleting QR code with ID: ${qrCodeId}`);
    await this.qrCodeRepository.delete({ qrCodeId });
    console.log(`QR code with ID ${qrCodeId} has been deleted.`);
  }

  private async requestQRCodeFromXendit(qrData: any): Promise<any> {
    console.log('Requesting QR code from Xendit with data:', qrData);
    const xenditApiUrl = 'https://api.xendit.co/qr_codes';
    const apiKey = PaymentConfig.XENDIT_API_KEY;
    const headers = {
      'Content-Type': 'application/json',
      'api-version': '2022-07-31',
      Authorization: `Basic ${Buffer.from(apiKey).toString('base64')}`,
    };

    const response = await axios.post(xenditApiUrl, qrData, { headers });
    console.log('Received response from Xendit:', response.data);
    return response.data;
  }

  private async saveQRCodeToDatabase(
    createQRCodeDto: CreateQRCodeDto,
    qrCodeData: any,
  ): Promise<QRCode> {
    console.log('Saving QR code to database:', {
      userId: createQRCodeDto.userId,
      productId: createQRCodeDto.productId,
      qrCodeId: qrCodeData.id,
      expirationDate: qrCodeData.expires_at,
    });
    const newQRCode = this.qrCodeRepository.create({
      userId: createQRCodeDto.userId,
      productId: createQRCodeDto.productId,
      qrCodeId: qrCodeData.id,
      expirationDate: qrCodeData.expires_at,
    });
    return this.qrCodeRepository.save(newQRCode);
  }

  private async prepareQRData(createQRCodeDto: CreateQRCodeDto): Promise<any> {
    const qrData = {
      reference_id: `order-id-${Date.now()}`,
      type: 'DYNAMIC',
      currency: 'IDR',
      amount: createQRCodeDto.amount,
      expires_at: new Date(
        Date.now() + PaymentConfig.QR_EXPIRES_AT,
      ).toISOString(),
      metadata: {
        userId: createQRCodeDto.userId, // Include userId in metadata
        productId: createQRCodeDto.productId, // Include productId in metadata
        ...createQRCodeDto.metadata, // Spread any additional metadata if provided
      },
      basket: createQRCodeDto.basket,
    };
    console.log('Prepared QR data:', qrData);
    return qrData;
  }

  async listQrData(userId: string): Promise<XenditQRCodeDto[]> {
    console.log(`Listing QR codes for userId: ${userId}`);

    // Fetch all QR codes for the given userId from the database
    const qrCodes = await this.qrCodeRepository.find({
      where: { userId },
    });

    // If no QR codes are found, return an empty array
    if (!qrCodes.length) {
      console.log(`No QR codes found for userId: ${userId}`);
      return [];
    }

    // Fetch QR code data from Xendit for each QR code
    const qrCodeDataPromises = qrCodes.map((qrCode) =>
      this.getQRCodeFromXendit(qrCode.qrCodeId),
    );

    // Wait for all promises to resolve
    const qrCodeData = await Promise.all(qrCodeDataPromises);
    console.log(`Fetched QR code data for userId: ${userId}`, qrCodeData);

    return qrCodeData;
  }
}
