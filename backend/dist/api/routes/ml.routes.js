"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ml_controller_1 = require("../../controllers/ml.controller");
const authenticate_middleware_1 = require("../../middleware/authenticate.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
router.use(authenticate_middleware_1.authenticateRequest);
router.use(rbac_middleware_1.requireAdmin);
router.post('/retrain', ml_controller_1.retrainModels);
router.get('/eda', ml_controller_1.fetchEdaReport);
exports.default = router;
//# sourceMappingURL=ml.routes.js.map