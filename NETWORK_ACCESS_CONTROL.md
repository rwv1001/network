# Network Access Control (NAC) - MAC Address Blocking

This document explains how network access control works with MAC address blocking, firewall rules, and VLAN-based access control for unregistered devices in the context of the Network Identity Manager system.

## Overview

Network Access Control (NAC) is a security approach that validates devices before granting network access. The system can identify devices by their MAC addresses and apply different access policies based on registration status.

## MAC Address Blocking Mechanisms

### 1. Device Registration Process

When a device connects to the network:

1. **MAC Address Detection**: The network switch or wireless access point detects the device's MAC address
2. **Database Lookup**: The system queries the identity management database to check if the MAC address is registered
3. **Access Decision**: Based on registration status, the device is either:
   - Granted full network access (registered devices)
   - Placed in a restricted VLAN (unregistered devices)
   - Completely blocked (blacklisted devices)

### 2. Registration States

```
┌─────────────────┬─────────────────┬─────────────────────────────────┐
│ Registration    │ Network Access  │ Description                     │
│ Status          │ Level           │                                 │
├─────────────────┼─────────────────┼─────────────────────────────────┤
│ Registered      │ Full Access     │ Device in user database with   │
│                 │                 │ valid user association          │
├─────────────────┼─────────────────┼─────────────────────────────────┤
│ Unregistered    │ Limited Access  │ Unknown MAC address, placed     │
│                 │                 │ in guest/quarantine VLAN       │
├─────────────────┼─────────────────┼─────────────────────────────────┤
│ Blacklisted     │ No Access       │ Explicitly blocked MAC address  │
└─────────────────┴─────────────────┴─────────────────────────────────┘
```

## Firewall Rules Configuration

### 1. Registered Device Rules

For registered devices with authenticated users:

```bash
# Allow full internet access
iptables -A FORWARD -m mac --mac-source [REGISTERED_MAC] -j ACCEPT

# Allow access to internal services
iptables -A FORWARD -s [INTERNAL_NETWORK] -m mac --mac-source [REGISTERED_MAC] -j ACCEPT
```

### 2. Unregistered Device Rules

For unregistered MAC addresses, firewall rules restrict access:

```bash
# Block access to internal networks
iptables -A FORWARD -s [GUEST_VLAN_NETWORK] -d [INTERNAL_NETWORK] -j DROP

# Allow only registration portal access
iptables -A FORWARD -s [GUEST_VLAN_NETWORK] -d [REGISTRATION_SERVER] -p tcp --dport 80,443 -j ACCEPT

# Allow DNS for registration process
iptables -A FORWARD -s [GUEST_VLAN_NETWORK] -p udp --dport 53 -j ACCEPT

# Allow limited internet access (optional)
iptables -A FORWARD -s [GUEST_VLAN_NETWORK] -d [INTERNET] -p tcp --dport 80,443 -j ACCEPT

# Default deny for guest VLAN
iptables -A FORWARD -s [GUEST_VLAN_NETWORK] -j DROP
```

### 3. Blacklisted Device Rules

```bash
# Completely block blacklisted MAC addresses
iptables -A FORWARD -m mac --mac-source [BLACKLISTED_MAC] -j DROP
iptables -A INPUT -m mac --mac-source [BLACKLISTED_MAC] -j DROP
```

## VLAN-Based Access Control

### 1. VLAN Configuration

Unregistered devices are automatically placed in a restricted VLAN:

**Switch Configuration Example (Cisco):**
```
! Default VLAN for unregistered devices
vlan 100
 name GUEST_QUARANTINE
 
! Production VLAN for registered devices  
vlan 200
 name PRODUCTION

! Configure port for dynamic VLAN assignment
interface fastethernet0/1
 switchport mode access
 switchport access vlan 100
 dot1x port-control auto
 dot1x host-mode single-host
```

### 2. VLAN Network Segmentation

```
┌─────────────────────────────────────────────────────────────────┐
│                    Network Segmentation                         │
├─────────────────────────────────────────────────────────────────┤
│ VLAN 200 (Production): 192.168.200.0/24                       │
│ ├─ Registered devices with authenticated users                  │
│ ├─ Full access to internal resources                           │
│ └─ Standard internet access                                    │
│                                                                 │
│ VLAN 100 (Guest/Quarantine): 192.168.100.0/24                │
│ ├─ Unregistered MAC addresses                                  │
│ ├─ Limited internet access                                     │
│ ├─ Access only to registration portal                          │
│ └─ No access to internal networks                              │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation with Network Identity Manager

### 1. Database Schema Extension

To support MAC address tracking, extend the User model:

```javascript
// Additional fields for User model
const userSchema = new mongoose.Schema({
  // ... existing fields ...
  
  registeredDevices: [{
    macAddress: {
      type: String,
      required: true,
      match: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
    },
    deviceName: String,
    deviceType: String,
    registeredAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: Date,
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active'
    }
  }]
});
```

### 2. MAC Address Registration API

```javascript
// POST /api/devices/register
{
  "macAddress": "aa:bb:cc:dd:ee:ff",
  "deviceName": "John's Laptop",
  "deviceType": "laptop"
}

// GET /api/devices/status/:macAddress
{
  "macAddress": "aa:bb:cc:dd:ee:ff",
  "registered": true,
  "user": "user@example.com",
  "vlan": "production",
  "accessLevel": "full"
}
```

### 3. Network Integration Points

1. **RADIUS Authentication**: Integrate with RADIUS server for 802.1X authentication
2. **DHCP Integration**: Custom DHCP server that assigns VLANs based on MAC registration
3. **Switch Integration**: SNMP or REST API integration with network switches
4. **Firewall Integration**: Dynamic firewall rule updates via API

## Security Considerations

### 1. MAC Address Spoofing

- **Risk**: MAC addresses can be spoofed
- **Mitigation**: 
  - Combine with 802.1X certificate-based authentication
  - Monitor for duplicate MAC addresses
  - Implement device fingerprinting

### 2. VLAN Hopping

- **Risk**: Attackers might attempt to escape guest VLAN
- **Mitigation**:
  - Proper VLAN configuration on switches
  - Inter-VLAN routing restrictions
  - Regular security audits

### 3. Registration Portal Security

- **Risk**: Unauthorized device registration
- **Mitigation**:
  - User authentication required for device registration
  - Admin approval for new device registrations
  - Rate limiting on registration attempts

## Configuration Examples

### 1. pfSense Firewall Rules

```
# Guest VLAN Rules
pass in quick on $guest_if inet proto tcp from $guest_net to $registration_server port 443
pass in quick on $guest_if inet proto udp from $guest_net to any port 53
block in quick on $guest_if from $guest_net to $internal_net
pass in on $guest_if inet from $guest_net to any

# Production VLAN Rules  
pass in on $prod_if from $prod_net to any
```

### 2. FreeRADIUS Integration

```
# users file
DEFAULT Auth-Type := Reject
        Fall-Through = No

# MAC address based authentication
aa:bb:cc:dd:ee:ff Cleartext-Password := "device-password"
        Tunnel-Type = VLAN,
        Tunnel-Medium-Type = IEEE-802,
        Tunnel-Private-Group-Id = "200"

# Unknown devices go to guest VLAN
DEFAULT Auth-Type := Accept
        Tunnel-Type = VLAN,
        Tunnel-Medium-Type = IEEE-802,
        Tunnel-Private-Group-Id = "100"
```

## Monitoring and Logging

### 1. Network Access Events

```javascript
// Log structure for network access events
{
  "timestamp": "2024-01-15T10:30:00Z",
  "event_type": "device_connection",
  "mac_address": "aa:bb:cc:dd:ee:ff",
  "ip_address": "192.168.100.150",
  "vlan": "guest",
  "switch_port": "Fa0/24",
  "registration_status": "unregistered",
  "action_taken": "quarantine"
}
```

### 2. Dashboard Metrics

- **Registered vs Unregistered Devices**: Real-time count
- **VLAN Utilization**: Number of devices per VLAN
- **Registration Conversion Rate**: Percentage of guest devices that register
- **Security Events**: Failed authentication attempts, MAC spoofing detection

## Integration Workflow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Device        │    │   Network       │    │   Identity      │
│   Connects      │───▶│   Switch        │───▶│   Manager       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │                        │
                               ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   MAC Address   │    │   Database      │
                       │   Detection     │    │   Lookup        │
                       └─────────────────┘    └─────────────────┘
                               │                        │
                               ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   VLAN          │    │   Firewall      │
                       │   Assignment    │    │   Rules         │
                       └─────────────────┘    └─────────────────┘
```

This comprehensive approach ensures that unregistered devices are properly isolated while providing a clear path for legitimate users to register their devices and gain full network access.