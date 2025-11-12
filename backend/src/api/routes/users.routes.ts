// Users routes - Created by Balaji Koneti
import { Router } from 'express';
import mongoose from 'mongoose';
import { User } from '../../models/user.model';
import { AuthenticatedRequest } from '../../middleware/rbac.middleware';
import { ROLES, UserRole } from '../../middleware/rbac.middleware';
import { verifyToken } from '../../services/auth.service';

// Create router instance
const router = Router();

// Middleware to verify JWT token
const authenticateToken = (req: AuthenticatedRequest, res: any, next: any) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Add user info to request
    req.user = decoded;
    next();
    
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// All user routes require authentication
router.use(authenticateToken);

// Get all users (filtered by role)
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const requesterRole = req.user?.role as UserRole;
    const requesterId = req.user?.userId;

    let query: any = {};

    // Filter users based on requester role
    if (requesterRole === ROLES.ADMIN) {
      // Admins can see all users (employees, managers, and admins)
      // No filter needed
    } else if (requesterRole === ROLES.MANAGER) {
      // Managers can see:
      // 1. Themselves
      // 2. All employees in their department (department-based access)
      // First, get the manager's department
      const manager = await User.findById(requesterId);
      if (!manager) {
        res.status(404).json({
          success: false,
          message: 'Manager not found'
        });
        return;
      }
      
      const managerDepartment = manager.department;
      const requesterObjectId = new mongoose.Types.ObjectId(requesterId);
      
      // Managers see themselves + all employees in their department
      query = {
        $or: [
          { _id: requesterObjectId },
          { 
            department: managerDepartment,
            role: 'user' // Only employees, not other managers or admins
          }
        ]
      };
    } else {
      // Employees can only see themselves
      query = { _id: new mongoose.Types.ObjectId(requesterId) };
    }

    // Get users (excluding passwords)
    const users = await User.find(query, { password: 0 })
      .populate('managerId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { password: 0 });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.json(user);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export router
export default router;
