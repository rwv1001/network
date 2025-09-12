#!/usr/bin/env python3
"""
Test script for captive portal functionality
"""
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

def test_main_page():
    """Test that the main page loads"""
    try:
        response = requests.get(BASE_URL)
        assert response.status_code == 200
        assert "Welcome to Our Network" in response.text
        print("✓ Main page loads successfully")
        return True
    except Exception as e:
        print(f"✗ Main page test failed: {e}")
        return False

def test_api_endpoint():
    """Test the API endpoint"""
    try:
        mac_address = "00:11:22:33:44:55"
        response = requests.get(f"{BASE_URL}/api/user/{mac_address}")
        assert response.status_code == 200
        data = response.json()
        assert "registered" in data
        assert "verified" in data
        print("✓ API endpoint works correctly")
        return True
    except Exception as e:
        print(f"✗ API endpoint test failed: {e}")
        return False

def test_registration():
    """Test user registration (without email sending)"""
    try:
        # This would normally require SMTP setup, so we'll just check the endpoint exists
        response = requests.post(f"{BASE_URL}/register", data={
            "name": "Test User",
            "email": "test@example.com"
        }, allow_redirects=False)
        
        # Should redirect after registration attempt
        assert response.status_code in [302, 200]
        print("✓ Registration endpoint accessible")
        return True
    except Exception as e:
        print(f"✗ Registration test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing Captive Portal Application")
    print("==================================")
    
    tests = [
        test_main_page,
        test_api_endpoint,
        test_registration
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("All tests passed! 🎉")
        return 0
    else:
        print("Some tests failed. Check the application.")
        return 1

if __name__ == "__main__":
    sys.exit(main())