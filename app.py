#!/usr/bin/env python3
"""
Captive Portal Application
Handles user registration and email verification for network access
"""
import os
import smtplib
import secrets
import sqlite3
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, render_template, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from email_validator import validate_email, EmailNotValidError

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(16))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///captive_portal.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email configuration
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'localhost')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'noreply@captiveportal.local')

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mac_address = db.Column(db.String(17), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    verification_token = db.Column(db.String(32), nullable=True)
    verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    verified_at = db.Column(db.DateTime, nullable=True)

def get_client_mac():
    """Extract MAC address from client request"""
    # In a real deployment, this would come from DHCP logs or network monitoring
    # For now, we'll use a placeholder that can be overridden
    return request.headers.get('X-Client-MAC', request.environ.get('REMOTE_ADDR', '00:00:00:00:00:00'))

def send_verification_email(user):
    """Send verification email to user"""
    try:
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = user.email
        msg['Subject'] = "Network Access Verification"
        
        verification_url = url_for('verify_email', token=user.verification_token, _external=True)
        
        body = f"""
        Hello {user.name},
        
        Welcome to our network! To complete your registration and gain full internet access, 
        please click the verification link below:
        
        {verification_url}
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        Network Admin
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        if SMTP_USERNAME:
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
        else:
            # For testing without SMTP credentials
            print(f"Would send email to {user.email} with verification URL: {verification_url}")
            
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

@app.route('/')
def index():
    """Main captive portal page"""
    mac_address = get_client_mac()
    
    # Check if MAC address is already registered and verified
    user = User.query.filter_by(mac_address=mac_address).first()
    
    if user and user.verified:
        return render_template('success.html', user=user)
    elif user and not user.verified:
        return render_template('pending_verification.html', user=user)
    else:
        return render_template('register.html')

@app.route('/register', methods=['POST'])
def register():
    """Handle user registration"""
    name = request.form.get('name', '').strip()
    email = request.form.get('email', '').strip()
    mac_address = get_client_mac()
    
    if not name or not email:
        flash('Name and email are required')
        return redirect(url_for('index'))
    
    # Validate email format
    try:
        validate_email(email)
    except EmailNotValidError:
        flash('Please enter a valid email address')
        return redirect(url_for('index'))
    
    # Check if MAC address is already registered
    existing_user = User.query.filter_by(mac_address=mac_address).first()
    if existing_user:
        flash('This device is already registered')
        return redirect(url_for('index'))
    
    # Create new user
    verification_token = secrets.token_urlsafe(32)
    user = User(
        mac_address=mac_address,
        name=name,
        email=email,
        verification_token=verification_token
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Send verification email
    if send_verification_email(user):
        flash('Registration successful! Please check your email for verification.')
    else:
        flash('Registration successful, but failed to send verification email. Please contact admin.')
    
    return redirect(url_for('index'))

@app.route('/verify/<token>')
def verify_email(token):
    """Handle email verification"""
    user = User.query.filter_by(verification_token=token).first()
    
    if not user:
        return render_template('error.html', message='Invalid verification token')
    
    if user.verified:
        return render_template('success.html', user=user, message='Already verified')
    
    # Verify the user
    user.verified = True
    user.verified_at = datetime.utcnow()
    db.session.commit()
    
    # Here you would typically update firewall rules to allow full access
    update_firewall_rules(user.mac_address, allow=True)
    
    return render_template('success.html', user=user, message='Email verified successfully!')

@app.route('/api/user/<mac_address>')
def get_user_status(mac_address):
    """API endpoint to check user verification status"""
    user = User.query.filter_by(mac_address=mac_address).first()
    
    if not user:
        return jsonify({'registered': False, 'verified': False})
    
    return jsonify({
        'registered': True,
        'verified': user.verified,
        'name': user.name,
        'email': user.email,
        'created_at': user.created_at.isoformat(),
        'verified_at': user.verified_at.isoformat() if user.verified_at else None
    })

def update_firewall_rules(mac_address, allow=True):
    """Update firewall rules for a MAC address"""
    try:
        import subprocess
        import os
        
        script_path = os.path.join(os.path.dirname(__file__), 'scripts', 'network_integration.py')
        
        if allow:
            cmd = ['python3', script_path, 'grant_access', mac_address]
            action = "GRANTED"
        else:
            cmd = ['python3', script_path, 'revoke_access', mac_address]
            action = "REVOKED"
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"Firewall rule update: {action} full internet access for MAC {mac_address}")
            return True
        else:
            print(f"Failed to update firewall rules for MAC {mac_address}: {result.stderr}")
            return False
    except Exception as e:
        print(f"Error updating firewall rules for MAC {mac_address}: {e}")
        return False

def create_tables():
    """Create database tables"""
    with app.app_context():
        db.create_all()

if __name__ == '__main__':
    create_tables()
    app.run(debug=True, host='0.0.0.0', port=5000)