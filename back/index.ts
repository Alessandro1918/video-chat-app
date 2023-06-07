import express from "express"
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from "uuid"

const PORT = process.env.PORT || 4000

const app = express()

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
    origin: "http://localhost:3000"
  }
})

io.on("connection", (socket: Socket) => {
  console.log("Client", socket.id, "connected")

  socket.on("disconnect", () => {
    console.log("Client", socket.id, "disconnected")
  })
})

http.listen(PORT, () => console.log(`App listening on http://localhost:${PORT}`))