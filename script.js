const scanButton = document.getElementById('scanButton');
const historyButton = document.getElementById('historyButton');
const backButton = document.getElementById('backButton');
const mainView = document.getElementById('mainView');
const historyView = document.getElementById('historyView');
const deviceList = document.getElementById('deviceList');
const historyList = document.getElementById('historyList');

// --- Event Listeners ---

historyButton.addEventListener('click', () => {
    mainView.style.display = 'none';
    historyView.style.display = 'block';
    loadHistory();
});

backButton.addEventListener('click', () => {
    mainView.style.display = 'block';
    historyView.style.display = 'none';
});

scanButton.addEventListener('click', async () => {
    if (!navigator.bluetooth) {
        deviceList.innerHTML = '<li>Web Bluetooth API is not supported in this browser.</li>';
        return;
    }

    try {
        deviceList.innerHTML = '<li>Please select a device from the popup...</li>';
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
        });

        deviceList.innerHTML = `<li>Found: ${device.name || 'Unnamed Device'} (ID: ${device.id}). Getting location...</li>`;

        if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported by this browser.');
        }

        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        const deviceInfo = `<li>Found: ${device.name || 'Unnamed Device'} (ID: ${device.id})<br>At: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</li>`;
        deviceList.innerHTML = deviceInfo;

        saveDevice({
            name: device.name || 'Unnamed Device',
            id: device.id,
            latitude: latitude.toFixed(4),
            longitude: longitude.toFixed(4),
            timestamp: new Date().toLocaleString()
        });

    } catch (error) {
        console.error('Operation failed:', error);
        if (error.name === 'NotFoundError') {
            deviceList.innerHTML = `<li>Scan cancelled.</li>`;
        } else {
            deviceList.innerHTML = `<li>Error: ${error.message}</li>`;
        }
    }
});

// --- Functions ---

function saveDevice(device) {
    try {
        let history = JSON.parse(localStorage.getItem('deviceHistory')) || [];
        history.push(device);
        localStorage.setItem('deviceHistory', JSON.stringify(history));
    } catch (e) {
        console.error('Failed to save to localStorage', e);
        alert('Error: Could not save device to history. Your browser might be in private mode or have storage disabled.');
    }
}

function loadHistory() {
    historyList.innerHTML = '';
    let history = JSON.parse(localStorage.getItem('deviceHistory')) || [];
    if (history.length === 0) {
        historyList.innerHTML = '<li>No history found.</li>';
        return;
    }

    // Group by location
    const groupedByLocation = history.reduce((acc, device) => {
        const key = `${device.latitude},${device.longitude}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(device);
        return acc;
    }, {});

    for (const location in groupedByLocation) {
        const li = document.createElement('li');
        const devices = groupedByLocation[location];
        const [lat, lon] = location.split(',');

        let deviceHtml = `<b>Location: ${lat}, ${lon}</b><ul>`;
        devices.forEach(d => {
            deviceHtml += `<li><b>${d.name}</b> (ID: ${d.id})<br>Found on: ${d.timestamp}</li>`;
        });
        deviceHtml += `</ul>`;
        li.innerHTML = deviceHtml;
        historyList.appendChild(li);
    }
}

// --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
