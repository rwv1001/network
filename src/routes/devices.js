const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const Joi = require('joi');

// Validation schema for MAC address
const macAddressSchema = Joi.string()
  .pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid MAC address format. Use format: aa:bb:cc:dd:ee:ff'
  });

// Validation schema for device registration
const deviceRegistrationSchema = Joi.object({
  macAddress: macAddressSchema,
  deviceName: Joi.string().min(1).max(100).required(),
  deviceType: Joi.string().valid('laptop', 'desktop', 'mobile', 'tablet', 'other').default('other')
});

// Device status check for network equipment
// This endpoint would be called by RADIUS server or network switches
router.get('/status/:macAddress', async (req, res) => {
  try {
    const { error } = macAddressSchema.validate(req.params.macAddress);
    if (error) {
      return res.status(400).json({
        error: 'Invalid MAC address format',
        details: error.details[0].message
      });
    }

    const macAddress = req.params.macAddress.toLowerCase();
    
    // In a real implementation, this would query the database
    // For now, we'll return a mock response
    const mockResponse = {
      macAddress: macAddress,
      registered: false, // Would be determined by database lookup
      user: null,
      vlan: 'guest', // guest, production, or blocked
      accessLevel: 'limited', // full, limited, or none
      lastSeen: null,
      registrationRequired: true
    };

    logger.info('Device status checked', { 
      macAddress, 
      registered: mockResponse.registered 
    });

    res.json(mockResponse);
  } catch (error) {
    logger.error('Error checking device status', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register a new device (requires authentication)
router.post('/register', auth, async (req, res) => {
  try {
    const { error, value } = deviceRegistrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }

    const { macAddress, deviceName, deviceType } = value;
    const userId = req.user.id;

    // In a real implementation, this would:
    // 1. Check if MAC address is already registered
    // 2. Add device to user's registered devices
    // 3. Trigger network configuration update
    // 4. Send notification to network management system

    const deviceRegistration = {
      macAddress: macAddress.toLowerCase(),
      deviceName,
      deviceType,
      userId,
      registeredAt: new Date(),
      status: 'active'
    };

    logger.info('Device registered', { 
      userId, 
      macAddress: deviceRegistration.macAddress,
      deviceName 
    });

    res.status(201).json({
      message: 'Device registered successfully',
      device: deviceRegistration,
      networkAccess: {
        vlan: 'production',
        accessLevel: 'full',
        effectiveImmediately: true
      }
    });
  } catch (error) {
    logger.error('Error registering device', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's registered devices
router.get('/my-devices', auth, async (req, res) => {
  try {
    // Mock response - in real implementation, query database
    const mockDevices = [
      {
        id: '1',
        macAddress: 'aa:bb:cc:dd:ee:ff',
        deviceName: 'John\'s Laptop',
        deviceType: 'laptop',
        registeredAt: '2024-01-15T10:30:00Z',
        lastSeen: '2024-01-15T14:25:00Z',
        status: 'active',
        networkStatus: {
          vlan: 'production',
          accessLevel: 'full',
          ipAddress: '192.168.200.150'
        }
      }
    ];

    res.json({
      devices: mockDevices,
      total: mockDevices.length
    });
  } catch (error) {
    logger.error('Error fetching user devices', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unregister a device
router.delete('/:deviceId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const deviceId = req.params.deviceId;

    // In real implementation:
    // 1. Verify device belongs to user
    // 2. Remove from database
    // 3. Trigger network configuration update
    // 4. Move device to guest VLAN

    logger.info('Device unregistered', { userId, deviceId });

    res.json({
      message: 'Device unregistered successfully',
      networkAction: 'Device moved to guest VLAN'
    });
  } catch (error) {
    logger.error('Error unregistering device', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to list all devices (admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Mock response for all devices
    const mockAllDevices = [
      {
        id: '1',
        macAddress: 'aa:bb:cc:dd:ee:ff',
        deviceName: 'John\'s Laptop',
        user: 'john@example.com',
        vlan: 'production',
        status: 'active',
        lastSeen: '2024-01-15T14:25:00Z'
      },
      {
        id: '2',
        macAddress: '11:22:33:44:55:66',
        deviceName: 'Unknown Device',
        user: null,
        vlan: 'guest',
        status: 'unregistered',
        lastSeen: '2024-01-15T14:20:00Z'
      }
    ];

    res.json({
      devices: mockAllDevices,
      total: mockAllDevices.length,
      summary: {
        registered: 1,
        unregistered: 1,
        blocked: 0
      }
    });
  } catch (error) {
    logger.error('Error fetching all devices', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to block/unblock devices
router.put('/admin/:macAddress/block', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { error } = macAddressSchema.validate(req.params.macAddress);
    if (error) {
      return res.status(400).json({
        error: 'Invalid MAC address format',
        details: error.details[0].message
      });
    }

    const macAddress = req.params.macAddress.toLowerCase();
    const { blocked } = req.body;

    // In real implementation, update database and trigger network changes
    logger.info('Device block status changed', { 
      macAddress, 
      blocked, 
      adminUser: req.user.email 
    });

    res.json({
      message: `Device ${blocked ? 'blocked' : 'unblocked'} successfully`,
      macAddress,
      newStatus: blocked ? 'blocked' : 'active',
      networkAction: blocked ? 'All traffic blocked' : 'Normal access restored'
    });
  } catch (error) {
    logger.error('Error changing device block status', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;