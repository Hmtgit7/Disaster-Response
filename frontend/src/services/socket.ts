import { io, Socket } from 'socket.io-client';
import { Disaster, SocialMediaPost, Resource, Report } from '../types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

if (!SOCKET_URL) {
  throw new Error("REACT_APP_SOCKET_URL is not defined. Please set it in your .env file.");
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Disaster events
    this.socket.on('disaster_updated', (disaster: Disaster) => {
      this.notifyListeners('disaster_updated', disaster);
    });

    // Real-time data events
    this.socket.on('realtime_update', (data: any) => {
      this.notifyListeners('realtime_update', data);
    });

    this.socket.on('disaster_realtime_update', (data: any) => {
      this.notifyListeners('disaster_realtime_update', data);
    });

    // Social media events
    this.socket.on('social_media_updated', (posts: SocialMediaPost[]) => {
      this.notifyListeners('social_media_updated', posts);
    });

    // Resource events
    this.socket.on('resources_updated', (resources: Resource[]) => {
      this.notifyListeners('resources_updated', resources);
    });

    this.socket.on('resource_deleted', (data: { id: string }) => {
      this.notifyListeners('resource_deleted', data);
    });

    // Report events
    this.socket.on('report_created', (report: Report) => {
      this.notifyListeners('report_created', report);
    });

    this.socket.on('report_verified', (report: Report) => {
      this.notifyListeners('report_verified', report);
    });

    this.socket.on('report_deleted', (data: { id: string }) => {
      this.notifyListeners('report_deleted', data);
    });

    // Weather and emergency events
    this.socket.on('weather_alert', (alert: any) => {
      this.notifyListeners('weather_alert', alert);
    });

    this.socket.on('emergency_alert', (alert: any) => {
      this.notifyListeners('emergency_alert', alert);
    });
  }

  // Join a disaster room to receive updates for that specific disaster
  joinDisaster(disasterId: string) {
    if (this.socket) {
      this.socket.emit('join-disaster', disasterId);
    }
  }

  // Leave a disaster room
  leaveDisaster(disasterId: string) {
    if (this.socket) {
      this.socket.emit('leave-disaster', disasterId);
    }
  }

  // Subscribe to events
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // Unsubscribe from events
  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Notify all listeners for an event
  private notifyListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket instance (for advanced usage)
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService(); 