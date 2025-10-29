import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MlModule } from './ml/ml.module';
import { PredictionsModule } from './predictions/predictions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    MlModule,
    PredictionsModule,
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
