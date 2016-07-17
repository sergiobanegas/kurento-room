import { KurentoRoom } from './KurentoRoom';
import { Room } from './Room';
import { Stream } from './Stream';
import { ParticipantOptions } from './options.model';
export declare class Participant {
    private kurento;
    private local;
    private room;
    private options;
    private id;
    private streams;
    private streamsOpts;
    constructor(kurento: KurentoRoom, local: boolean, room: Room, options: ParticipantOptions);
    setId(newId: string): void;
    getId(): string;
    addStream(stream: Stream): void;
    getStreams(): Stream[];
    dispose(): void;
    getID(): string;
    sendIceCandidate(candidate: any): void;
}
