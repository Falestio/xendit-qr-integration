import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QrModule } from './qr/qr.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QRCode } from './qr/entities/qr.entity';
import { DBConfig } from './config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres', // Specify the database type
      host: DBConfig.DB_HOST, // Database host
      port: DBConfig.DB_PORT, // Database port
      username: DBConfig.DB_USERNAME, // Database username
      password: DBConfig.DB_PASSWORD, // Database password
      database: DBConfig.DB_NAME, // Database name
      entities: [QRCode], // Specify the entities
      synchronize: true, // Set to true
    }),
    QrModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
