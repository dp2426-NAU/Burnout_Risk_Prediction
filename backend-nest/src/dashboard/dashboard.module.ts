import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { RolesGuard } from '../common/guards/roles.guard';
import { MlModule } from '../ml/ml.module';

@Module({
  imports: [MlModule],
  controllers: [DashboardController],
  providers: [DashboardService, RolesGuard],
})
export class DashboardModule {}
