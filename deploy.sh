#!/bin/bash
# Deployment script for captive portal

set -e

echo "Captive Portal Deployment Script"
echo "================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root for network configuration"
    exit 1
fi

# Set variables
INSTALL_DIR="/opt/captive-portal"
SERVICE_USER="captive-portal"
PYTHON_BIN="/usr/bin/python3"

echo "Installing system dependencies..."
apt update
apt install -y python3 python3-pip python3-venv iptables nginx

echo "Creating service user..."
useradd -r -s /bin/false $SERVICE_USER || true

echo "Setting up installation directory..."
mkdir -p $INSTALL_DIR
cp -r . $INSTALL_DIR/
chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR

echo "Creating Python virtual environment..."
cd $INSTALL_DIR
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo "Setting up database..."
python3 app.py &
FLASK_PID=$!
sleep 2
kill $FLASK_PID || true

echo "Setting up firewall rules..."
bash scripts/firewall_manager.sh setup

echo "Creating systemd service..."
cat > /etc/systemd/system/captive-portal.service << EOF
[Unit]
Description=Captive Portal Web Application
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
Environment=PATH=$INSTALL_DIR/venv/bin
ExecStart=$INSTALL_DIR/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "Configuring nginx..."
cat > /etc/nginx/sites-available/captive-portal << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Client-MAC \$remote_addr;
    }
}
EOF

# Remove default nginx site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/captive-portal /etc/nginx/sites-enabled/

echo "Starting services..."
systemctl daemon-reload
systemctl enable captive-portal
systemctl start captive-portal
systemctl reload nginx

echo "Setting up iptables redirect rules..."
# Redirect HTTP traffic marked by our captive portal chain to nginx
iptables -t nat -A PREROUTING -m mark --mark 99 -p tcp --dport 80 -j DNAT --to-destination 192.168.1.100:80
iptables -t nat -A PREROUTING -m mark --mark 99 -p tcp --dport 443 -j DNAT --to-destination 192.168.1.100:80

# Save iptables rules
iptables-save > /etc/iptables/rules.v4

echo ""
echo "Deployment completed!"
echo "===================="
echo "Captive portal is now running on port 80"
echo "Service status: systemctl status captive-portal"
echo "Logs: journalctl -u captive-portal -f"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with SMTP settings"
echo "2. Update network equipment to redirect unknown MAC addresses"
echo "3. Test the portal with an unregistered device"
echo ""
echo "Network Configuration Notes:"
echo "- UniFi: Configure guest portal to redirect to this server"
echo "- DHCP: Log MAC addresses for integration"
echo "- Switch: Configure port mirroring if needed for MAC detection"