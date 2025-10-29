import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('predictions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post('self')
  @Roles('EMPLOYEE', 'ADMIN')
  async predictForSelf(
    @CurrentUser() user: { userId: string; role: string },
    @Body() payload: Record<string, number> = {},
  ) {
    return this.predictionsService.generatePredictionForUser(user.userId, {
      additionalData: payload,
      requestedBy: { id: user.userId, role: user.role as any },
    });
  }

  @Post(':userId')
  @Roles('ADMIN')
  async predictForUser(
    @Param('userId') userId: string,
    @CurrentUser() admin: { userId: string; role: string },
    @Body() payload: Record<string, number> = {},
  ) {
    return this.predictionsService.generatePredictionForUser(userId, {
      additionalData: payload,
      requestedBy: { id: admin.userId, role: admin.role as any },
    });
  }

  @Get('latest')
  @Roles('EMPLOYEE', 'ADMIN')
  async latestForSelf(@CurrentUser() user: { userId: string }) {
    return this.predictionsService.getLatestPrediction(user.userId);
  }
}
