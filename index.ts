import express from "express"
import { createServer } from "http"
import { Server, Socket } from "socket.io"
import { v4 as uuidv4 } from "uuid"
import "dotenv/config"

const PORT = process.env.PORT || 4000
const URL_FRONT = process.env.URL_FRONT || "http://localhost:3000"

const app = express()

//This routes are for server-side rendering only, and can't redirect to pages on a React app
app.get("/", (req, res) => {
  res.send(`<h1>Hello, World!</h1>`)
})

app.get("/new-room", (req, res) => {
  res.redirect(`/${uuidv4()}`);
})

app.get("/:room", (req, res) => {
  res.send(`<h1>Room: ${req.params.room}</h1>`)  //res.render("room", { roomId: req.params.room })
})

const http = createServer(app)
const io = new Server(http, {
  cors: {
    origin: URL_FRONT
  }
})

io.on("connection", (socket: Socket) => {

  //Logs at every connections, no matter the room:
  // console.log("Client", socket.id, "connected")

  socket.on("join-room", roomId => {
    console.log("Client", socket.id, "entered room", roomId)

    //Adds that socket to that room
    socket.join(roomId);

    //Broadcast to everyone on the APP, except the sender:
    // socket.broadcast.emit("new-user-joined-app", socket.id)
    //Broadcast to everyone on that ROOM, except the sender:
    socket.broadcast.to(roomId).emit("new-user-joined-room", socket.id)
  });

  socket.on("send-message-to-room", (roomId, userId, message) => {
    //Broadcast to everyone on that room, including the sender:
    io.to(roomId).emit("new-message-to-room", userId, message)
  })

  socket.on("disconnecting", () => {
    console.log("Client", socket.id, "disconnected")
    
    //Tell everyone else in the room that a user just left:
    const rooms = socket.rooms
    if (rooms.size > 0) {
      for (let room of rooms) {
        socket.broadcast.to(room).emit("left-room", socket.id)
      }
    }
  })
})

http.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))