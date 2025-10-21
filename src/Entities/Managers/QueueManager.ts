export default class QueueManager {
    public queue: Array<string> = [];
    private maxQueueSize: number = 0;

    constructor(maxQueueSize: number) {
        this.maxQueueSize = maxQueueSize;
    }

    public addToQueue(packet: string): void {
        if(this.queue.length < this.maxQueueSize) this.queue.push(packet);
    }

    public clearQueue(): void {
        this.queue = [];
    }

    public format(): string {
        return this.queue.join("");
    }
}