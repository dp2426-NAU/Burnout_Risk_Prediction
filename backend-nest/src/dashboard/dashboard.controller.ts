import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MlService } from '../ml/ml.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly mlService: MlService,
  ) {}

  @Get('employee/dashboard')
  @Roles('EMPLOYEE', 'ADMIN')
  async employeeDashboard(@CurrentUser() user: { userId: string }) {
    return this.dashboardService.getEmployeeDashboard(user.userId);
  }

  @Get('employee/dashboard/details/:id')
  @Roles('EMPLOYEE', 'ADMIN')
  async employeeDetails(@Param('id') id: string, @CurrentUser() user: { userId: string; role: string }) {
    const targetId = id === 'me' ? user.userId : id;
    return this.dashboardService.getEmployeeDetails(targetId);
  }

  @Get('admin/employees')
  @Roles('ADMIN')
  async adminEmployees() {
    return this.dashboardService.getAdminOverview();
  }

  @Get('admin/employee/:id')
  @Roles('ADMIN')
  async adminEmployee(@Param('id') id: string) {
    return this.dashboardService.getAdminEmployee(id);
  }

  @Get('admin/metrics')
  @Roles('ADMIN')
  async metrics() {
    return this.mlService.getMetrics();
  }
}
