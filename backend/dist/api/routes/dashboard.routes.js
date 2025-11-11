"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_middleware_1 = require("../../middleware/authenticate.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const dashboard_controller_1 = require("../../controllers/dashboard.controller");
const router = (0, express_1.Router)();
router.use(authenticate_middleware_1.authenticateRequest);
router.get('/employee/overview', dashboard_controller_1.getEmployeeDashboard);
router.post('/employee/simulate', dashboard_controller_1.simulateEmployeeBurnout);
router.get('/manager/overview', (0, rbac_middleware_1.requireRole)([rbac_middleware_1.ROLES.MANAGER, rbac_middleware_1.ROLES.ADMIN]), dashboard_controller_1.getManagerDashboard);
router.get('/manager/employees', (0, rbac_middleware_1.requireRole)([rbac_middleware_1.ROLES.MANAGER, rbac_middleware_1.ROLES.ADMIN]), dashboard_controller_1.getEmployeeInsights);
router.get('/manager/model', (0, rbac_middleware_1.requireRole)([rbac_middleware_1.ROLES.MANAGER, rbac_middleware_1.ROLES.ADMIN]), dashboard_controller_1.getModelOperations);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map