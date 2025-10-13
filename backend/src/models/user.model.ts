// User model for MongoDB - Created by Balaji Koneti
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for User document
export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'manager';
  isActive: boolean;
  lastLogin?: Date;
  department?: string;
  jobTitle?: string;
  experienceYears?: number;
  workPatterns?: any;
  createdAt: Date;
  updatedAt: Date;
  // Method to compare password
  comparePassword(candidatePassword: string): Promise<boolean>;
  // Method to get full name
  getFullName(): string;
}

// User schema definition
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'manager'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  department: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  experienceYears: {
    type: Number,
    min: 0,
    max: 50
  },
  workPatterns: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true, // Automatically add createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with salt rounds of 12
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    // Compare candidate password with hashed password
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to get full name
userSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

// Index for email for faster queries
userSchema.index({ email: 1 });

// Index for role for filtering users
userSchema.index({ role: 1 });

// Index for active status
userSchema.index({ isActive: 1 });

// Create and export the User model
export const User = mongoose.model<IUser>('User', userSchema);
