import express from "express"
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

app.listen(PORT, () => console.log(`App listening on http://localhost:${PORT}`))