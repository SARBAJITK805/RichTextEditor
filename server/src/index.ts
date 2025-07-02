import express from 'express'
import http from 'http'
import { Server } from "socket.io";
import cors from 'cors'

const app = express()
app.use(express.json())
app.use(cors())
const server = http.createServer(app)

const activeRooms = new Map<string, Set<string>>();

const io = new Server(server, {
    cors: {
        origin: "https://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
})

interface SocketData {
    doc_id: string
    user_id: string,
    user_name?: string
}

interface EditData {
    content: string;
    position: number;
    operation: 'insert' | 'delete' | 'format';
    timestamp: number;
}

interface CursorData {
    user_id: string;
    user_name: string;
    position: number;
    selection?: {
        from: number;
        to: number;
    };
}

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    const doc_id = socket.handshake.query.doc_id as string
    const user_id = socket.handshake.query.user_id as string
    const user_name = socket.handshake.query.user_name as string

    if (!doc_id || !user_id) {
        console.log('No doc_id or user_id provided,disconnecting...');
        socket.emit('error', { message: 'Document ID and User ID is required' });
        socket.disconnect()
        return
    }

    socket.data = { user_id, doc_id, user_name }

    const roomName = `room_doc_${doc_id}`
    socket.join(roomName)

    if (activeRooms.has(roomName)) {
        activeRooms.set(roomName, new Set());
    }
    activeRooms?.get(roomName)?.add(user_id)

    socket.to(roomName).emit('user-joined', {
        user_id,
        user_name,
        message: `${user_name} joined the document`
    })

    const activeUsers = Array.from(activeRooms.get(roomName) || [])
    socket.to(roomName).emit('active-users', { users: activeUsers })

    socket.on('document-edit', (editData: EditData) => {
        if (!editData || typeof editData.content !== 'string') {
            socket.emit('error', { message: 'Invalid edit data' });
            return;
        }
        const enrichedEditData = {
            ...editData,
            user_id: socket.data.user_id,
            user_name: socket.data.user_name,
            socket_id: socket.id,
            timestamp: Date.now()
        };

        socket.to(roomName).emit('document-edit', enrichedEditData)
    })

    socket.on('cursor-update', (cursorData: CursorData) => {
        const enrichedCursorData = {
            ...cursorData,
            user_id: socket.data.user_id,
            user_name: socket.data.user_name,
            socket_id: socket.id
        }
        socket.to(roomName).emit('cursor-update', enrichedCursorData)
    })

    socket.on('typing-start', () => {
        socket.to(roomName).emit('typing-start', {
            user_id: socket.data.user_id,
            user_name: socket.data.user_name
        });
    });

    socket.on('typing-stop', () => {
        socket.to(roomName).emit('typing-stop', {
            user_id: socket.data.user_id,
            user_name: socket.data.user_name
        });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id)
        const socketData = socket.data as SocketData
        if (socketData.doc_id && socketData.user_id) {
            const roomName = `room_doc_${socketData.doc_id}`;
            activeRooms.get(roomName)?.delete(socketData.user_id);

            if (activeRooms.get(roomName)?.size == 0) {
                activeRooms.delete(roomName)
            }

            socket.to(roomName).emit('user-left', {
                user_id: socketData.user_id,
                user_name: socketData.user_name,
                message: `${socketData.user_name} left the document`
            });
        }
    })
})

server.on('error', (err) => {
    console.error('Server error:', err);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

server.listen(8080, () => {
    console.log('WebSocket server running at http://localhost:8080');
});