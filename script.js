// Utility: Format numbers with commas and decimals
function formatNumber(num, decimals = 2) {
    if (isNaN(num)) return '0.00';
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Utility: Format date as DD-MMM-YYYY
function formatDateInput(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    return date.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function updateBillCalculations() {
    // Get values
    const units = parseFloat(document.getElementById('unitsConsumed').value.replace(/,/g, '')) || 0;
    const days = parseFloat(document.getElementById('days').value) || 1;
    const rate = parseFloat(document.getElementById('genRate').value) || 0;
    const kwhPerDay = units / days;
    const kwhKwpDay = kwhPerDay / 328.09;
    // Update calculated fields
    document.getElementById('kwhPerDay').value = formatNumber(kwhPerDay);
    document.getElementById('kwhKwpDay').value = formatNumber(kwhKwpDay, 2);
    document.getElementById('genUnits').value = formatNumber(units);
    document.getElementById('genAmount').value = formatNumber(units * rate);
    document.getElementById('solarCharges').value = formatNumber(units * rate);
    document.getElementById('totalCharges').value = formatNumber(units * rate);
    document.getElementById('displayCurrentAmount').textContent = formatNumber(units * rate, 0);
    document.getElementById('displayCurrentBillAmount').textContent = formatNumber(units * rate, 2);
    // Update all other amount fields if needed
    // (adjAmount, deemAmount, elecDuty, gstAmount can be set to 0 or left as is)
}

// Event Listeners for bill input changes
function addBillInputListeners() {
    document.querySelectorAll('.bill-input').forEach(input => {
        input.addEventListener('change', updateBillCalculations);
    });
    // Add event listeners for date inputs to format them on change
    document.getElementById('billDate').addEventListener('change', (e) => e.target.value = formatDateInput(e.target.value));
    document.getElementById('billStartDate').addEventListener('change', (e) => e.target.value = formatDateInput(e.target.value));
    document.getElementById('billEndDate').addEventListener('change', (e) => e.target.value = formatDateInput(e.target.value));
}

document.addEventListener('DOMContentLoaded', function() {
    addBillInputListeners();
    updateBillCalculations();

    // Format date inputs on load
    document.getElementById('billDate').value = formatDateInput(document.getElementById('billDate').value);
    document.getElementById('billStartDate').value = formatDateInput(document.getElementById('billStartDate').value);
    document.getElementById('billEndDate').value = formatDateInput(document.getElementById('billEndDate').value);
    
    // Set text content for dueDate span
    document.getElementById('dueDate').textContent = formatDateInput(document.getElementById('dueDate').textContent);

    document.getElementById('generatePDFBtn').addEventListener('click', function() {
        generatePDF();
    });
});

function generatePDF() {
    const element = document.getElementById('bill');
    const btn = document.getElementById('generatePDFBtn');
    // Hide the button during PDF generation
    btn.style.display = 'none';
    // Small timeout to ensure button is hidden in render
    setTimeout(() => {
        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5], // top, left, bottom, right (inches)
            filename: 'solar-bill.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save().then(() => {
            // Restore the button after PDF is generated
            btn.style.display = 'block';
        });
    }, 100);
}

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
}

function addDeviceRow() {
    const tbody = document.querySelector('.second-page-content .meter-readings-table-wrapper tbody');
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
    calculateTotalGeneration();
}

function deleteRow(button) {
    const row = button.closest('tr');
    const tbody = row.parentElement;
    if (tbody.querySelectorAll('tr:not(.total-row)').length > 1) {
        row.remove();
        calculateTotalGeneration();
        renumberDevices();
    } else {
        alert('Cannot delete the last row!');
    }
}

function renumberDevices() {
    const rows = document.querySelectorAll('.second-page-content .meter-readings-table-wrapper tbody tr:not(.total-row)');
    rows.forEach((row, index) => {
        const deviceCell = row.querySelector('td:first-child');
        const deviceNumber = (index + 1).toString().padStart(2, '0');
        if (index === 0) {
            deviceCell.innerHTML = `<b>Device-${deviceNumber}</b>`;
        } else {
            deviceCell.innerHTML = `
                <b>Device-${deviceNumber}</b>
                <button class="delete-button" onclick="deleteRow(this)" title="Delete Row">−</button>
            `;
        }
    });
}

function calculateTotalGeneration() {
    const totalUnitsElements = document.querySelectorAll('.second-page-content .meter-readings .total-units');
    let total = 0;
    
    totalUnitsElements.forEach(element => {
        total += parseFloat(element.textContent.replace(/,/g, '')) || 0;
    });
    
    document.getElementById('totalUnits').textContent = total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    // Update unitsConsumed and genUnits on the first page
    document.getElementById('unitsConsumed').value = formatNumber(total);
    document.getElementById('genUnits').value = formatNumber(total);
    
    // Recalculate the first page bill based on the updated units
    updateBillCalculations();
}

// Initialize the first row with input fields
window.onload = function() {
    const firstRow = document.querySelector('.second-page-content .meter-readings-table-wrapper tbody tr:first-child');
    firstRow.innerHTML = `
        <td><b>Device-01</b></td>
        <td><input type="text" class="start-reading" onchange="calculateRow(this.parentElement.parentElement)" value="1,50,430.0000"></td>
        <td><input type="text" class="end-reading" onchange="calculateRow(this.parentElement.parentElement)" value="1,66,165.0000"></td>
        <td class="difference">15,735.0000</td>
        <td><input type="text" class="mf" onchange="calculateRow(this.parentElement.parentElement)" value="1.00"></td>
        <td><input type="text" class="adjustment" onchange="calculateRow(this.parentElement.parentElement)" value="0.00"></td>
        <td class="total-units">15,735.00</td>
    `;
    calculateTotalGeneration();
}; 