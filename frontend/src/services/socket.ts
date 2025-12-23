import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

class SocketService {
    private socket: Socket | null = null;
    private listeners: ((notification: any) => void)[] = [];

    connect(userId: string) {
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.socket?.emit('join_user_room', { user_id: userId });
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('notification', (data) => {
            console.log('New notification:', data);
            this.notifyListeners(data);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    onNotification(callback: (notification: any) => void) {
        this.listeners.push(callback);
    }

    offNotification(callback: (notification: any) => void) {
        this.listeners = this.listeners.filter((l) => l !== callback);
    }

    private notifyListeners(data: any) {
        this.listeners.forEach((listener) => listener(data));
    }
}

export const socketService = new SocketService();
