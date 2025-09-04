#!/usr/bin/env python3
"""
Test all API endpoints after migration
"""
import requests
import json

BASE_URL = "http://localhost:3001"

def test_api(endpoint, description):
    """Test an API endpoint"""
    print(f"\n{'='*60}")
    print(f"Testing: {description}")
    print(f"Endpoint: {endpoint}")
    print('-'*60)
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if 'error' in data:
                    print(f"❌ API Error: {data['error']}")
                else:
                    print("✅ Success")
                    # Show sample data
                    if isinstance(data, dict):
                        keys = list(data.keys())[:5]
                        print(f"Response keys: {keys}")
                        if 'success' in data:
                            print(f"Success: {data['success']}")
                        if 'stats' in data:
                            print(f"Stats: {data['stats']}")
            except json.JSONDecodeError:
                # Not JSON, probably HTML
                if '<html' in response.text[:100].lower():
                    print("✅ HTML page loaded")
                else:
                    print(f"⚠️  Non-JSON response: {response.text[:100]}")
        else:
            print(f"❌ HTTP {response.status_code}")
            if response.text:
                print(f"Error: {response.text[:200]}")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

# Test APIs
test_api("/api/directory/collections", "Collections API")
test_api("/api/directory/services/medical-spas", "Medical Spas Service API")
test_api("/api/directory/services/medical-spas/TX", "Medical Spas Texas API")
test_api("/api/directory/services/medical-spas/TX/austin", "Medical Spas Austin API")
test_api("/api/analyze?city=austin&state=tx&niche=med+spas", "Analyze API")

# Test pages
test_api("/directory", "Directory Page")
test_api("/directory/medical-spas", "Medical Spas Directory Page")
test_api("/directory/medical-spas/tx", "Medical Spas Texas Page")

print("\n" + "="*60)
print("API TESTING COMPLETE")
print("="*60)