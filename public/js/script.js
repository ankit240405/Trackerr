const socket = io();
let username = "";

function startTracking() {
    username = document.getElementById("username").value || "Anonymous";
    document.getElementById("overlay").style.display = "none";

    if (navigator.geolocation) {
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
    }
}

const map = L.map("map").setView([0, 0], 10);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "By-Ankit Sharma"
}).addTo(map);

const markers = {};

socket.on("recieve-location", (data) => {
    const { id, username, latitude, longitude, color } = data;
    map.setView([latitude, longitude], 16);

    const icon = new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude], { icon }).addTo(map);
        markers[id].bindPopup(`User: ${username}`).openPopup();
    }
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
