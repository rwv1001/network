# Network Access Control API Examples

This document provides practical examples of how to use the Network Access Control API endpoints for MAC address management and device registration.

## Authentication

All device management endpoints (except status check) require authentication. Include the JWT token in the Authorization header:

```bash
Authorization: Bearer <jwt-token>
```

## Device Status Check (For Network Equipment)

This endpoint is designed to be called by network equipment (switches, routers, RADIUS servers) to determine how to handle a device based on its MAC address.

**Request:**
```bash
GET /api/devices/status/aa:bb:cc:dd:ee:ff
```

**Response for Registered Device:**
```json
{
  "macAddress": "aa:bb:cc:dd:ee:ff",
  "registered": true,
  "user": "john@example.com",
  "vlan": "production",
  "accessLevel": "full",
  "lastSeen": "2024-01-15T14:25:00Z",
  "registrationRequired": false
}
```

**Response for Unregistered Device:**
```json
{
  "macAddress": "aa:bb:cc:dd:ee:ff",
  "registered": false,
  "user": null,
  "vlan": "guest",
  "accessLevel": "limited",
  "lastSeen": null,
  "registrationRequired": true
}
```

## Device Registration

Users can register their devices to gain full network access.

**Request:**
```bash
POST /api/devices/register
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "macAddress": "aa:bb:cc:dd:ee:ff",
  "deviceName": "John's Laptop",
  "deviceType": "laptop"
}
```

**Response:**
```json
{
  "message": "Device registered successfully",
  "device": {
    "macAddress": "aa:bb:cc:dd:ee:ff",
    "deviceName": "John's Laptop",
    "deviceType": "laptop",
    "userId": "507f1f77bcf86cd799439011",
    "registeredAt": "2024-01-15T15:30:00Z",
    "status": "active"
  },
  "networkAccess": {
    "vlan": "production",
    "accessLevel": "full",
    "effectiveImmediately": true
  }
}
```

## Get User's Devices

**Request:**
```bash
GET /api/devices/my-devices
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "devices": [
    {
      "id": "1",
      "macAddress": "aa:bb:cc:dd:ee:ff",
      "deviceName": "John's Laptop",
      "deviceType": "laptop",
      "registeredAt": "2024-01-15T10:30:00Z",
      "lastSeen": "2024-01-15T14:25:00Z",
      "status": "active",
      "networkStatus": {
        "vlan": "production",
        "accessLevel": "full",
        "ipAddress": "192.168.200.150"
      }
    }
  ],
  "total": 1
}
```

## Admin: List All Devices

**Request:**
```bash
GET /api/devices/admin/all
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "devices": [
    {
      "id": "1",
      "macAddress": "aa:bb:cc:dd:ee:ff",
      "deviceName": "John's Laptop",
      "user": "john@example.com",
      "vlan": "production",
      "status": "active",
      "lastSeen": "2024-01-15T14:25:00Z"
    },
    {
      "id": "2",
      "macAddress": "11:22:33:44:55:66",
      "deviceName": "Unknown Device",
      "user": null,
      "vlan": "guest",
      "status": "unregistered",
      "lastSeen": "2024-01-15T14:20:00Z"
    }
  ],
  "total": 2,
  "summary": {
    "registered": 1,
    "unregistered": 1,
    "blocked": 0
  }
}
```

## Admin: Block/Unblock Device

**Block Device:**
```bash
PUT /api/devices/admin/aa:bb:cc:dd:ee:ff/block
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "blocked": true
}
```

**Response:**
```json
{
  "message": "Device blocked successfully",
  "macAddress": "aa:bb:cc:dd:ee:ff",
  "newStatus": "blocked",
  "networkAction": "All traffic blocked"
}
```

## Integration Examples

### RADIUS Server Integration

```python
# Python example for RADIUS server
import requests

def check_device_access(mac_address):
    try:
        response = requests.get(
            f"http://identity-manager:3000/api/devices/status/{mac_address}",
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                'allow_access': data['registered'],
                'vlan': data['vlan'],
                'access_level': data['accessLevel']
            }
    except requests.RequestException:
        # Fallback to guest access if service unavailable
        return {
            'allow_access': True,
            'vlan': 'guest',
            'access_level': 'limited'
        }
```

### Switch Configuration Script

```bash
#!/bin/bash
# Script to update switch VLAN based on device status

MAC_ADDRESS=$1
SWITCH_PORT=$2

# Check device status
RESPONSE=$(curl -s "http://identity-manager:3000/api/devices/status/$MAC_ADDRESS")
VLAN=$(echo $RESPONSE | jq -r '.vlan')

# Configure switch port based on VLAN
if [ "$VLAN" = "production" ]; then
    # Configure for production VLAN
    snmpset -v2c -c private $SWITCH_IP .1.3.6.1.2.1.17.7.1.4.5.1.1.$SWITCH_PORT i 200
    echo "Port $SWITCH_PORT configured for production VLAN"
elif [ "$VLAN" = "guest" ]; then
    # Configure for guest VLAN
    snmpset -v2c -c private $SWITCH_IP .1.3.6.1.2.1.17.7.1.4.5.1.1.$SWITCH_PORT i 100
    echo "Port $SWITCH_PORT configured for guest VLAN"
else
    # Block the port
    snmpset -v2c -c private $SWITCH_IP .1.3.6.1.2.1.2.2.1.7.$SWITCH_PORT i 2
    echo "Port $SWITCH_PORT blocked"
fi
```

### DHCP Server Integration

```python
# Python DHCP server hook example
import requests
import json

def dhcp_assign_ip(mac_address, requested_ip=None):
    """
    DHCP server hook to assign IP based on device registration
    """
    try:
        # Check device status
        response = requests.get(
            f"http://identity-manager:3000/api/devices/status/{mac_address}",
            timeout=3
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data['vlan'] == 'production':
                # Assign IP from production range
                return assign_production_ip(mac_address, requested_ip)
            elif data['vlan'] == 'guest':
                # Assign IP from guest range
                return assign_guest_ip(mac_address)
            else:
                # Device blocked, deny IP
                return None
                
    except requests.RequestException:
        # Service unavailable, assign guest IP as fallback
        return assign_guest_ip(mac_address)

def assign_production_ip(mac_address, requested_ip):
    # Production IP range: 192.168.200.0/24
    base_ip = "192.168.200."
    # ... implement IP assignment logic
    return f"{base_ip}150"

def assign_guest_ip(mac_address):
    # Guest IP range: 192.168.100.0/24
    base_ip = "192.168.100."
    # ... implement IP assignment logic
    return f"{base_ip}50"
```

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- `400` - Bad Request (invalid MAC address format, validation errors)
- `401` - Unauthorized (missing or invalid authentication token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (device not found)
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "error": "Invalid MAC address format",
  "details": "Invalid MAC address format. Use format: aa:bb:cc:dd:ee:ff"
}
```

## Rate Limiting

The API includes rate limiting to prevent abuse:

- General API endpoints: 100 requests per 15 minutes per IP
- Authentication endpoints: 50 requests per 15 minutes per IP
- Device status checks: No rate limiting (for network equipment)

## Security Considerations

1. **Device Status Endpoint**: Consider restricting access to network equipment IPs only
2. **MAC Address Validation**: All MAC addresses are validated for proper format
3. **Authentication Required**: All device management operations require valid JWT tokens
4. **Admin Operations**: Device blocking/unblocking requires admin role
5. **Audit Logging**: All device operations are logged for security auditing