"""
Test script to verify Cloudbeds API calls are working correctly.

Usage:
    python test_api.py YOUR_BEARER_TOKEN YOUR_PROPERTY_ID

Example:
    python test_api.py abc123xyz456 6000
"""

import requests
import sys

API_BASE_URL = "https://api.cloudbeds.com/api/v1.3"

def test_get_room_types(bearer_token, property_id):
    """Test getRoomTypes endpoint"""
    print("\n" + "="*60)
    print("TEST 1: getRoomTypes")
    print("="*60)
    
    url = f"{API_BASE_URL}/getRoomTypes"
    params = {'propertyID': property_id}
    headers = {
        'Authorization': f'Bearer {bearer_token}',
        'Content-Type': 'application/json'
    }
    
    print(f"URL: {url}")
    print(f"Params: {params}")
    print(f"Headers: Authorization: Bearer {bearer_token[:10]}...{bearer_token[-10:]}")
    
    response = requests.get(url, headers=headers, params=params)
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            room_types = data.get('data', [])
            print(f"\n✅ SUCCESS: Found {len(room_types)} room types")
            if room_types:
                print("\nFirst 3 room types:")
                for rt in room_types[:3]:
                    print(f"  - {rt.get('roomTypeName')} (ID: {rt.get('roomTypeID')})")
            return room_types
        else:
            print(f"\n❌ API returned success=false")
    else:
        print(f"\n❌ HTTP Error: {response.status_code}")
    
    return []

def test_get_rate(bearer_token, property_id, room_type_id, date):
    """Test getRate endpoint"""
    print("\n" + "="*60)
    print("TEST 2: getRate")
    print("="*60)
    
    url = f"{API_BASE_URL}/getRate"
    
    # API requires endDate to be greater than startDate
    from datetime import datetime, timedelta
    date_obj = datetime.strptime(date, '%Y-%m-%d')
    end_date_obj = date_obj + timedelta(days=1)
    end_date = end_date_obj.strftime('%Y-%m-%d')
    
    params = {
        'propertyID': property_id,
        'roomTypeID': room_type_id,
        'startDate': date,
        'endDate': end_date  # Next day
    }
    headers = {
        'Authorization': f'Bearer {bearer_token}',
        'Content-Type': 'application/json'
    }
    
    print(f"URL: {url}")
    print(f"Params: {params}")
    
    # Construct full URL for easy copy-paste
    full_url = f"{url}?propertyID={property_id}&roomTypeID={room_type_id}&startDate={date}&endDate={end_date}"
    print(f"\nFull URL (for Postman): {full_url}")
    
    response = requests.get(url, headers=headers, params=params)
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            rates_data = data.get('data', {})
            
            # API can return data as dict or list depending on the query
            if isinstance(rates_data, dict):
                # Single rate object
                print(f"\n✅ SUCCESS: Found rate data")
                print(f"\nRate details:")
                print(f"  - Room Rate: ${rates_data.get('roomRate', 'N/A')}")
                print(f"  - Total Rate: ${rates_data.get('totalRate', 'N/A')}")
                print(f"  - Rooms Available: {rates_data.get('roomsAvailable', 'N/A')}")
                print(f"  - Rate ID: {rates_data.get('rateID', 'N/A')}")
                return rates_data
            elif isinstance(rates_data, list) and rates_data:
                # Array of rates
                rate = rates_data[0]
                print(f"\n✅ SUCCESS: Found {len(rates_data)} rate(s)")
                print(f"\nRate details:")
                print(f"  - Rate: ${rate.get('rate', rate.get('roomRate', 'N/A'))}")
                print(f"  - Extra Person: ${rate.get('extraPersonRate', 'N/A')}")
                print(f"  - Max Guests: {rate.get('maxGuests', 'N/A')}")
                return rate
            else:
                print(f"\n❌ No rate data found")
                return None
        else:
            print(f"\n❌ API returned success=false")
            print(f"Message: {data.get('message', 'No message')}")
    else:
        print(f"\n❌ HTTP Error: {response.status_code}")
    
    return None

def test_put_rate(bearer_token, property_id, room_type_id, date, rate_data):
    """Test putRate endpoint"""
    print("\n" + "="*60)
    print("TEST 3: putRate")
    print("="*60)
    
    url = f"{API_BASE_URL}/putRate"
    
    # Handle both field name formats
    rate_amount = rate_data.get('rate') or rate_data.get('roomRate') or rate_data.get('totalRate') or 100.00
    
    payload = {
        'propertyID': property_id,
        'roomTypeID': room_type_id,
        'startDate': date,
        'endDate': date,
        'rate': float(rate_amount)
    }
    headers = {
        'Authorization': f'Bearer {bearer_token}',
        'Content-Type': 'application/json'
    }
    
    print(f"URL: {url}")
    print(f"Payload: {payload}")
    print(f"\n⚠️  WARNING: This will modify rates in your PMS!")
    print("Type 'yes' to proceed, or anything else to skip: ", end='')
    
    confirm = input().strip().lower()
    if confirm != 'yes':
        print("Skipped putRate test")
        return None
    
    response = requests.post(url, headers=headers, json=payload)
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print(f"\n✅ SUCCESS: Rate updated")
        else:
            print(f"\n❌ API returned success=false")
    else:
        print(f"\n❌ HTTP Error: {response.status_code}")

def main():
    if len(sys.argv) < 3:
        print("Usage: python test_api.py YOUR_BEARER_TOKEN YOUR_PROPERTY_ID")
        print("\nExample:")
        print("  python test_api.py abc123xyz456 6000")
        sys.exit(1)
    
    bearer_token = sys.argv[1]
    property_id = sys.argv[2]
    test_date = "2025-12-12"
    
    print("="*60)
    print("CLOUDBEDS API TEST SCRIPT")
    print("="*60)
    print(f"Property ID: {property_id}")
    print(f"Test Date: {test_date}")
    print(f"Bearer Token: {bearer_token[:10]}...{bearer_token[-10:]}")
    
    # Test 1: Get room types
    room_types = test_get_room_types(bearer_token, property_id)
    
    if not room_types:
        print("\n❌ Could not get room types. Check your Bearer Token and Property ID.")
        return
    
    # Test 2: Get rate for first room type
    first_room_type_id = room_types[0].get('roomTypeID')
    rate = test_get_rate(bearer_token, property_id, first_room_type_id, test_date)
    
    # Test 3: Put rate (optional, requires confirmation)
    if rate:
        test_put_rate(bearer_token, property_id, first_room_type_id, test_date, rate)
    
    print("\n" + "="*60)
    print("TESTS COMPLETE")
    print("="*60)

if __name__ == "__main__":
    main()