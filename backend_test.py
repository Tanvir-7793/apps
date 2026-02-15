#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for Car Detailing Shop
Tests all endpoints with proper authentication and error handling
"""

import requests
import json
import base64
from datetime import datetime, timedelta
import sys

# Configuration
BASE_URL = "https://polish-dashboard.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

# Test counters
total_tests = 0
passed_tests = 0
failed_tests = 0

def log_test(test_name, success, message=""):
    global total_tests, passed_tests, failed_tests
    total_tests += 1
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {test_name}")
    if message:
        print(f"    {message}")
    if success:
        passed_tests += 1
    else:
        failed_tests += 1
        print(f"    Details: {message}")

def make_request(method, endpoint, data=None, headers=None, params=None):
    """Make HTTP request with proper error handling"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params, timeout=15)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=15)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers, timeout=15)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=15)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.exceptions.Timeout:
        print(f"Request timeout for {method} {endpoint}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Request failed for {method} {endpoint}: {e}")
        return None

def get_sample_base64_image():
    """Generate a small base64 encoded test image"""
    # This is a 1x1 pixel transparent PNG
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

def test_authentication():
    """Test authentication endpoints"""
    print("\n=== Testing Authentication ===")
    
    # Test login with correct credentials
    login_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    
    response = make_request("POST", "/auth/login", login_data)
    if response and response.status_code == 200:
        token_data = response.json()
        token = token_data.get("access_token")
        if token:
            log_test("Admin login with correct credentials", True)
            
            # Test token verification
            headers = {"Authorization": f"Bearer {token}"}
            verify_response = make_request("GET", "/auth/verify", headers=headers)
            if verify_response and verify_response.status_code == 200:
                verify_data = verify_response.json()
                if verify_data.get("valid") and verify_data.get("username") == ADMIN_USERNAME:
                    log_test("Token verification", True)
                    return token
                else:
                    log_test("Token verification", False, "Invalid verification response")
            else:
                log_test("Token verification", False, f"Status: {verify_response.status_code if verify_response else 'No response'}")
        else:
            log_test("Admin login with correct credentials", False, "No access token in response")
    else:
        log_test("Admin login with correct credentials", False, f"Status: {response.status_code if response else 'No response'}")
    
    # Test login with wrong credentials
    wrong_login = {
        "username": "wrong",
        "password": "wrong"
    }
    
    wrong_response = make_request("POST", "/auth/login", wrong_login)
    if wrong_response and wrong_response.status_code == 401:
        log_test("Login with wrong credentials (should fail)", True)
    else:
        log_test("Login with wrong credentials (should fail)", False, f"Expected 401, got {wrong_response.status_code if wrong_response else 'No response'}")
    
    return None

def test_services_api(auth_token):
    """Test Services CRUD API"""
    print("\n=== Testing Services API ===")
    headers = {"Authorization": f"Bearer {auth_token}"} if auth_token else {}
    
    # Test getting services (should work without auth)
    response = make_request("GET", "/services")
    if response and response.status_code == 200:
        services = response.json()
        log_test("Get all services (no auth)", True, f"Found {len(services)} services")
    else:
        log_test("Get all services (no auth)", False, f"Status: {response.status_code if response else 'No response'}")
    
    # Test getting enabled services only
    response = make_request("GET", "/services", params={"enabled_only": "true"})
    if response and response.status_code == 200:
        enabled_services = response.json()
        log_test("Get enabled services only", True, f"Found {len(enabled_services)} enabled services")
    else:
        log_test("Get enabled services only", False, f"Status: {response.status_code if response else 'No response'}")
    
    if not auth_token:
        log_test("Services CRUD operations", False, "No auth token available")
        return None
    
    # Test creating a service (needs auth)
    service_data = {
        "name": "Premium Car Wash",
        "description": "Complete exterior and interior cleaning with premium products",
        "price": 49.99,
        "duration": 90,
        "category": "Washing",
        "image_base64": get_sample_base64_image(),
        "enabled": True
    }
    
    response = make_request("POST", "/services", service_data, headers)
    service_id = None
    if response and response.status_code == 200:
        created_service = response.json()
        service_id = created_service.get("id")
        if service_id and created_service.get("name") == service_data["name"]:
            log_test("Create service with auth", True, f"Service ID: {service_id}")
        else:
            log_test("Create service with auth", False, "Invalid response data")
    else:
        log_test("Create service with auth", False, f"Status: {response.status_code if response else 'No response'}")
    
    if service_id:
        # Test updating service
        update_data = {
            "price": 59.99,
            "description": "Updated premium car wash service"
        }
        
        response = make_request("PUT", f"/services/{service_id}", update_data, headers)
        if response and response.status_code == 200:
            updated_service = response.json()
            if updated_service.get("price") == 59.99:
                log_test("Update service", True)
            else:
                log_test("Update service", False, "Price not updated correctly")
        else:
            log_test("Update service", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test toggle service status
        response = make_request("PUT", f"/services/{service_id}/toggle", headers=headers)
        if response and response.status_code == 200:
            toggle_result = response.json()
            if "enabled" in toggle_result:
                log_test("Toggle service status", True, f"New status: {toggle_result['enabled']}")
            else:
                log_test("Toggle service status", False, "No enabled status in response")
        else:
            log_test("Toggle service status", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test deleting service
        response = make_request("DELETE", f"/services/{service_id}", headers=headers)
        if response and response.status_code == 200:
            log_test("Delete service", True)
        else:
            log_test("Delete service", False, f"Status: {response.status_code if response else 'No response'}")
    
    # Test creating service without auth (should fail)
    response = make_request("POST", "/services", service_data)
    if response and response.status_code == 403:
        log_test("Create service without auth (should fail)", True)
    else:
        log_test("Create service without auth (should fail)", False, f"Expected 403, got {response.status_code if response else 'No response'}")

def test_offers_api(auth_token):
    """Test Offers CRUD API"""
    print("\n=== Testing Offers API ===")
    headers = {"Authorization": f"Bearer {auth_token}"} if auth_token else {}
    
    # Test getting offers (should work without auth)
    response = make_request("GET", "/offers")
    if response and response.status_code == 200:
        offers = response.json()
        log_test("Get all offers (no auth)", True, f"Found {len(offers)} offers")
    else:
        log_test("Get all offers (no auth)", False, f"Status: {response.status_code if response else 'No response'}")
    
    # Test getting active offers only
    response = make_request("GET", "/offers", params={"active_only": "true"})
    if response and response.status_code == 200:
        active_offers = response.json()
        log_test("Get active offers only", True, f"Found {len(active_offers)} active offers")
    else:
        log_test("Get active offers only", False, f"Status: {response.status_code if response else 'No response'}")
    
    if not auth_token:
        log_test("Offers CRUD operations", False, "No auth token available")
        return None
    
    # Test creating an offer (needs auth)
    offer_data = {
        "title": "Summer Special",
        "description": "20% off all services during summer months",
        "type": "percentage",
        "value": 20.0,
        "image_base64": get_sample_base64_image(),
        "active": True,
        "valid_until": (datetime.now() + timedelta(days=30)).isoformat()
    }
    
    response = make_request("POST", "/offers", offer_data, headers)
    offer_id = None
    if response and response.status_code == 200:
        created_offer = response.json()
        offer_id = created_offer.get("id")
        if offer_id and created_offer.get("title") == offer_data["title"]:
            log_test("Create offer with auth", True, f"Offer ID: {offer_id}")
        else:
            log_test("Create offer with auth", False, "Invalid response data")
    else:
        log_test("Create offer with auth", False, f"Status: {response.status_code if response else 'No response'}")
    
    if offer_id:
        # Test updating offer
        update_data = {
            "value": 25.0,
            "description": "Updated summer special - 25% off!"
        }
        
        response = make_request("PUT", f"/offers/{offer_id}", update_data, headers)
        if response and response.status_code == 200:
            updated_offer = response.json()
            if updated_offer.get("value") == 25.0:
                log_test("Update offer", True)
            else:
                log_test("Update offer", False, "Value not updated correctly")
        else:
            log_test("Update offer", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test deleting offer
        response = make_request("DELETE", f"/offers/{offer_id}", headers=headers)
        if response and response.status_code == 200:
            log_test("Delete offer", True)
        else:
            log_test("Delete offer", False, f"Status: {response.status_code if response else 'No response'}")

def test_appointments_api(auth_token):
    """Test Appointments API"""
    print("\n=== Testing Appointments API ===")
    headers = {"Authorization": f"Bearer {auth_token}"} if auth_token else {}
    
    # First create a service to use for appointments
    service_data = {
        "name": "Test Service for Appointment",
        "description": "Test service",
        "price": 30.0,
        "duration": 60,
        "enabled": True
    }
    
    service_id = None
    if auth_token:
        response = make_request("POST", "/services", service_data, headers)
        if response and response.status_code == 200:
            service_id = response.json().get("id")
    
    if not service_id:
        log_test("Appointments API", False, "Could not create test service for appointments")
        return
    
    # Test creating appointment (no auth required)
    appointment_data = {
        "customer_name": "Sarah Johnson",
        "phone": "555-0123",
        "email": "sarah.johnson@email.com",
        "service_id": service_id,
        "date": "2024-12-25",
        "time": "10:30",
        "notes": "Please use premium products"
    }
    
    response = make_request("POST", "/appointments", appointment_data)
    appointment_id = None
    if response and response.status_code == 200:
        created_appointment = response.json()
        appointment_id = created_appointment.get("id")
        if appointment_id and created_appointment.get("customer_name") == appointment_data["customer_name"]:
            log_test("Create appointment (no auth required)", True, f"Appointment ID: {appointment_id}")
        else:
            log_test("Create appointment (no auth required)", False, "Invalid response data")
    else:
        log_test("Create appointment (no auth required)", False, f"Status: {response.status_code if response else 'No response'}")
    
    if not auth_token:
        log_test("Get/Update appointments", False, "No auth token available")
        return
    
    # Test getting appointments (requires auth)
    response = make_request("GET", "/appointments", headers=headers)
    if response and response.status_code == 200:
        appointments = response.json()
        log_test("Get all appointments (requires auth)", True, f"Found {len(appointments)} appointments")
    else:
        log_test("Get all appointments (requires auth)", False, f"Status: {response.status_code if response else 'No response'}")
    
    if appointment_id:
        # Test updating appointment status (requires auth)
        update_data = {
            "status": "confirmed"
        }
        
        response = make_request("PUT", f"/appointments/{appointment_id}", update_data, headers)
        if response and response.status_code == 200:
            updated_appointment = response.json()
            if updated_appointment.get("status") == "confirmed":
                log_test("Update appointment status", True)
            else:
                log_test("Update appointment status", False, "Status not updated correctly")
        else:
            log_test("Update appointment status", False, f"Status: {response.status_code if response else 'No response'}")
    
    # Cleanup - delete test service
    if service_id and auth_token:
        make_request("DELETE", f"/services/{service_id}", headers=headers)

def test_gallery_api(auth_token):
    """Test Gallery API"""
    print("\n=== Testing Gallery API ===")
    headers = {"Authorization": f"Bearer {auth_token}"} if auth_token else {}
    
    # Test getting gallery items (should work without auth)
    response = make_request("GET", "/gallery")
    if response and response.status_code == 200:
        gallery_items = response.json()
        log_test("Get all gallery items (no auth)", True, f"Found {len(gallery_items)} gallery items")
    else:
        log_test("Get all gallery items (no auth)", False, f"Status: {response.status_code if response else 'No response'}")
    
    if not auth_token:
        log_test("Gallery CRUD operations", False, "No auth token available")
        return None
    
    # Test creating gallery item (needs auth)
    gallery_data = {
        "image_base64": get_sample_base64_image(),
        "description": "Beautiful car after detailing service"
    }
    
    response = make_request("POST", "/gallery", gallery_data, headers)
    gallery_id = None
    if response and response.status_code == 200:
        created_item = response.json()
        gallery_id = created_item.get("id")
        if gallery_id and created_item.get("description") == gallery_data["description"]:
            log_test("Create gallery item with auth", True, f"Gallery ID: {gallery_id}")
        else:
            log_test("Create gallery item with auth", False, "Invalid response data")
    else:
        log_test("Create gallery item with auth", False, f"Status: {response.status_code if response else 'No response'}")
    
    if gallery_id:
        # Test deleting gallery item
        response = make_request("DELETE", f"/gallery/{gallery_id}", headers=headers)
        if response and response.status_code == 200:
            log_test("Delete gallery item", True)
        else:
            log_test("Delete gallery item", False, f"Status: {response.status_code if response else 'No response'}")
    
    # Test creating gallery item without auth (should fail)
    response = make_request("POST", "/gallery", gallery_data)
    if response and response.status_code == 403:
        log_test("Create gallery item without auth (should fail)", True)
    else:
        log_test("Create gallery item without auth (should fail)", False, f"Expected 403, got {response.status_code if response else 'No response'}")

def test_contact_api(auth_token):
    """Test Contact API"""
    print("\n=== Testing Contact API ===")
    headers = {"Authorization": f"Bearer {auth_token}"} if auth_token else {}
    
    # Test submitting contact form (no auth required)
    contact_data = {
        "name": "Michael Brown",
        "email": "michael.brown@email.com",
        "phone": "555-0456",
        "message": "I would like to schedule a full detailing service for my BMW. What are your availability options?"
    }
    
    response = make_request("POST", "/contact", contact_data)
    contact_id = None
    if response and response.status_code == 200:
        created_contact = response.json()
        contact_id = created_contact.get("id")
        if contact_id and created_contact.get("name") == contact_data["name"]:
            log_test("Submit contact form (no auth required)", True, f"Contact ID: {contact_id}")
        else:
            log_test("Submit contact form (no auth required)", False, "Invalid response data")
    else:
        log_test("Submit contact form (no auth required)", False, f"Status: {response.status_code if response else 'No response'}")
    
    if not auth_token:
        log_test("Get contact submissions", False, "No auth token available")
        return
    
    # Test getting contact submissions (requires auth)
    response = make_request("GET", "/contact", headers=headers)
    if response and response.status_code == 200:
        contacts = response.json()
        log_test("Get all contact submissions (requires auth)", True, f"Found {len(contacts)} contact submissions")
    else:
        log_test("Get all contact submissions (requires auth)", False, f"Status: {response.status_code if response else 'No response'}")
    
    # Test getting contact submissions without auth (should fail)
    response = make_request("GET", "/contact")
    if response and response.status_code == 403:
        log_test("Get contacts without auth (should fail)", True)
    else:
        log_test("Get contacts without auth (should fail)", False, f"Expected 403, got {response.status_code if response else 'No response'}")

def main():
    """Run all backend API tests"""
    print("🚗 Car Detailing Shop - Backend API Test Suite")
    print("=" * 50)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin Credentials: {ADMIN_USERNAME}/{ADMIN_PASSWORD}")
    
    # Test authentication first
    auth_token = test_authentication()
    
    # Test all other APIs
    test_services_api(auth_token)
    test_offers_api(auth_token)
    test_appointments_api(auth_token)
    test_gallery_api(auth_token)
    test_contact_api(auth_token)
    
    # Print final summary
    print("\n" + "=" * 50)
    print("🏁 TEST SUMMARY")
    print("=" * 50)
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests} ✅")
    print(f"Failed: {failed_tests} ❌")
    
    if failed_tests == 0:
        print("\n🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {failed_tests} tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)