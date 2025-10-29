import { Module } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { PredictionsController } from './predictions.controller';
import { MlModule } from '../ml/ml.module';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [MlModule],
  controllers: [PredictionsController],
  providers: [PredictionsService, RolesGuard],
  exports: [PredictionsService],
})
export class PredictionsModule {}
