import { ValueObject } from '../../base/value-object';
import { ValidationError } from '../../exceptions/validation-error';

/**
 * Connection Status Enum
 */
export enum ConnectionStatusType {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  ERROR = 'error',
}

/**
 * Connection Status Value Object
 * Represents the status of a socket connection
 */
export class ConnectionStatus extends ValueObject<ConnectionStatusType> {
  constructor(value: ConnectionStatusType) {
    super(value);
  }

  protected validate(value: ConnectionStatusType): void {
    if (!Object.values(ConnectionStatusType).includes(value)) {
      throw new ValidationError('connectionStatus', `Invalid connection status: ${value}`);
    }
  }

  public static create(value: ConnectionStatusType): ConnectionStatus {
    return new ConnectionStatus(value);
  }

  public static connected(): ConnectionStatus {
    return new ConnectionStatus(ConnectionStatusType.CONNECTED);
  }

  public static disconnected(): ConnectionStatus {
    return new ConnectionStatus(ConnectionStatusType.DISCONNECTED);
  }

  public static connecting(): ConnectionStatus {
    return new ConnectionStatus(ConnectionStatusType.CONNECTING);
  }

  public static error(): ConnectionStatus {
    return new ConnectionStatus(ConnectionStatusType.ERROR);
  }

  public isConnected(): boolean {
    return this.value === ConnectionStatusType.CONNECTED;
  }

  public isDisconnected(): boolean {
    return this.value === ConnectionStatusType.DISCONNECTED;
  }

  public isConnecting(): boolean {
    return this.value === ConnectionStatusType.CONNECTING;
  }

  public isError(): boolean {
    return this.value === ConnectionStatusType.ERROR;
  }

  public get status(): ConnectionStatusType {
    return this.value;
  }

  public toString(): string {
    return this.value;
  }
}
