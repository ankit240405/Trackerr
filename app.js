const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

function getRandomColor() {
    const colors = ["red", "blue", "green", "purple", "orange", "yellow"];
    return colors[Math.floor(Math.random() * colors.length)];
}

io.on("connection", (socket) => {
    const userColor = getRandomColor();
    console.log("User connected:", socket.id);

    socket.on("send-location", (data) => {
        socket.broadcast.emit("recieve-location", { 
            id: socket.id, 
            color: userColor, 
            username: data.username, 
            latitude: data.latitude, 
            longitude: data.longitude 
        });
    });

    socket.on("disconnect", () => {
        io.emit("user-disconnected", socket.id);
        console.log("User disconnected:", socket.id);
    });
});

app.get("/", function(req, res) {
    res.render("index");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));