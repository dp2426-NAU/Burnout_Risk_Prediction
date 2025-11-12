// Dashboard routes - Handles dashboard API endpoints
import { Router } from 'express';
import { authenticateRequest } from '../../middleware/authenticate.middleware';
import { requireEmployeeOrManager } from '../../middleware/rbac.middleware';
import {
  getEmployeeDashboard,
  getEmployeeDashboardById,
  getProfileOverview,
  simulateBurnoutRisk
} from '../../controllers/dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(authenticateRequest);
router.use(requireEmployeeOrManager());

// Get current user's dashboard data (employee only - no userId param)
// Managers/admins can pass userId query param to view other employees
router.get('/employee', getEmployeeDashboard);

// Get specific employee's dashboard data (manager/admin only)
router.get('/employee/:userId', getEmployeeDashboardById);

// Get profile overview with daily summary
router.get('/profile', getProfileOverview);

// Simulate burnout risk with adjusted parameters
router.post('/simulate', simulateBurnoutRisk);

export default router;

