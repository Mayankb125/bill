// Utility: Format numbers with commas and decimals
function formatNumber(num, decimals = 2) {
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(Number(num));
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
    // Get values from localStorage if available
    const savedData = localStorage.getItem('deviceData');
    let totalUnits = 0;
    
    if (savedData) {
        const deviceData = JSON.parse(savedData);
        totalUnits = deviceData.reduce((sum, device) => {
            return sum + parseFloat(device.totalUnits.replace(/,/g, '')) || 0;
        }, 0);
    } else {
        totalUnits = parseFloat(document.getElementById('unitsConsumed').value) || 0;
    }

    const days = parseFloat(document.getElementById('days').value) || 1;
    const rate = parseFloat(document.getElementById('genRate').value) || 0;
    const kwhPerDay = totalUnits / days;
    const kwhKwpDay = kwhPerDay / 328.09;

    // Update all relevant fields
    document.getElementById('unitsConsumed').value = formatNumber(totalUnits);
    document.getElementById('kwhPerDay').value = formatNumber(kwhPerDay);
    document.getElementById('kwhKwpDay').value = formatNumber(kwhKwpDay, 2);
    document.getElementById('genUnits').value = formatNumber(totalUnits);
    document.getElementById('genAmount').value = formatNumber(totalUnits * rate);
    document.getElementById('solarCharges').value = formatNumber(totalUnits * rate);
    document.getElementById('totalCharges').value = formatNumber(totalUnits * rate);
    document.getElementById('displayCurrentAmount').textContent = formatNumber(totalUnits * rate, 0);
    document.getElementById('displayCurrentBillAmount').textContent = formatNumber(totalUnits * rate, 2);
}

function addBillInputListeners() {
    // All .bill-input fields
    document.querySelectorAll('.bill-input').forEach(input => {
        input.addEventListener('input', updateBillCalculations);
        input.addEventListener('focus', function() {
            this.select();
        });
    });
    
    // Date fields: update display format if needed
    document.getElementById('billDate').addEventListener('change', function() {
        this.title = formatDateInput(this.value);
    });
    document.getElementById('billStartDate').addEventListener('change', function() {
        this.title = formatDateInput(this.value);
    });
    document.getElementById('billEndDate').addEventListener('change', function() {
        this.title = formatDateInput(this.value);
    });
    document.getElementById('dueDate').addEventListener('change', function() {
        this.title = formatDateInput(this.value);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    addBillInputListeners();
    updateBillCalculations();
    
    // Listen for units updates from the meter reading page
    window.addEventListener('unitsUpdated', function() {
        updateBillCalculations();
    });
    
    // Also check for updates when the page becomes visible
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            updateBillCalculations();
        }
    });
    
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