class SnowflakeId {
  private epoch: number = 1704067200000; // Custom Epoch (2024-01-01 00:00:00 UTC)
  private workerId: number;
  private datacenterId: number;
  private sequence: number = 0;
  private lastTimestamp: number = -1;

  private workerIdBits = 5;
  private datacenterIdBits = 5;
  private sequenceBits = 12;

  private workerIdShift = this.sequenceBits;
  private datacenterIdShift = this.sequenceBits + this.workerIdBits;
  private timestampLeftShift = this.sequenceBits + this.workerIdBits + this.datacenterIdBits;

  private sequenceMask = -1 ^ (-1 << this.sequenceBits);

  constructor() {
    this.workerId = Math.floor(Math.random() * 31);
    this.datacenterId = Math.floor(Math.random() * 31);
  }

  public nextId(): bigint {
    let timestamp = this.timeGen();

    if (timestamp < this.lastTimestamp) {
      throw new Error("Clock moved backwards. Refusing to generate id");
    }

    if (this.lastTimestamp === timestamp) {
      this.sequence = (this.sequence + 1) & this.sequenceMask;
      if (this.sequence === 0) {
        timestamp = this.tilNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    const id = 
      (BigInt(timestamp - this.epoch) << BigInt(this.timestampLeftShift)) |
      (BigInt(this.datacenterId) << BigInt(this.datacenterIdShift)) |
      (BigInt(this.workerId) << BigInt(this.workerIdShift)) |
      BigInt(this.sequence);

    return id;
  }

  private tilNextMillis(lastTimestamp: number): number {
    let timestamp = this.timeGen();
    while (timestamp <= lastTimestamp) {
      timestamp = this.timeGen();
    }
    return timestamp;
  }

  private timeGen(): number {
    return Date.now();
  }
}

export const snowflake = new SnowflakeId();

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function toBase62(integer: bigint): string {
  if (integer === 0n) return "0";
  let s = "";
  let n = integer;
  const base = 62n;
  while (n > 0n) {
    s = CHARS[Number(n % base)] + s;
    n = n / base;
  }
  return s;
}

export function generateSnowflakeCode(): string {
  const id = snowflake.nextId();
  return 'MV' + toBase62(id); 
}
