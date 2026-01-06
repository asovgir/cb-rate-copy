from flask import Flask, render_template, request, jsonify
import requests
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import os
from collections import defaultdict

app = Flask(__name__)

# Cloudbeds API Configuration
API_BASE_URL = "https://api.cloudbeds.com/api/v1.3"

def get_headers(bearer_token, rate_id=None):
    """Get headers for API requests"""
    headers = {
        'Authorization': f'Bearer {bearer_token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    if rate_id:
        headers['rateID'] = str(rate_id)
    
    return headers

def get_room_types(property_id, bearer_token):
    """Fetch all room types for a property"""
    url = f"{API_BASE_URL}/getRoomTypes"
    params = {'propertyID': property_id}
    
    try:
        response = requests.get(url, headers=get_headers(bearer_token), params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get('success'):
            return data.get('data', [])
        return []
    except Exception as e:
        print(f"[ERROR] Error fetching room types: {e}")
        return []

def get_rate(property_id, room_type_id, date, bearer_token):
    """Fetch rate for a specific room type on a specific date"""
    url = f"{API_BASE_URL}/getRate"
    
    date_obj = datetime.strptime(date, '%Y-%m-%d')
    end_date_obj = date_obj + timedelta(days=1)
    end_date = end_date_obj.strftime('%Y-%m-%d')
    
    params = {
        'propertyID': property_id,
        'roomTypeID': room_type_id,
        'startDate': date,
        'endDate': end_date
    }
    
    try:
        response = requests.get(url, headers=get_headers(bearer_token), params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get('success') and data.get('data'):
            rates_data = data.get('data')
            
            if isinstance(rates_data, dict):
                return rates_data
            elif isinstance(rates_data, list) and rates_data:
                return rates_data[0]
        
        return None
    except Exception as e:
        print(f"[ERROR] Error fetching rate: {e}")
        return None

def get_rates_batch(property_id, room_type_id, start_date, end_date, bearer_token):
    """Fetch rates for a date range using getRatePlans (supports historical dates)"""
    url = f"{API_BASE_URL}/getRatePlans"
    
    params = {
        'propertyID': property_id,
        'roomTypeID': room_type_id,
        'startDate': start_date,
        'endDate': end_date,
        'detailedRates': 'true'  # Get daily rates including historical
    }
    
    try:
        print(f"[BATCH LOAD] Fetching rate plans for roomType {room_type_id} from {start_date} to {end_date}")
        response = requests.get(url, headers=get_headers(bearer_token), params=params)
        response.raise_for_status()
        data = response.json()
        
        if not data.get('success'):
            print(f"[BATCH LOAD] API returned success=false")
            return {}
        
        # getRatePlans returns array of rate plans
        rate_plans = data.get('data', [])
        
        if not rate_plans:
            print(f"[BATCH LOAD] No rate plans found")
            return {}
        
        print(f"[BATCH LOAD] Found {len(rate_plans)} rate plan(s)")
        
        # Build rates_by_date dictionary
        rates_by_date = {}
        
        for rate_plan in rate_plans:
            rate_id = rate_plan.get('rateID')
            rate_plan_id = rate_plan.get('ratePlanID')  # Only present for non-base rates
            is_derived = rate_plan.get('derived', False)
            
            # Get the rates array (daily breakdown)
            rates_array = rate_plan.get('roomRateDetailed', [])
            
            print(f"[BATCH LOAD] Processing rate plan rateID={rate_id}, derived={is_derived}, {len(rates_array)} date entries")
            
            for rate_entry in rates_array:
                date = rate_entry.get('date')
                
                if not date:
                    continue
                
                # Build comprehensive rate data object
                rate_data = {
                    'rateID': rate_id,
                    'roomTypeID': room_type_id,
                    'date': date,
                    'rate': rate_entry.get('rate') or rate_entry.get('totalRate'),
                    'roomRate': rate_entry.get('rate'),
                    'totalRate': rate_entry.get('totalRate'),
                    'extraPersonRate': rate_entry.get('extraPersonRate'),
                    'maxGuests': rate_entry.get('maxGuests'),
                    'minStay': rate_entry.get('minLos'),
                    'maxStay': rate_entry.get('maxLos'),
                    'roomsAvailable': rate_entry.get('roomsAvailable'),
                    'stopSell': rate_entry.get('stopSell'),
                    'closeToArrival': rate_entry.get('closedToArrival'),
                    'closeToDeparture': rate_entry.get('closedToDeparture')
                }
                
                # Add rate plan info if present (non-base rates)
                if rate_plan_id:
                    rate_data['ratePlanID'] = rate_plan_id
                    rate_data['ratePlanNamePublic'] = rate_plan.get('ratePlanNamePublic')
                    rate_data['ratePlanNamePrivate'] = rate_plan.get('ratePlanNamePrivate')
                
                # Add derived rate info
                if is_derived:
                    rate_data['derived'] = True
                    rate_data['derivedType'] = rate_plan.get('derivedType')
                    rate_data['derivedValue'] = rate_plan.get('derivedValue')
                    rate_data['baseRate'] = rate_entry.get('baseRate')
                
                # Store by date (use base rate by default, can be overridden)
                # If there are multiple rate plans, prioritize base rate (no ratePlanID)
                if date not in rates_by_date or not rate_plan_id:
                    rates_by_date[date] = rate_data
        
        print(f"[BATCH LOAD] Extracted {len(rates_by_date)} unique dates with rates")
        return rates_by_date
        
    except Exception as e:
        print(f"[ERROR] Error fetching batch rates: {e}")
        import traceback
        traceback.print_exc()
        return {}

def copy_rates_batch(property_id, room_type_id, rate_id, intervals, bearer_token):
    """Copy multiple rates in a single API call
    
    Args:
        intervals: List of interval objects with startDate, endDate, rate, etc.
    """
    try:
        url = f"{API_BASE_URL}/putRate"
        
        print(f"[BATCH] Copying {len(intervals)} rates for roomTypeID {room_type_id}")
        
        rate_object = {
            'rateID': str(rate_id),
            'roomTypeID': str(room_type_id),
            'interval': intervals
        }
        
        payload = {
            'propertyID': str(property_id),
            'rates': [rate_object]
        }
        
        params = {'propertyID': str(property_id)}
        
        response = requests.put(
            url, 
            headers=get_headers(bearer_token, rate_id), 
            params=params, 
            json=payload
        )
        
        print(f"[BATCH] Response Status: {response.status_code}")
        
        response.raise_for_status()
        data = response.json()
        
        if data.get('success'):
            job_ref = data.get('jobReferenceID', 'N/A')
            print(f"[BATCH SUCCESS] {len(intervals)} rates copied (Job: {job_ref})")
            return {
                'success': True,
                'count': len(intervals),
                'jobReferenceID': job_ref,
                'roomTypeID': room_type_id
            }
        else:
            error_msg = data.get('message', 'Unknown error from API')
            print(f"[BATCH ERROR] {error_msg}")
            return {
                'success': False,
                'count': len(intervals),
                'error': error_msg,
                'roomTypeID': room_type_id
            }
            
    except Exception as e:
        print(f"[BATCH ERROR] Exception: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'count': len(intervals),
            'error': str(e),
            'roomTypeID': room_type_id
        }

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/api/room-types', methods=['GET'])
def api_get_room_types():
    """API endpoint to get room types for a property"""
    property_id = request.args.get('propertyID')
    bearer_token = request.headers.get('X-Bearer-Token')
    
    if not property_id:
        return jsonify({'error': 'propertyID is required'}), 400
    
    if not bearer_token:
        return jsonify({'error': 'Bearer token is required'}), 401
    
    room_types = get_room_types(property_id, bearer_token)
    return jsonify({'success': True, 'roomTypes': room_types})

@app.route('/api/rates', methods=['GET'])
def api_get_rates():
    """API endpoint to get rates for a room type on a specific date"""
    property_id = request.args.get('propertyID')
    room_type_id = request.args.get('roomTypeID')
    date = request.args.get('date')
    bearer_token = request.headers.get('X-Bearer-Token')
    
    if not all([property_id, room_type_id, date]):
        return jsonify({'error': 'propertyID, roomTypeID, and date are required'}), 400
    
    if not bearer_token:
        return jsonify({'error': 'Bearer token is required'}), 401
    
    rate = get_rate(property_id, room_type_id, date, bearer_token)
    
    if rate:
        return jsonify({'success': True, 'rate': rate})
    else:
        return jsonify({'success': False, 'message': 'No rate found for this date'})

@app.route('/api/rates-batch', methods=['GET'])
def api_get_rates_batch():
    """API endpoint to get rates for a date range"""
    property_id = request.args.get('propertyID')
    room_type_id = request.args.get('roomTypeID')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    bearer_token = request.headers.get('X-Bearer-Token')
    
    if not all([property_id, room_type_id, start_date, end_date]):
        return jsonify({'error': 'propertyID, roomTypeID, startDate, and endDate are required'}), 400
    
    if not bearer_token:
        return jsonify({'error': 'Bearer token is required'}), 401
    
    rates = get_rates_batch(property_id, room_type_id, start_date, end_date, bearer_token)
    
    return jsonify({
        'success': True,
        'rates': rates,
        'count': len(rates)
    })

@app.route('/api/copy-rates-batch', methods=['POST'])
def api_copy_rates_batch():
    """API endpoint to copy rates in batches"""
    data = request.json
    bearer_token = request.headers.get('X-Bearer-Token')
    
    property_id = data.get('propertyID')
    batches = data.get('batches', [])  # Array of batch objects
    
    print(f"[API] Received {len(batches)} batches to process")
    
    if not property_id or not batches:
        return jsonify({'error': 'Missing required fields'}), 400
    
    if not bearer_token:
        return jsonify({'error': 'Bearer token is required'}), 401
    
    results = []
    
    for batch in batches:
        room_type_id = batch.get('roomTypeID')
        rate_id = batch.get('rateID')
        intervals = batch.get('intervals', [])
        
        if not all([room_type_id, rate_id, intervals]):
            results.append({
                'success': False,
                'roomTypeID': room_type_id,
                'error': 'Missing batch fields'
            })
            continue
        
        result = copy_rates_batch(
            property_id,
            room_type_id,
            rate_id,
            intervals,
            bearer_token
        )
        results.append(result)
    
    total_success = sum(1 for r in results if r.get('success'))
    total_rates = sum(r.get('count', 0) for r in results)
    
    print(f"[API] Batch complete: {total_success}/{len(batches)} batches successful, {total_rates} total rates")
    
    return jsonify({
        'success': True,
        'results': results,
        'summary': {
            'totalBatches': len(batches),
            'successfulBatches': total_success,
            'totalRates': total_rates
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)