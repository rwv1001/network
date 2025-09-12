#!/bin/bash
# Firewall management script for captive portal
# This script manages iptables rules for MAC-based access control

CAPTIVE_CHAIN="CAPTIVE_PORTAL"
VERIFIED_CHAIN="VERIFIED_USERS"
IPTABLES="/sbin/iptables"

# Create captive portal chains if they don't exist
setup_chains() {
    echo "Setting up captive portal iptables chains..."
    
    # Create custom chains
    $IPTABLES -t mangle -N $CAPTIVE_CHAIN 2>/dev/null || true
    $IPTABLES -t mangle -N $VERIFIED_CHAIN 2>/dev/null || true
    
    # Clear existing rules in our chains
    $IPTABLES -t mangle -F $CAPTIVE_CHAIN
    $IPTABLES -t mangle -F $VERIFIED_CHAIN
    
    # Add our chains to the PREROUTING chain
    $IPTABLES -t mangle -C PREROUTING -j $CAPTIVE_CHAIN 2>/dev/null || \
        $IPTABLES -t mangle -I PREROUTING -j $CAPTIVE_CHAIN
    
    # Allow DNS and DHCP for all users
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -p udp --dport 53 -j ACCEPT
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -p udp --dport 67:68 -j ACCEPT
    
    # Allow access to captive portal web server
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -p tcp --dport 80 -j ACCEPT
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -p tcp --dport 443 -j ACCEPT
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -p tcp --dport 5000 -j ACCEPT
    
    # Allow email access (SMTP, IMAP, POP3) for unverified users
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -p tcp --dport 25 -j ACCEPT
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -p tcp --dport 465 -j ACCEPT
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -p tcp --dport 587 -j ACCEPT
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -p tcp --dport 993 -j ACCEPT
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -p tcp --dport 995 -j ACCEPT
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -p tcp --dport 143 -j ACCEPT
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -p tcp --dport 110 -j ACCEPT
    
    # Jump to verified users chain
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -j $VERIFIED_CHAIN
    
    # Mark all other traffic for captive portal redirect
    $IPTABLES -t mangle -A $CAPTIVE_CHAIN -j MARK --set-mark 99
    
    echo "Captive portal chains setup complete."
}

# Add a verified MAC address
add_verified_mac() {
    local mac_address="$1"
    if [ -z "$mac_address" ]; then
        echo "Usage: $0 add_verified_mac <MAC_ADDRESS>"
        exit 1
    fi
    
    echo "Adding verified MAC address: $mac_address"
    $IPTABLES -t mangle -I $VERIFIED_CHAIN -m mac --mac-source "$mac_address" -j ACCEPT
    echo "MAC address $mac_address granted full internet access."
}

# Remove a verified MAC address
remove_verified_mac() {
    local mac_address="$1"
    if [ -z "$mac_address" ]; then
        echo "Usage: $0 remove_verified_mac <MAC_ADDRESS>"
        exit 1
    fi
    
    echo "Removing verified MAC address: $mac_address"
    $IPTABLES -t mangle -D $VERIFIED_CHAIN -m mac --mac-source "$mac_address" -j ACCEPT 2>/dev/null || \
        echo "MAC address $mac_address was not found in verified list."
}

# List all verified MAC addresses
list_verified_macs() {
    echo "Currently verified MAC addresses:"
    $IPTABLES -t mangle -L $VERIFIED_CHAIN -n | grep "MAC" | awk '{print $7}' | sed 's/MAC//'
}

# Remove all captive portal rules
cleanup() {
    echo "Cleaning up captive portal rules..."
    $IPTABLES -t mangle -D PREROUTING -j $CAPTIVE_CHAIN 2>/dev/null || true
    $IPTABLES -t mangle -F $CAPTIVE_CHAIN 2>/dev/null || true
    $IPTABLES -t mangle -X $CAPTIVE_CHAIN 2>/dev/null || true
    $IPTABLES -t mangle -F $VERIFIED_CHAIN 2>/dev/null || true
    $IPTABLES -t mangle -X $VERIFIED_CHAIN 2>/dev/null || true
    echo "Cleanup complete."
}

# Show help
show_help() {
    cat << EOF
Captive Portal Firewall Management Script

Usage: $0 <command> [arguments]

Commands:
    setup                   - Initialize captive portal iptables chains
    add_verified_mac <MAC>  - Add a MAC address to verified users
    remove_verified_mac <MAC> - Remove a MAC address from verified users
    list_verified_macs      - List all verified MAC addresses
    cleanup                 - Remove all captive portal rules
    help                    - Show this help message

Examples:
    $0 setup
    $0 add_verified_mac 00:11:22:33:44:55
    $0 remove_verified_mac 00:11:22:33:44:55
    $0 list_verified_macs
    $0 cleanup

Note: This script requires root privileges to modify iptables rules.
EOF
}

# Main command handling
case "$1" in
    setup)
        setup_chains
        ;;
    add_verified_mac)
        add_verified_mac "$2"
        ;;
    remove_verified_mac)
        remove_verified_mac "$2"
        ;;
    list_verified_macs)
        list_verified_macs
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Invalid command. Use '$0 help' for usage information."
        exit 1
        ;;
esac