# Captive Portal Network Solution

A complete captive portal solution that allows passwordless WiFi/Ethernet access but requires email verification for unknown MAC addresses. Users receive limited access (email only) until they verify their email address.

## Features

- **Passwordless Network Access**: Users can connect to WiFi/Ethernet without entering a password
- **MAC Address Detection**: System tracks device MAC addresses for access control
- **Email Verification**: New devices must provide name/email and verify via email link
- **Limited Access**: Unverified users can only access email services until verification
- **Full Access After Verification**: Verified users get unrestricted internet access
- **Web-based Portal**: Clean, responsive web interface for registration
- **Firewall Integration**: Automatic iptables rule management for access control

## Architecture

### Components

1. **Web Application** (`app.py`): Flask-based captive portal
2. **Database**: SQLite database for user and MAC address management
3. **Firewall Management** (`scripts/`): iptables integration for access control
4. **Email Service**: SMTP integration for verification emails
5. **Network Configuration**: Scripts for deployment and integration

### Technology Stack

- Python 3.x with Flask web framework
- SQLite database for user management
- iptables for firewall rule management
- SMTP for email verification
- nginx for web server (production)
- systemd for service management

## Installation

### Prerequisites

- Ubuntu Server (recommended)
- Python 3.x
- Root access for network configuration
- SMTP server for email sending

### Quick Deployment

1. **Clone and deploy**:
   ```bash
   git clone <repository-url>
   cd network
   sudo ./deploy.sh
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your SMTP settings
   ```

3. **Test the service**:
   ```bash
   systemctl status captive-portal
   curl http://localhost
   ```

### Manual Installation

1. **Install dependencies**:
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip python3-venv iptables nginx
   ```

2. **Setup application**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Initialize database**:
   ```bash
   python3 app.py
   # Ctrl+C after startup to create database
   ```

4. **Setup firewall**:
   ```bash
   sudo bash scripts/firewall_manager.sh setup
   ```

## Configuration

### Environment Variables

Create a `.env` file with your settings:

```bash
# Flask Configuration
SECRET_KEY=your-secret-key-here
DEBUG=False

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@yourcompany.com

# Network Configuration
CAPTIVE_PORTAL_URL=http://192.168.1.100:5000
```

### Network Hardware Configuration

#### UniFi Access Points
1. Configure Guest Portal in UniFi Controller
2. Set redirect URL to your captive portal server
3. Enable MAC address logging

#### HP5130 Switch Configuration
```
# Configure port mirroring for MAC detection (if needed)
interface range GigabitEthernet1/0/1 to GigabitEthernet1/0/24
port-security enable
port-security mac-address sticky
```

#### Ubuntu Server (Gateway)
1. Enable IP forwarding: `echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf`
2. Configure DHCP to log MAC addresses
3. Set up NAT for internet access

## Usage

### User Workflow

1. User connects to WiFi/Ethernet (no password required)
2. User opens web browser → automatically redirected to portal
3. If MAC address unknown → registration page shown
4. User enters name and email → verification email sent
5. User has limited access (email only) until verification
6. User clicks verification link in email → full access granted

### Administrator Tasks

**View registered users**:
```bash
# Check database
sqlite3 captive_portal.db "SELECT * FROM user;"

# Check firewall rules
sudo bash scripts/firewall_manager.sh list_verified_macs
```

**Manually grant/revoke access**:
```bash
# Grant access
sudo python3 scripts/network_integration.py grant_access 00:11:22:33:44:55

# Revoke access
sudo python3 scripts/network_integration.py revoke_access 00:11:22:33:44:55
```

**Monitor service**:
```bash
# Service status
systemctl status captive-portal

# View logs
journalctl -u captive-portal -f

# Restart service
systemctl restart captive-portal
```

## API Endpoints

### Web Interface
- `GET /` - Main portal page (registration/status)
- `POST /register` - Handle user registration
- `GET /verify/<token>` - Email verification endpoint

### API
- `GET /api/user/<mac_address>` - Check user verification status

## Firewall Rules

The system creates custom iptables chains for access control:

### Default Access (All Users)
- DNS (port 53)
- DHCP (ports 67-68)
- Captive portal web server (ports 80, 443, 5000)
- Email services (ports 25, 465, 587, 993, 995, 143, 110)

### Full Access (Verified Users)
- All internet traffic allowed for verified MAC addresses

### Traffic Flow
1. All traffic goes through `CAPTIVE_PORTAL` chain
2. Verified MACs get full access via `VERIFIED_USERS` chain
3. Unverified traffic marked for redirect to portal

## Troubleshooting

### Common Issues

**Portal not redirecting users**:
- Check nginx configuration: `nginx -t`
- Verify iptables rules: `iptables -t mangle -L CAPTIVE_PORTAL`
- Check network equipment redirect settings

**Email verification not working**:
- Test SMTP settings: `python3 -c "import smtplib; ..."`
- Check email logs in application
- Verify firewall allows email ports

**Database issues**:
- Check file permissions: `ls -la captive_portal.db`
- Verify SQLite installation: `sqlite3 --version`

**Service not starting**:
- Check logs: `journalctl -u captive-portal`
- Verify Python dependencies: `pip list`
- Test manual startup: `python3 app.py`

### Logs and Monitoring

**Application logs**:
```bash
journalctl -u captive-portal -f
```

**Nginx logs**:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

**Firewall activity**:
```bash
# Monitor iptables hits
watch 'iptables -t mangle -L CAPTIVE_PORTAL -v'
```

## Security Considerations

- Use HTTPS in production (configure SSL certificates)
- Secure SMTP credentials (use app passwords, not account passwords)
- Regular database backups
- Monitor for abuse/spam registrations
- Consider rate limiting for registration attempts
- Keep system updated

## Network Integration Examples

This solution integrates with your existing hardware:

- **DMP**: Configure to use this server as captive portal
- **UniFi APs**: Set guest portal redirect URL
- **Ubuntu Servers**: Deploy portal application and firewall rules
- **HP5130 Switch**: Configure for MAC address monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
