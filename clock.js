const timezoneSelect = document.getElementById('timezoneSelect');
const clocksContainer = document.getElementById('clocksContainer');
const localTimeElement = document.getElementById('localTime');

let activeTimezones = [];
const STORAGE_KEY = 'activeTimezones';

// Common timezones to initialize
const DEFAULT_TIMEZONES = [
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo'
];

// Initialize app
function init() {
    loadFromLocalStorage();
    if (activeTimezones.length === 0) {
        activeTimezones = [...DEFAULT_TIMEZONES];
    }
    renderClocks();
    updateLocalTime();
    // Update clocks every second
    setInterval(() => {
        updateAllClocks();
        updateLocalTime();
    }, 1000);
}

// Add timezone
function addTimezone() {
    const timezone = timezoneSelect.value;

    if (!timezone) {
        alert('Please select a timezone!');
        return;
    }

    if (activeTimezones.includes(timezone)) {
        alert('This timezone is already added!');
        return;
    }

    activeTimezones.push(timezone);
    timezoneSelect.value = '';
    saveToLocalStorage();
    renderClocks();
}

// Remove timezone
function removeTimezone(timezone) {
    activeTimezones = activeTimezones.filter(tz => tz !== timezone);
    saveToLocalStorage();
    renderClocks();
}

// Reset to default timezones
function resetTimezones() {
    if (confirm('Reset to default timezones?')) {
        activeTimezones = [...DEFAULT_TIMEZONES];
        timezoneSelect.value = '';
        saveToLocalStorage();
        renderClocks();
    }
}

// Render all clock cards
function renderClocks() {
    clocksContainer.innerHTML = '';

    if (activeTimezones.length === 0) {
        clocksContainer.innerHTML = `
            <div class="empty-state">
                <h2>📍 No timezones selected</h2>
                <p>Add a timezone from the dropdown above to get started!</p>
            </div>
        `;
        return;
    }

    activeTimezones.forEach(timezone => {
        const clockCard = createClockCard(timezone);
        clocksContainer.appendChild(clockCard);
    });
}

// Create a single clock card
function createClockCard(timezone) {
    const card = document.createElement('div');
    card.className = 'clock-card';
    card.id = `clock-${timezone}`;

    const timeInfo = getTimeInfo(timezone);

    card.innerHTML = `
        <div class="timezone-name">${getTimezoneDisplay(timezone)}</div>
        <div class="timezone-label">${timezone}</div>
        <div class="digital-time">${timeInfo.digitalTime}</div>
        <div class="time-details">
            <div class="time-detail">
                <span class="time-detail-label">Date</span>
                <span class="time-detail-value">${timeInfo.date}</span>
            </div>
            <div class="time-detail">
                <span class="time-detail-label">Day</span>
                <span class="time-detail-value">${timeInfo.day}</span>
            </div>
            <div class="time-detail">
                <span class="time-detail-label">Offset</span>
                <span class="time-detail-value">${timeInfo.offset}</span>
            </div>
        </div>
        <button class="remove-btn" onclick="removeTimezone('${timezone}')">Remove</button>
    `;

    return card;
}

// Get time information for a timezone
function getTimeInfo(timezone) {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short'
        });

        const now = new Date();
        const parts = formatter.formatToParts(now);

        const hour = parts.find(p => p.type === 'hour')?.value || '00';
        const minute = parts.find(p => p.type === 'minute')?.value || '00';
        const second = parts.find(p => p.type === 'second')?.value || '00';
        const period = parts.find(p => p.type === 'dayPeriod')?.value || 'AM';
        const year = parts.find(p => p.type === 'year')?.value || '2024';
        const month = parts.find(p => p.type === 'month')?.value || '01';
        const day = parts.find(p => p.type === 'day')?.value || '01';
        const weekday = parts.find(p => p.type === 'weekday')?.value || 'Mon';

        const utcTime = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const offsetMs = tzTime - utcTime;
        const offsetHours = Math.floor(Math.abs(offsetMs) / 3600000);
        const offsetMins = Math.floor((Math.abs(offsetMs) % 3600000) / 60000);
        const offsetSign = offsetMs >= 0 ? '+' : '-';
        const offsetStr = `UTC${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;

        return {
            digitalTime: `${hour}:${minute}:${second} ${period}`,
            date: `${month}/${day}/${year}`,
            day: weekday,
            offset: offsetStr
        };
    } catch (error) {
        console.error('Error getting time for timezone:', timezone, error);
        return {
            digitalTime: '--:--:-- --',
            date: '--/--/----',
            day: '---',
            offset: 'UTC±00:00'
        };
    }
}

// Get readable timezone display name
function getTimezoneDisplay(timezone) {
    const parts = timezone.split('/');
    const region = parts[0];
    const city = parts[1] || parts[0];
    return `${city.replace(/_/g, ' ')} - ${region}`;
}

// Update all clocks
function updateAllClocks() {
    activeTimezones.forEach(timezone => {
        const card = document.getElementById(`clock-${timezone}`);
        if (card) {
            const timeInfo = getTimeInfo(timezone);
            card.querySelector('.digital-time').textContent = timeInfo.digitalTime;
            const details = card.querySelectorAll('.time-detail-value');
            if (details.length >= 3) {
                details[0].textContent = timeInfo.date;
                details[1].textContent = timeInfo.day;
                details[2].textContent = timeInfo.offset;
            }
        }
    });
}

// Update local time display
function updateLocalTime() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'long'
    });
    localTimeElement.textContent = formatter.format(now);
}

// Save to local storage
function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeTimezones));
}

// Load from local storage
function loadFromLocalStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            activeTimezones = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading timezones:', error);
            activeTimezones = [...DEFAULT_TIMEZONES];
        }
    }
}

// Initialize on page load
window.addEventListener('load', init);
