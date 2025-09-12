const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(50),
  lastName: Joi.string().max(50)
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    })
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to retrieve profile'
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const { firstName, lastName } = value;
    const user = req.user;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile'
    });
  }
});

// Update password
router.put('/password', auth, async (req, res) => {
  try {
    const { error, value } = updatePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const { currentPassword, newPassword } = value;
    const user = await User.findById(req.user._id);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password updated for user: ${user.email}`);

    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error('Update password error:', error);
    res.status(500).json({
      error: 'Failed to update password'
    });
  }
});

// Get all users (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: users.length,
        totalUsers: total
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to retrieve users'
    });
  }
});

// Get user by ID (admin only)
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user'
    });
  }
});

// Update user role (admin only)
router.put('/:id/role', auth, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be user, admin, or moderator'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    logger.info(`Role updated for user ${user.email} to ${role} by ${req.user.email}`);

    res.json({
      message: 'User role updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({
      error: 'Failed to update user role'
    });
  }
});

// Deactivate user (admin only)
router.put('/:id/deactivate', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    logger.info(`User ${user.email} deactivated by ${req.user.email}`);

    res.json({
      message: 'User deactivated successfully'
    });
  } catch (error) {
    logger.error('Deactivate user error:', error);
    res.status(500).json({
      error: 'Failed to deactivate user'
    });
  }
});

// Activate user (admin only)
router.put('/:id/activate', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    logger.info(`User ${user.email} activated by ${req.user.email}`);

    res.json({
      message: 'User activated successfully'
    });
  } catch (error) {
    logger.error('Activate user error:', error);
    res.status(500).json({
      error: 'Failed to activate user'
    });
  }
});

module.exports = router;