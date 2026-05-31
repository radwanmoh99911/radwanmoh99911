let display = document.getElementById('display');
let currentInput = '';
let operator = null;
let previousValue = null;

function appendNumber(num) {
    if (num === '.' && currentInput.includes('.')) {
        return; // Prevent multiple decimal points
    }
    currentInput += num;
    updateDisplay();
}

function appendOperator(op) {
    if (currentInput === '' && op !== '.') {
        return; // Prevent operator as first input (except decimal)
    }

    if (operator !== null && currentInput !== '') {
        calculate(); // Calculate previous operation if there's a pending one
    }

    previousValue = currentInput;
    operator = op;
    currentInput = '';
}

function calculate() {
    if (operator === null || currentInput === '' || previousValue === null) {
        return; // Need all parts to calculate
    }

    let result;
    const prev = parseFloat(previousValue);
    const current = parseFloat(currentInput);

    switch (operator) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '*':
            result = prev * current;
            break;
        case '/':
            if (current === 0) {
                display.textContent = 'Error: Division by 0';
                reset();
                return;
            }
            result = prev / current;
            break;
        default:
            return;
    }

    // Round to avoid floating point errors
    result = Math.round(result * 100000000) / 100000000;

    currentInput = result.toString();
    operator = null;
    previousValue = null;
    updateDisplay();
}

function clearDisplay() {
    currentInput = '';
    operator = null;
    previousValue = null;
    updateDisplay();
}

function deleteLast() {
    currentInput = currentInput.toString().slice(0, -1);
    updateDisplay();
}

function updateDisplay() {
    display.textContent = currentInput || '0';
}

function reset() {
    currentInput = '';
    operator = null;
    previousValue = null;
}

// Initialize display
updateDisplay();

// Keyboard support
document.addEventListener('keydown', function (event) {
    if (event.key >= '0' && event.key <= '9') {
        appendNumber(event.key);
    } else if (event.key === '.') {
        appendNumber('.');
    } else if (event.key === '+' || event.key === '-' || event.key === '*' || event.key === '/') {
        appendOperator(event.key);
    } else if (event.key === 'Enter' || event.key === '=') {
        calculate();
    } else if (event.key === 'Backspace') {
        deleteLast();
    } else if (event.key === 'Escape') {
        clearDisplay();
    }
});
