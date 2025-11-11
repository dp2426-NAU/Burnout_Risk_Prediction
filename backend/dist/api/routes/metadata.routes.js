"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const metadata_controller_1 = require("../../controllers/metadata.controller");
const router = (0, express_1.Router)();
router.get('/health', metadata_controller_1.getHealthStatus);
router.get('/info', metadata_controller_1.getApiInfo);
router.get('/models', metadata_controller_1.getModelInfo);
exports.default = router;
//# sourceMappingURL=metadata.routes.js.map