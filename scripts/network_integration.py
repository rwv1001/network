#!/usr/bin/env python3
"""
Network Integration Script
Provides integration with the captive portal firewall management
"""
import subprocess
import sys
import os

FIREWALL_SCRIPT = os.path.join(os.path.dirname(__file__), 'firewall_manager.sh')

def run_firewall_command(command, mac_address=None):
    """Run firewall management command"""
    try:
        cmd = ['sudo', 'bash', FIREWALL_SCRIPT, command]
        if mac_address:
            cmd.append(mac_address)
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr
    except Exception as e:
        return False, str(e)

def grant_access(mac_address):
    """Grant full internet access to a MAC address"""
    success, output = run_firewall_command('add_verified_mac', mac_address)
    if success:
        print(f"Access granted to MAC: {mac_address}")
    else:
        print(f"Failed to grant access to MAC {mac_address}: {output}")
    return success

def revoke_access(mac_address):
    """Revoke internet access from a MAC address"""
    success, output = run_firewall_command('remove_verified_mac', mac_address)
    if success:
        print(f"Access revoked from MAC: {mac_address}")
    else:
        print(f"Failed to revoke access from MAC {mac_address}: {output}")
    return success

def list_verified_devices():
    """List all devices with verified access"""
    success, output = run_firewall_command('list_verified_macs')
    if success:
        return output.strip().split('\n')[1:]  # Skip header line
    return []

def setup_firewall():
    """Initialize the captive portal firewall"""
    success, output = run_firewall_command('setup')
    if success:
        print("Firewall setup completed successfully")
    else:
        print(f"Failed to setup firewall: {output}")
    return success

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 network_integration.py <command> [mac_address]")
        print("Commands: grant_access, revoke_access, list_verified, setup")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'grant_access':
        if len(sys.argv) != 3:
            print("Usage: python3 network_integration.py grant_access <MAC_ADDRESS>")
            sys.exit(1)
        grant_access(sys.argv[2])
    
    elif command == 'revoke_access':
        if len(sys.argv) != 3:
            print("Usage: python3 network_integration.py revoke_access <MAC_ADDRESS>")
            sys.exit(1)
        revoke_access(sys.argv[2])
    
    elif command == 'list_verified':
        devices = list_verified_devices()
        print("Verified devices:")
        for device in devices:
            if device.strip():
                print(f"  {device}")
    
    elif command == 'setup':
        setup_firewall()
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)