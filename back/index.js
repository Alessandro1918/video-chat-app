const express = require('express');
const httpServer = require('http')
const cors = require('cors');
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 4000

const app = express()

app.use(cors());

app.get("/", (req, res) => {
  res.send(`<h1>Hello, World!</h1>`)
})

app.get("/new-room", (req, res) => {
  res.redirect(`/${uuidv4()}`);
})

app.get("/:room", (req, res) => {
  res.send(`<h1>Room: ${req.params.room}</h1>`)  //res.render("room", { roomId: req.params.room })
})

const http = httpServer.Server(app);

const io = require('socket.io')(http, {
  cors: {
      origin: "http://localhost:3000"
  }
});

io.on('connection', (socket) => {

  console.log(`⚡: ${socket.id} user just connected!`);
  
  socket.on('disconnect', () => {
    console.log('🔥: A user disconnected');
  });
});

http.listen(PORT, () => console.log(`App listening on http://localhost:${PORT}`))