import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';

export type GameEvent = 
  | { type: 'STATE_SYNC', payload: any }
  | { type: 'SHOOT', payload: { v0: number, elevation: number, azimuth: number } }
  | { type: 'TURN_CHANGE', payload: { activePlayer: 1 | 2 } }
  | { type: 'CHAT', payload: string };

export class NetworkManager {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  public isHost: boolean = false;
  public myId: string | null = null;
  public isConnected: boolean = false;
  
  private listeners: ((event: GameEvent) => void)[] = [];

  constructor() {}

  public onEvent(listener: (event: GameEvent) => void) {
    this.listeners.push(listener);
  }

  private notifyListeners(event: GameEvent) {
    this.listeners.forEach(l => l(event));
  }

  public send(event: GameEvent) {
    if (this.connection && this.connection.open) {
      this.connection.send(event);
    }
  }

  public hostGame(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.isHost = true;
      // Initialize Peer connection. Using default PeerJS cloud server.
      this.peer = new Peer(); 
      
      this.peer.on('open', (id) => {
        this.myId = id;
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.connection = conn;
        this.setupConnection();
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS Error:', err);
        reject(err);
      });
    });
  }

  public joinGame(hostId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.peer = new Peer();

      this.peer.on('open', (id) => {
        this.myId = id;
        this.connection = this.peer!.connect(hostId);
        
        this.connection.on('open', () => {
          this.setupConnection();
          resolve();
        });

        this.connection.on('error', (err) => reject(err));
      });

      this.peer.on('error', (err) => reject(err));
    });
  }

  private setupConnection() {
    this.isConnected = true;
    
    this.connection?.on('data', (data: any) => {
      this.notifyListeners(data as GameEvent);
    });

    this.connection?.on('close', () => {
      this.isConnected = false;
      console.log('Connection closed');
    });
  }
  
  public disconnect() {
    this.connection?.close();
    this.peer?.destroy();
    this.isConnected = false;
  }
}
