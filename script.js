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
    // Get values
    const units = parseFloat(document.getElementById('unitsConsumed').value) || 0;
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
    // Update all other amount fields if needed
    // (adjAmount, deemAmount, elecDuty, gstAmount can be set to 0 or left as is)
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