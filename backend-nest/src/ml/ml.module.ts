import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MlService } from './ml.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>('ML_SERVICE_URL', 'http://localhost:8001'),
        timeout: 10000,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MlService],
  exports: [MlService],
})
export class MlModule {}
