const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("."));

const rooms = {}; // In-memory rooms

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms[code]);
  return code;
}

io.on("connection", (socket) => {
  let currentRoom = null;

  socket.on("createRoom", (name, callback) => {
    const code = generateRoomCode();
    rooms[code] = { users: [{ id: socket.id, name }], messages: [] };
    socket.join(code);
    currentRoom = code;
    callback(code);
  });

  socket.on("joinRoom", ({ code, name }, callback) => {
    const room = rooms[code];
    if (!room) return callback({ success: false, message: "Church not found" });
    if (room.users.length >= 2) return callback({ success: false, message: "Church full" });

    room.users.push({ id: socket.id, name });
    socket.join(code);
    currentRoom = code;
    callback({ success: true });

    const last50 = room.messages.slice(-50);
    socket.emit("loadMessages", last50);

    io.to(code).emit("systemMessage", `${name} joined the church`);
  });

  socket.on("sendMessage", ({ code, name, message }) => {
    const room = rooms[code];
    if (!room) return;

    const msg = { name, message, time: new Date().toLocaleTimeString() };
    room.messages.push(msg); // unlimited messages
    io.to(code).emit("newMessage", msg);
  });

  socket.on("disconnecting", () => {
    if (currentRoom && rooms[currentRoom]) {
      rooms[currentRoom].users = rooms[currentRoom].users.filter(u => u.id !== socket.id);
      if (rooms[currentRoom].users.length === 0) delete rooms[currentRoom];
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
