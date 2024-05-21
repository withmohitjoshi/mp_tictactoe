const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const socket = require("socket.io");
const EVENT_NAMES = require("./resources/socket_events_names");
const { RoomModal } = require("./modals/room");

const PORT = process.env.PORT || 3000;

const DB_URL =
  "mongodb+srv://andromj4:andro316a@mptictactoecluster.1vutbfx.mongodb.net/?retryWrites=true&w=majority&appName=MpTicTacToeCluster";

mongoose
  .connect(DB_URL)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error(error));

const app = express();
const server = http.createServer(app);
const io = socket(server);

// socket connection and events here
io.on(EVENT_NAMES.connectionE, (socket) => {
  console.log("Socket get connected");

  // creating the room
  socket.on(EVENT_NAMES.createRoomE, async ({ nickname }) => {
    try {
      let roomModal = new RoomModal();
      let player = {
        socketID: socket.id,
        nickname,
        playerType: "X",
      };
      roomModal.players.push(player);
      roomModal.turn = player;
      roomModal = await roomModal.save();
      const roomId = roomModal._id;
      socket.join(roomId);
      io.to(roomId).emit(EVENT_NAMES.createRoomSuccessE, roomModal);
    } catch (error) {
      console.error(error);
    }
  });

  socket.on(EVENT_NAMES.joinRoomE, async ({ nickname, roomId }) => {
    try {
      if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
        socket.emit(EVENT_NAMES.errorOccurredE, {
          message: "Invalid Room ID!!!",
        });
        return;
      }
      let room = await RoomModal.findById(roomId);

      if (room.isJoin) {
        let player = {
          socketID: socket.id,
          nickname,
          playerType: "O",
        };
        room.players.push(player);
        room = await room.save();
        io.to(roomId).emit(EVENT_NAMES.joinRoomSuccessE, room);
      } else {
        socket.emit(EVENT_NAMES.errorOccurredE, {
          message: "Game is in progress, try again later.",
        });
        return;
      }
    } catch (error) {
      console.error(error);
    }
  });
});

app.use(express.json());

server.listen(PORT, "0.0.0.0", () =>
  console.log(`Server is started and running at port ${PORT}`)
);