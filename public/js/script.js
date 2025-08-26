const socket = io();
let username = "";
let map;
let userMarker;
let userMarkers = {};
let userListOpen = false;
let userData = {}; 

function createAnimatedMapBackground() {
    const container = document.getElementById('animatedMapBg');
    
    for (let i = 0; i < 20; i++) {
        const horizontalLine = document.createElement('div');
        horizontalLine.className = 'map-line horizontal';
        horizontalLine.style.top = (i * 10) + '%';
        horizontalLine.style.animationDelay = (i * 0.5) + 's';
        container.appendChild(horizontalLine);
        
        const verticalLine = document.createElement('div');
        verticalLine.className = 'map-line vertical';
        verticalLine.style.left = (i * 10) + '%';
        verticalLine.style.animationDelay = (i * 0.5) + 's';
        container.appendChild(verticalLine);
    }
    
    for (let i = 0; i < 15; i++) {
        const node = document.createElement('div');
        node.className = 'map-node';
        node.style.top = Math.random() * 100 + '%';
        node.style.left = Math.random() * 100 + '%';
        node.style.animationDelay = (Math.random() * 2) + 's';
        container.appendChild(node);
    }
    
    for (let i = 0; i < 8; i++) {
        const roadH = document.createElement('div');
        roadH.className = 'road road-horizontal';
        roadH.style.top = (Math.random() * 80 + 10) + '%';
        roadH.style.width = '80%';
        roadH.style.left = '10%';
        container.appendChild(roadH);
        
        const roadV = document.createElement('div');
        roadV.className = 'road road-vertical';
        roadV.style.left = (Math.random() * 80 + 10) + '%';
        roadV.style.height = '80%';
        roadV.style.top = '10%';
        container.appendChild(roadV);
    }
    
    const marker = document.createElement('div');
    marker.className = 'moving-marker';
    container.appendChild(marker);
    
    for (let i = 0; i < 5; i++) {
        const pulseDot = document.createElement('div');
        pulseDot.className = 'pulse-dot';
        pulseDot.style.top = (Math.random() * 80 + 10) + '%';
        pulseDot.style.left = (Math.random() * 80 + 10) + '%';
        pulseDot.style.animationDelay = (Math.random() * 2) + 's';
        container.appendChild(pulseDot);
    }
}

function startTracking() {
    username = document.getElementById('username').value.trim() || "Anonymous";
    if (!username) {
        const input = document.getElementById('username');
        input.classList.add('border-red-500');
        input.placeholder = "Please enter your name first!";
        setTimeout(() => {
            input.classList.remove('border-red-500');
        }, 2000);
        return;
    }
    
    const startBtn = document.getElementById('startBtn');
    const loadingIcon = document.getElementById('loadingIcon');
    const locationAccess = document.getElementById('locationAccess');
    startBtn.disabled = true;
    loadingIcon.classList.remove('hidden');
    locationAccess.style.display = 'block';
    
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                initMap(position.coords.latitude, position.coords.longitude);
                
                navigator.geolocation.watchPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    socket.emit("send-location", { username, latitude, longitude });
                }, (error) => {
                    console.error(error);
                }, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0,
                });
                
                socket.emit("send-location", { 
                    username, 
                    latitude: position.coords.latitude, 
                    longitude: position.coords.longitude 
                });
                
                const overlay = document.getElementById('overlay');
                overlay.classList.remove('overlay-enter');
                overlay.classList.add('overlay-exit');
                
                setTimeout(() => {
                    const mapElement = document.getElementById('map');
                    mapElement.style.opacity = "1";
                    
                    document.getElementById('toggleUserList').style.display = 'flex';
                    
                    setTimeout(() => {
                        overlay.style.display = 'none';
                    }, 800);
                }, 500);
            },
            function(error) {
                console.error("Error getting location:", error);
                locationAccess.innerHTML = `
                    <p class="text-red-400">
                        Could not access your location. Please ensure location services are enabled.
                    </p>
                    <button onclick="startTracking()" class="mt-2 text-blue-400 font-medium">
                        Try Again
                    </button>
                `;
                startBtn.disabled = false;
                loadingIcon.classList.add('hidden');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        locationAccess.innerHTML = '<p class="text-red-400">Geolocation is not supported by your browser.</p>';
        startBtn.disabled = false;
        loadingIcon.classList.add('hidden');
    }
}

function initMap(lat, lng) {
    map = L.map('map').setView([lat, lng], 15);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
    
    const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    userMarker = L.marker([lat, lng], {icon: userIcon}).addTo(map)
        .bindPopup(`<b>You</b><br>${username}`)
        .openPopup();
    
    L.circle([lat, lng], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        radius: 50
    }).addTo(map);
}

socket.on("recieve-location", (data) => {
    const { id, username, latitude, longitude, color } = data;
    
    userData[id] = { username, color };
    
    if (id === socket.id) {
        map.setView([latitude, longitude], 16);
        if (userMarker) {
            userMarker.setLatLng([latitude, longitude]);
        }
    }
    
    if (id !== socket.id) {
        const icon = new L.Icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        if (userMarkers[id]) {
            userMarkers[id].setLatLng([latitude, longitude]);
        } else {
            userMarkers[id] = L.marker([latitude, longitude], { icon }).addTo(map);
            userMarkers[id].bindPopup(`User: ${username}`).openPopup();
        }
        
        updateUserList();
    }
});

socket.on("user-disconnected", (id) => {
    if (userMarkers[id]) {
        map.removeLayer(userMarkers[id]);
        delete userMarkers[id];
    }
    if (userData[id]) {
        delete userData[id];
    }
    updateUserList();
});

function updateUserList() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    
    const currentUserItem = document.createElement('div');
    currentUserItem.className = 'user-item';
    currentUserItem.innerHTML = `
        <span class="status-indicator status-online"></span>
        <span class="user-color" style="background-color: #3b82f6;"></span>
        <span>You (${username})</span>
    `;
    userList.appendChild(currentUserItem);
    
    for (const id in userData) {
        if (id !== socket.id) {
            const user = userData[id];
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <span class="status-indicator status-online"></span>
                <span class="user-color" style="background-color: ${user.color || '#ef4444'};"></span>
                <span>${user.username}</span>
            `;
            userList.appendChild(userItem);
        }
    }
}

function toggleUserList() {
    const userListPanel = document.getElementById('userListPanel');
    userListOpen = !userListOpen;
    
    if (userListOpen) {
        userListPanel.style.display = 'block';
        updateUserList();
    } else {
        userListPanel.style.display = 'none';
    }
}

document.getElementById('username').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        startTracking();
    }
});

document.getElementById('toggleUserList').addEventListener('click', toggleUserList);

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('username').focus();
    createAnimatedMapBackground();
});