import express from 'express'
import http from 'http'
import { Server } from "socket.io";
import cors from 'cors'

const app = express()
app.use(express.json())
app.use(cors())
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
})

io.on('connection', (socket) => {
    console.log('a user connected');
    const doc_id = socket.handshake.query.doc_id
    const edit_docs = socket.handshake.query.edit
    socket.join(`room_doc_${doc_id}`)
    io.to(`room_doc_${doc_id}`).emit('edit', edit_docs)
})

server.listen(8080, () => {
    console.log('server running at http://localhost:8080');
});