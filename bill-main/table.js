function calculateRow(row) {
    const startReading = parseFloat(row.querySelector('.start-reading').value.replace(/,/g, '')) || 0;
    const endReading = parseFloat(row.querySelector('.end-reading').value.replace(/,/g, '')) || 0;
    const mf = parseFloat(row.querySelector('.mf').value) || 0;
    const adjustment = parseFloat(row.querySelector('.adjustment').value) || 0;
    
    const difference = endReading - startReading;
    const totalUnits = (difference * mf) + adjustment;
    
    row.querySelector('.difference').textContent = difference.toFixed(4).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    row.querySelector('.total-units').textContent = totalUnits.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    calculateTotalGeneration();
    saveDeviceState();
    updateBillPage();
}

function calculateTotalGeneration() {
    const totalUnitsElements = document.querySelectorAll('.total-units');
    let total = 0;
    
    totalUnitsElements.forEach(element => {
        total += parseFloat(element.textContent.replace(/,/g, '')) || 0;
    });
    
    const formattedTotal = total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    document.getElementById('totalUnits').textContent = formattedTotal;
    
    localStorage.setItem('totalUnits', formattedTotal);
}

function updateBillPage() {
    if (window.location.pathname.includes('index.html')) {
        window.dispatchEvent(new CustomEvent('unitsUpdated'));
    }
}

function deleteRow(button) {
    const row = button.closest('tr');
    if (document.querySelectorAll('tbody tr:not(.total-row)').length > 1) {
        row.remove();
        calculateTotalGeneration();
        renumberDevices();
        saveDeviceState();
    } else {
        alert('Cannot delete the last row!');
    }
}

function renumberDevices() {
    const rows = document.querySelectorAll('tbody tr:not(.total-row)');
    rows.forEach((row, index) => {
        const deviceCell = row.querySelector('td:first-child');
        if (index === 0) {
            deviceCell.innerHTML = '<b>Device-01</b>';
        } else {
            const deviceNumber = (index + 1).toString().padStart(2, '0');
            deviceCell.innerHTML = `
                <b>Device-${deviceNumber}</b>
                <button class="delete-button" onclick="deleteRow(this)" title="Delete Row">−</button>
            `;
        }
    });
}

function addDeviceRow() {
    const tbody = document.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr:not(.total-row)');
    const deviceNumber = (rows.length + 1).toString().padStart(2, '0');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>
            <b>Device-${deviceNumber}</b>
            <button class="delete-button" onclick="deleteRow(this)" title="Delete Row">−</button>
        </td>
        <td><input type="text" class="start-reading" onchange="calculateRow(this.parentElement.parentElement)" value="0.0000"></td>
        <td><input type="text" class="end-reading" onchange="calculateRow(this.parentElement.parentElement)" value="0.0000"></td>
        <td class="difference">0.0000</td>
        <td><input type="text" class="mf" onchange="calculateRow(this.parentElement.parentElement)" value="1.00"></td>
        <td><input type="text" class="adjustment" onchange="calculateRow(this.parentElement.parentElement)" value="0.00"></td>
        <td class="total-units">0.00</td>
    `;
    
    tbody.insertBefore(newRow, tbody.querySelector('.total-row'));
    saveDeviceState();
}

function saveDeviceState() {
    const rows = document.querySelectorAll('tbody tr:not(.total-row)');
    const deviceData = Array.from(rows).map(row => ({
        deviceNumber: row.querySelector('td:first-child b').textContent,
        startReading: row.querySelector('.start-reading').value,
        endReading: row.querySelector('.end-reading').value,
        difference: row.querySelector('.difference').textContent,
        mf: row.querySelector('.mf').value,
        adjustment: row.querySelector('.adjustment').value,
        totalUnits: row.querySelector('.total-units').textContent
    }));
    localStorage.setItem('deviceData', JSON.stringify(deviceData));
}

function loadDeviceState() {
    const savedData = localStorage.getItem('deviceData');
    if (savedData) {
        const deviceData = JSON.parse(savedData);
        const tbody = document.querySelector('tbody');
        tbody.innerHTML = '';
        
        deviceData.forEach((data, index) => {
            const row = document.createElement('tr');
            const deviceNumber = (index + 1).toString().padStart(2, '0');
            row.innerHTML = `
                <td>
                    <b>Device-${deviceNumber}</b>
                    ${index > 0 ? '<button class="delete-button" onclick="deleteRow(this)" title="Delete Row">−</button>' : ''}
                </td>
                <td><input type="text" class="start-reading" onchange="calculateRow(this.parentElement.parentElement)" value="${data.startReading}"></td>
                <td><input type="text" class="end-reading" onchange="calculateRow(this.parentElement.parentElement)" value="${data.endReading}"></td>
                <td class="difference">${data.difference}</td>
                <td><input type="text" class="mf" onchange="calculateRow(this.parentElement.parentElement)" value="${data.mf}"></td>
                <td><input type="text" class="adjustment" onchange="calculateRow(this.parentElement.parentElement)" value="${data.adjustment}"></td>
                <td class="total-units">${data.totalUnits}</td>
            `;
            tbody.appendChild(row);
        });
        
        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        totalRow.innerHTML = `
            <td colspan="6"><b>Total generation</b></td>
            <td><b id="totalUnits">0.00</b></td>
        `;
        tbody.appendChild(totalRow);
        
        calculateTotalGeneration();
    }
}

window.onload = function() {
    const savedData = localStorage.getItem('deviceData');
    if (savedData) {
        loadDeviceState();
    } else {
        const firstRow = document.querySelector('tbody tr:first-child');
        firstRow.innerHTML = `
            <td><b>Device-01</b></td>
            <td><input type="text" class="start-reading" onchange="calculateRow(this.parentElement.parentElement)" value="1,50,430.0000"></td>
            <td><input type="text" class="end-reading" onchange="calculateRow(this.parentElement.parentElement)" value="1,66,165.0000"></td>
            <td class="difference">15,735.0000</td>
            <td><input type="text" class="mf" onchange="calculateRow(this.parentElement.parentElement)" value="1.00"></td>
            <td><input type="text" class="adjustment" onchange="calculateRow(this.parentElement.parentElement)" value="0.00"></td>
            <td class="total-units">15,735.00</td>
        `;
        saveDeviceState();
    }
    
    window.addEventListener('unitsUpdated', function() {
        calculateTotalGeneration();
    });
};
