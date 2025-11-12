"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_middleware_1 = require("../../middleware/authenticate.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const dashboard_controller_1 = require("../../controllers/dashboard.controller");
const router = (0, express_1.Router)();
router.use(authenticate_middleware_1.authenticateRequest);
router.use((0, rbac_middleware_1.requireEmployeeOrManager)());
router.get('/employee', dashboard_controller_1.getEmployeeDashboard);
router.get('/employee/:userId', dashboard_controller_1.getEmployeeDashboardById);
router.get('/profile', dashboard_controller_1.getProfileOverview);
router.post('/simulate', dashboard_controller_1.simulateBurnoutRisk);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map