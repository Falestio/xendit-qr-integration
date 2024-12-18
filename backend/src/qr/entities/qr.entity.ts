import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('qr_codes') // Specify the table name in the database
export class QRCode {
  @PrimaryGeneratedColumn('uuid') // Automatically generate a unique ID
  id: string;

  @Column()
  userId: string;

  @Column()
  productId: string;

  @Column()
  qrCodeId: string;

  @Column()
  expirationDate: Date;
}
