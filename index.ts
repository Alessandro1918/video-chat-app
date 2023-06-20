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

    //List of other users in the room. Send this back to the sender:
    io.in(roomId).fetchSockets().then(sockets => {
      let users:string[] = []
      sockets.map(s => {
        if (socket.id != s.id) {
          users.push(s.id)
        }
      })
      if (users.length > 0) {
        io.to(socket.id).emit("list-room-users", users)
      }
      console.log(`+ Room ${roomId} has now ${users.length + 1} users`)
    })
  });

  //New user is initiating it's stream
  socket.on("send-signal", payload => {
    io.to(payload.receiverId).emit("new-signal-available", {signal: payload.signal, callerId: payload.callerId})
  })
  
  //Old user is responding with it's own stream
  socket.on("return-signal", payload => {
    io.to(payload.callerId).emit("return-signal-available", {signal: payload.signal, id: socket.id})
  })

  socket.on("send-message-to-room", (roomId, userId, message) => {
    //Broadcast to everyone on that room, including the sender:
    io.to(roomId).emit("new-message-to-room", userId, message)
  })

  socket.on("disconnecting", () => {
    console.log("Client", socket.id, "disconnected")
    
    //Tell everyone else in the room that a user just left:
    const rooms = socket.rooms
    if (rooms.size > 1) { //each socket has 2 rooms: it's own room (userId), and the meeting room (roomId)
      for (let room of rooms) {
        if (room !== socket.id) {
          socket.broadcast.to(room).emit("left-room", socket.id)
          io.in(room).fetchSockets().then(sockets => {
            let users:string[] = []
            sockets.map(s => {
              if (socket.id != s.id) {
                users.push(s.id)
              }
            })
            console.log(`- Room ${room} has now ${users.length} users`)
          })
        }
      }
    }
  })
})

http.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))