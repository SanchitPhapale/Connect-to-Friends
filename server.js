const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let users = [];

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join", (name) => {
    users.push({ id: socket.id, name });

    // Send full list to new user
    socket.emit("all-users", users);

    // Inform others
    socket.broadcast.emit("user-joined", {
      id: socket.id,
      name
    });
  });

  socket.on("offer", (data) => {
    socket.to(data.target).emit("offer", {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on("answer", (data) => {
    socket.to(data.target).emit("answer", {
      answer: data.answer,
      sender: socket.id
    });
  });

  socket.on("ice", (data) => {
    socket.to(data.target).emit("ice", {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  socket.on("disconnect", () => {
    users = users.filter(user => user.id !== socket.id);
    socket.broadcast.emit("user-left", socket.id);
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
