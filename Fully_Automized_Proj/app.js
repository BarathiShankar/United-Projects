// --- LOCALSTORAGE KEYS ---
const USERS_KEY = 'geoattend_users';
const SESSION_KEY = 'geoattend_session';
const RECORDS_KEY = 'geoattend_records';

// --- UTILITY FUNCTIONS ---
function showAlert(message, type) {
    const alertBox = document.getElementById('alert-message');
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove('hidden');
}

// --- PAGE INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('host.html')) initHostPage();
    else if (path.includes('student.html')) initStudentPage();
});

// --- AUTHENTICATION LOGIC ---
function handleRegister() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showAlert('Username and password cannot be empty.', 'danger');
        return;
    }

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.some(user => user.username === username)) {
        showAlert('This username is already taken.', 'danger');
        return;
    }

    users.push({ username, password }); // In a real app, you'd hash this.
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    showAlert('Registration successful! Redirecting to login...', 'success');
    setTimeout(() => window.location.href = 'index.html', 1500);
}

function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        sessionStorage.setItem('loggedInUser', username); // Use sessionStorage to "log in" for this browser tab session
        window.location.href = 'host.html';
    } else {
        showAlert('Invalid username or password.', 'danger');
    }
}

function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
}

// --- HOST PAGE LOGIC ---
function initHostPage() {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        window.location.href = 'index.html'; // Protect the page
        return;
    }
    document.getElementById('host-username').textContent = loggedInUser;
    setInterval(updateDashboard, 2000); // Poll for live updates
}

function createSession() {
    const courseName = document.getElementById('course-name').value;
    const radius = document.getElementById('radius').value;
    const btn = document.getElementById('create-session-btn');

    if (!courseName || !radius) {
        alert('Please provide a course name and radius.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Locating...';

    navigator.geolocation.getCurrentPosition(position => {
        const sessionData = {
            courseName,
            radius: parseFloat(radius),
            host: sessionStorage.getItem('loggedInUser'),
            location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        localStorage.setItem(RECORDS_KEY, JSON.stringify([])); // Clear old records

        const studentPageUrl = `${window.location.origin}${window.location.pathname.replace('host.html', '')}student.html`;
        const linkEl = document.getElementById('attendance-link');
        linkEl.href = studentPageUrl;
        linkEl.textContent = studentPageUrl;

        document.getElementById('session-link-container').classList.remove('hidden');
        btn.textContent = 'Session Active!';
        updateDashboard();

    }, error => {
        alert(`Geolocation Error: ${error.message}`);
        btn.disabled = false;
        btn.textContent = 'Start Session';
    });
}

function updateDashboard() {
    const records = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
    const grid = document.getElementById('dashboard-grid');
    grid.innerHTML = ''; // Clear old cards

    if (records.length === 0) {
        grid.innerHTML = '<p class="subtitle">No students have checked in yet...</p>';
        return;
    }
    
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    records.forEach(record => {
        const card = document.createElement('div');
        card.className = `student-card status-${record.status.toLowerCase().replace(' ', '-')}`;
        card.innerHTML = `
            <h3>${record.rollNumber}</h3>
            <p>${record.details}</p>
            <p class="timestamp">${new Date(record.timestamp).toLocaleTimeString()}</p>
        `;
        grid.appendChild(card);
    });
}

function copyLink() {
    const link = document.getElementById('attendance-link').href;
    navigator.clipboard.writeText(link).then(() => {
        const copyBtn = document.getElementById('copy-link-btn');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    });
}

// --- STUDENT PAGE LOGIC ---
function initStudentPage() {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    const btn = document.getElementById('mark-btn');

    if (!session) {
        document.getElementById('course-title').textContent = 'No Active Session';
        showAlert('There is no active session. Please use a link from your instructor.', 'danger');
        return;
    }

    document.getElementById('course-title').textContent = `Join: ${session.courseName}`;
    document.getElementById('course-host').textContent = `Hosted by ${session.host}`;
    btn.disabled = false;
    btn.textContent = 'Mark My Attendance';
}

function markAttendance() {
    const rollNumber = document.getElementById('roll-number').value.trim();
    if (!rollNumber) {
        showAlert('Please enter your roll number.', 'danger');
        return;
    }

    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!session) return;

    const btn = document.getElementById('mark-btn');
    btn.disabled = true;
    btn.textContent = 'Checking Location...';

    navigator.geolocation.getCurrentPosition(position => {
        const studentLocation = position.coords;
        const distance = calculateDistance(session.location.latitude, session.location.longitude, studentLocation.latitude, studentLocation.longitude);

        let status, details, message;
        if (distance <= session.radius) {
            status = 'In Class';
            details = `Within radius (${Math.round(distance)}m away)`;
            message = 'Attendance marked successfully!';
            showAlert(message, 'success');
        } else {
            status = 'Out of Range';
            details = `~${Math.round(distance)}m from class`;
            message = `You are too far away (${Math.round(distance)}m) to mark attendance.`;
            showAlert(message, 'danger');
        }

        const newRecord = { rollNumber, status, details, timestamp: new Date().toISOString() };
        const records = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
        
        // Update existing record for the same roll number, or add a new one
        const existingIndex = records.findIndex(r => r.rollNumber === rollNumber);
        if(existingIndex > -1) {
            records[existingIndex] = newRecord;
        } else {
            records.push(newRecord);
        }
        localStorage.setItem(RECORDS_KEY, JSON.stringify(records));

        btn.disabled = false;
        btn.textContent = 'Mark My Attendance';

    }, error => {
        showAlert(`Location Error: ${error.message}`, 'danger');
        btn.disabled = false;
        btn.textContent = 'Mark My Attendance';
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
