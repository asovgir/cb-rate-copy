let currentView = 'basic';
let currentPropertyID = '';
let currentBearerToken = '';
let roomTypesData = [];
let ratesData = {};
let isSelecting = false;
let selectionState = false;
let pendingOperations = [];

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('basicView').style.display = view === 'basic' ? 'block' : 'none';
    document.getElementById('advancedView').style.display = view === 'advanced' ? 'block' : 'none';
    document.getElementById('resultsPanel').style.display = 'none';
}

function renderBasicRoomTypeCheckboxes() {
    const container = document.getElementById('roomTypeCheckboxes');
    container.innerHTML = '';
    
    roomTypesData.forEach(rt => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" class="room-type-checkbox" value="${rt.roomTypeID}">
            <span>${rt.roomTypeName}</span>
        `;
        container.appendChild(label);
    });
}

function renderAdvancedRoomTypeSelect() {
    const select = document.getElementById('advancedRoomTypeSelect');
    select.innerHTML = '';
    
    roomTypesData.forEach(rt => {
        const option = document.createElement('option');
        option.value = rt.roomTypeID;
        option.textContent = rt.roomTypeName;
        select.appendChild(option);
    });
}

async function loadRoomTypes() {
    const bearerToken = document.getElementById('bearerToken').value.trim();
    const propertyID = document.getElementById('propertyID').value.trim();

    if (!bearerToken || !propertyID) {
        alert('Please fill in Bearer Token and Property ID');
        return;
    }

    currentBearerToken = bearerToken;
    currentPropertyID = propertyID;

    showLoading(true);

    try {
        const response = await fetch(`/api/room-types?propertyID=${propertyID}`, {
            headers: { 'X-Bearer-Token': bearerToken }
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            alert('Error loading room types: ' + (data.error || 'Unknown error'));
            showLoading(false);
            return;
        }

        roomTypesData = data.roomTypes;
        
        if (currentView === 'basic') {
            renderBasicRoomTypeCheckboxes();
            document.getElementById('basicView').style.display = 'block';
        } else {
            renderAdvancedRoomTypeSelect();
            document.getElementById('advancedView').style.display = 'block';
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading data');
        showLoading(false);
    }
}

function selectAllRoomTypes() {
    document.querySelectorAll('.room-type-checkbox').forEach(cb => cb.checked = true);
}

function clearAllRoomTypes() {
    document.querySelectorAll('.room-type-checkbox').forEach(cb => cb.checked = false);
}

function selectAllAdvancedRoomTypes() {
    const select = document.getElementById('advancedRoomTypeSelect');
    for (let i = 0; i < select.options.length; i++) {
        select.options[i].selected = true;
    }
}

function clearAllAdvancedRoomTypes() {
    document.getElementById('advancedRoomTypeSelect').selectedIndex = -1;
}

function getDayOfWeekMatch(sourceDate, targetYear) {
    const source = new Date(sourceDate + 'T00:00:00');
    const dayOfWeek = source.getDay();
    
    let target = new Date(targetYear, source.getMonth(), source.getDate());
    const targetDayOfWeek = target.getDay();
    
    let diff = dayOfWeek - targetDayOfWeek;
    
    if (diff > 3) {
        diff -= 7;
    } else if (diff < -3) {
        diff += 7;
    }
    
    target.setDate(target.getDate() + diff);
    
    return target.toISOString().split('T')[0];
}

async function executeBasicCopy() {
    const selectedRoomTypes = Array.from(document.querySelectorAll('.room-type-checkbox:checked'))
        .map(cb => cb.value);
    const selectedYears = Array.from(document.querySelectorAll('.basic-year-checkbox:checked'))
        .map(cb => parseInt(cb.value));
    const fromStart = document.getElementById('basicFromStart').value;
    const fromEnd = document.getElementById('basicFromEnd').value;

    if (selectedRoomTypes.length === 0) {
        alert('Please select at least one room type');
        return;
    }

    if (selectedYears.length === 0) {
        alert('Please select at least one year');
        return;
    }

    if (!fromStart || !fromEnd) {
        alert('Please select date range');
        return;
    }

    showLoading(true);
    const operations = [];
    const dates = getDateRange(fromStart, fromEnd);

    document.getElementById('basicSummary').textContent = 'Loading rates...';

    for (const roomTypeID of selectedRoomTypes) {
        for (const date of dates) {
            try {
                const response = await fetch(
                    `/api/rates?propertyID=${currentPropertyID}&roomTypeID=${roomTypeID}&date=${date}`,
                    { headers: { 'X-Bearer-Token': currentBearerToken } }
                );
                const data = await response.json();
                
                if (data.success && data.rate) {
                    for (const year of selectedYears) {
                        const targetDate = getDayOfWeekMatch(date, year);
                        operations.push({
                            roomTypeID,
                            sourceDate: date,
                            targetDate: targetDate,
                            targetYear: year,
                            rateData: data.rate
                        });
                    }
                }
            } catch (error) {
                console.error(`Error loading rate for ${date}:`, error);
            }
        }
    }

    showLoading(false);
    
    if (operations.length === 0) {
        document.getElementById('basicSummary').textContent = 'No rates found to copy';
        return;
    }
    
    document.getElementById('basicSummary').textContent = '';
    showPreview(operations);
}

async function loadAdvancedRates() {
    const select = document.getElementById('advancedRoomTypeSelect');
    const selectedRoomTypes = Array.from(select.selectedOptions).map(opt => opt.value);
    const startDate = document.getElementById('advancedStartDate').value;
    const endDate = document.getElementById('advancedEndDate').value;

    if (selectedRoomTypes.length === 0) {
        alert('Please select at least one room type');
        return;
    }

    showLoading(true);
    ratesData = {};
    const dates = getDateRange(startDate, endDate);

    for (const roomTypeID of selectedRoomTypes) {
        ratesData[roomTypeID] = {};
        
        for (const date of dates) {
            try {
                const response = await fetch(
                    `/api/rates?propertyID=${currentPropertyID}&roomTypeID=${roomTypeID}&date=${date}`,
                    { headers: { 'X-Bearer-Token': currentBearerToken } }
                );
                const data = await response.json();
                
                if (data.success && data.rate) {
                    const rateAmount = data.rate.rate || data.rate.roomRate || data.rate.totalRate || '0.00';
                    ratesData[roomTypeID][date] = {
                        amount: rateAmount,
                        data: data.rate,
                        selected: { 2026: false, 2027: false, 2028: false, 2029: false }
                    };
                }
            } catch (error) {
                console.error(`Error loading rate for ${date}:`, error);
            }
        }
    }

    renderAdvancedSpreadsheet(selectedRoomTypes, startDate, endDate);
    document.getElementById('spreadsheetContainer').style.display = 'block';
    showLoading(false);
}

function renderAdvancedSpreadsheet(roomTypeIDs, startDate, endDate) {
    const dates = getDateRange(startDate, endDate);
    
    let html = `<table class="spreadsheet">
        <thead>
            <tr>
                <th class="date-col">Date</th>
                <th class="day-col">Day</th>
                <th class="roomtype-col">Room Type</th>
                <th class="rate-col">Source Rate</th>
                <th class="year-col">2026</th>
                <th class="year-col">2027</th>
                <th class="year-col">2028</th>
                <th class="year-col">2029</th>
            </tr>
        </thead>
        <tbody>`;

    dates.forEach(date => {
        const dateObj = new Date(date + 'T00:00:00');
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        
        roomTypeIDs.forEach(roomTypeID => {
            const roomType = roomTypesData.find(rt => rt.roomTypeID === roomTypeID);
            const rate = ratesData[roomTypeID]?.[date];
            const hasRate = rate && rate.amount;
            const rateDisplay = hasRate ? `$${parseFloat(rate.amount).toFixed(2)}` : '-';

            html += `<tr class="${hasRate ? '' : 'no-rate'}">
                <td class="date-cell">${formatDate(date)}</td>
                <td class="day-cell ${isWeekend(dateObj) ? 'weekend' : ''}">${dayName}</td>
                <td class="roomtype-cell">${roomType.roomTypeName}</td>
                <td class="rate-cell">${rateDisplay}</td>
                <td class="checkbox-cell">
                    <input type="checkbox" 
                           ${hasRate ? '' : 'disabled'} 
                           data-room="${roomTypeID}" 
                           data-date="${date}" 
                           data-year="2026"
                           onchange="toggleYear('${roomTypeID}', '${date}', 2026, this.checked)"
                           onmousedown="startSelection(event)"
                           onmouseenter="continueSelection(event)">
                </td>
                <td class="checkbox-cell">
                    <input type="checkbox" 
                           ${hasRate ? '' : 'disabled'} 
                           data-room="${roomTypeID}" 
                           data-date="${date}" 
                           data-year="2027"
                           onchange="toggleYear('${roomTypeID}', '${date}', 2027, this.checked)"
                           onmousedown="startSelection(event)"
                           onmouseenter="continueSelection(event)">
                </td>
                <td class="checkbox-cell">
                    <input type="checkbox" 
                           ${hasRate ? '' : 'disabled'} 
                           data-room="${roomTypeID}" 
                           data-date="${date}" 
                           data-year="2028"
                           onchange="toggleYear('${roomTypeID}', '${date}', 2028, this.checked)"
                           onmousedown="startSelection(event)"
                           onmouseenter="continueSelection(event)">
                </td>
                <td class="checkbox-cell">
                    <input type="checkbox" 
                           ${hasRate ? '' : 'disabled'} 
                           data-room="${roomTypeID}" 
                           data-date="${date}" 
                           data-year="2029"
                           onchange="toggleYear('${roomTypeID}', '${date}', 2029, this.checked)"
                           onmousedown="startSelection(event)"
                           onmouseenter="continueSelection(event)">
                </td>
            </tr>`;
        });
    });

    html += `</tbody></table>`;
    document.getElementById('spreadsheetContent').innerHTML = html;
    
    document.addEventListener('mouseup', stopSelection);
    updateSelectionCount();
}

function startSelection(event) {
    if (event.target.disabled) return;
    isSelecting = true;
    selectionState = event.target.checked;
}

function continueSelection(event) {
    if (!isSelecting || event.target.disabled) return;
    event.target.checked = selectionState;
    const roomTypeID = event.target.dataset.room;
    const date = event.target.dataset.date;
    const year = parseInt(event.target.dataset.year);
    toggleYear(roomTypeID, date, year, selectionState);
}

function stopSelection() {
    isSelecting = false;
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function selectWeekends() {
    document.querySelectorAll('.day-cell.weekend').forEach(cell => {
        const row = cell.parentElement;
        row.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach(cb => {
            cb.checked = true;
            toggleYear(cb.dataset.room, cb.dataset.date, parseInt(cb.dataset.year), true);
        });
    });
    updateSelectionCount();
}

function selectWeekdays() {
    document.querySelectorAll('.day-cell:not(.weekend)').forEach(cell => {
        const row = cell.parentElement;
        row.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach(cb => {
            cb.checked = true;
            toggleYear(cb.dataset.room, cb.dataset.date, parseInt(cb.dataset.year), true);
        });
    });
    updateSelectionCount();
}

function getDateRange(start, end) {
    const dates = [];
    const current = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');

    while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toggleYear(roomTypeID, date, year, checked) {
    if (ratesData[roomTypeID] && ratesData[roomTypeID][date]) {
        ratesData[roomTypeID][date].selected[year] = checked;
        updateSelectionCount();
    }
}

function selectAllYears() {
    Object.keys(ratesData).forEach(roomTypeID => {
        Object.keys(ratesData[roomTypeID]).forEach(date => {
            if (ratesData[roomTypeID][date].amount) {
                [2026, 2027, 2028, 2029].forEach(year => {
                    ratesData[roomTypeID][date].selected[year] = true;
                });
            }
        });
    });
    
    document.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach(cb => {
        cb.checked = true;
    });
    updateSelectionCount();
}

function clearAllYears() {
    Object.keys(ratesData).forEach(roomTypeID => {
        Object.keys(ratesData[roomTypeID]).forEach(date => {
            [2026, 2027, 2028, 2029].forEach(year => {
                ratesData[roomTypeID][date].selected[year] = false;
            });
        });
    });
    
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    updateSelectionCount();
}

function updateSelectionCount() {
    let count = 0;
    Object.values(ratesData).forEach(roomRates => {
        Object.values(roomRates).forEach(rate => {
            count += Object.values(rate.selected).filter(Boolean).length;
        });
    });
    document.getElementById('selectionCount').textContent = 
        count > 0 ? `${count} rate(s) selected` : '';
}

async function copySelectedRates() {
    const operations = [];
    
    Object.keys(ratesData).forEach(roomTypeID => {
        Object.keys(ratesData[roomTypeID]).forEach(date => {
            const rate = ratesData[roomTypeID][date];
            Object.keys(rate.selected).forEach(year => {
                if (rate.selected[year]) {
                    const targetDate = getDayOfWeekMatch(date, parseInt(year));
                    operations.push({
                        roomTypeID,
                        sourceDate: date,
                        targetDate: targetDate,
                        targetYear: parseInt(year),
                        rateData: rate.data
                    });
                }
            });
        });
    });

    if (operations.length === 0) {
        alert('No rates selected');
        return;
    }

    showPreview(operations);
}

function showPreview(operations) {
    pendingOperations = operations;
    console.log('[PREVIEW] Set pendingOperations:', pendingOperations);
    
    const summary = document.querySelector('.preview-summary');
    summary.textContent = `Ready to copy ${operations.length} rate(s). Review and edit rates below before submitting.`;
    
    const tbody = document.getElementById('previewTableBody');
    tbody.innerHTML = '';
    
    operations.forEach((op, index) => {
        const roomType = roomTypesData.find(rt => rt.roomTypeID === op.roomTypeID);
        const sourceDate = new Date(op.sourceDate + 'T00:00:00');
        const targetDate = new Date(op.targetDate + 'T00:00:00');
        
        const sourceDayName = sourceDate.toLocaleDateString('en-US', { weekday: 'short' });
        const targetDayName = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
        
        const isSourceWeekend = sourceDate.getDay() === 0 || sourceDate.getDay() === 6;
        const isTargetWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
        
        const rateAmount = op.rateData.rate || op.rateData.roomRate || op.rateData.totalRate || 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${roomType.roomTypeName}</td>
            <td class="source-date">${formatDate(op.sourceDate)}</td>
            <td><span class="day-badge ${isSourceWeekend ? 'weekend' : ''}">${sourceDayName}</span></td>
            <td>$${parseFloat(rateAmount).toFixed(2)}</td>
            <td class="arrow-cell">→</td>
            <td class="target-date">${formatDate(op.targetDate)}</td>
            <td><span class="day-badge ${isTargetWeekend ? 'weekend' : ''}">${targetDayName}</span></td>
            <td>
                <input type="number" 
                       step="0.01" 
                       min="0" 
                       value="${parseFloat(rateAmount).toFixed(2)}"
                       data-index="${index}"
                       onchange="updatePendingRate(${index}, this.value)">
            </td>
        `;
        tbody.appendChild(row);
    });
    
    document.getElementById('previewModal').style.display = 'flex';
}

function updatePendingRate(index, newRate) {
    const rateAmount = parseFloat(newRate);
    if (!isNaN(rateAmount) && rateAmount >= 0) {
        const operation = pendingOperations[index];
        if (operation.rateData.rate !== undefined) {
            operation.rateData.rate = rateAmount;
        }
        if (operation.rateData.roomRate !== undefined) {
            operation.rateData.roomRate = rateAmount;
        }
        if (operation.rateData.totalRate !== undefined) {
            operation.rateData.totalRate = rateAmount;
        }
    }
}

function closePreview() {
    document.getElementById('previewModal').style.display = 'none';
    // DON'T clear pendingOperations here - we need it for confirmAndSubmit!
    console.log('[CLOSE] Keeping pendingOperations for submit');
}

async function confirmAndSubmit() {
    alert('1. CONFIRM BUTTON CLICKED!');
    console.log('[DEBUG] confirmAndSubmit called');
    console.log('[DEBUG] pendingOperations:', pendingOperations);
    
    alert('2. pendingOperations.length = ' + pendingOperations.length);
    
    if (pendingOperations.length === 0) {
        alert('No operations to submit');
        return;
    }
    
    alert('3. About to close preview');
    document.getElementById('previewModal').style.display = 'none';
    
    alert('4. About to show loading');
    showLoading(true);
    
    alert('5. About to call executeRateCopies');
    try {
        const results = await executeRateCopies(pendingOperations);
        alert('6. Got results: ' + results.length);
        console.log('[DEBUG] Results:', results);
        
        showLoading(false);
        displayResults(results);
        
        if (currentView === 'advanced') {
            clearAllYears();
        }
        
        if (currentView === 'basic') {
            const successCount = results.filter(r => r.success).length;
            document.getElementById('basicSummary').textContent = 
                `Completed: ${successCount}/${results.length} successful`;
        }
        
        // NOW clear pendingOperations
        pendingOperations = [];
        
        alert('7. ALL DONE!');
    } catch (error) {
        alert('ERROR: ' + error.message);
        console.error('[ERROR] Exception in confirmAndSubmit:', error);
        showLoading(false);
    }
}

async function executeRateCopies(operations) {
    alert('executeRateCopies: operations.length = ' + operations.length);
    console.log('[DEBUG] executeRateCopies called with', operations.length, 'operations');
    const results = [];

    for (const op of operations) {
        alert('Processing op: ' + op.sourceDate + ' -> ' + op.targetDate);
        console.log('[DEBUG] Processing operation:', op);
        try {
            const requestBody = {
                propertyID: currentPropertyID,
                roomTypeID: op.roomTypeID,
                date: op.sourceDate,
                targetDate: op.targetDate,
                years: [op.targetYear],
                rateData: op.rateData
            };
            
            console.log('[DEBUG] Sending request:', requestBody);
            
            const response = await fetch('/api/copy-rates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Bearer-Token': currentBearerToken
                },
                body: JSON.stringify(requestBody)
            });

            console.log('[DEBUG] Response status:', response.status);
            const result = await response.json();
            console.log('[DEBUG] Response data:', result);
            
            if (result.success && result.results[0]) {
                results.push(result.results[0]);
            } else {
                results.push({
                    success: false,
                    date: op.targetDate,
                    year: op.targetYear,
                    error: result.error || 'Unknown error'
                });
            }
        } catch (error) {
            console.error('[ERROR] Error copying rate:', error);
            results.push({
                success: false,
                date: op.targetDate,
                year: op.targetYear,
                error: error.message
            });
        }
    }

    alert('executeRateCopies: results.length = ' + results.length);
    console.log('[DEBUG] All results:', results);
    return results;
}

function displayResults(results) {
    const resultsPanel = document.getElementById('resultsPanel');
    const resultsList = document.getElementById('resultsList');
    
    const successCount = results.filter(r => r.success).length;
    
    let html = `<div class="results-summary">${successCount}/${results.length} successful</div>`;
    html += '<div class="results-grid">';
    
    results.forEach(result => {
        html += `
            <div class="result-item ${result.success ? 'success' : 'error'}">
                <span>${result.success ? '✓' : '✗'}</span>
                <span>${result.date}</span>
                <span>${result.success ? `$${result.rate}` : 'Failed'}</span>
                ${result.error ? `<span style="font-size: 9px; color: #721c24;">${result.error}</span>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    resultsList.innerHTML = html;
    resultsPanel.style.display = 'block';
}

function clearResults() {
    document.getElementById('resultsPanel').style.display = 'none';
}

function showLoading(show) {
    document.getElementById('loadingIndicator').style.display = show ? 'flex' : 'none';
}