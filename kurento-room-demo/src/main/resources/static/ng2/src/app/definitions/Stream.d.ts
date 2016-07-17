import { KurentoRoom } from './KurentoRoom';
import { Room } from './Room';
import { Participant } from './Participant';
import { StreamOptions } from './options.model';
export declare class Stream {
    private kurento;
    private local;
    private room;
    private options;
    private ee;
    private sdpOffer;
    private wrStream;
    private wp;
    private id;
    private video;
    private videoElements;
    private elements;
    private participant;
    private speechEvent;
    private recvVideo;
    private recvAudio;
    private showMyRemote;
    private localMirrored;
    constructor(kurento: KurentoRoom, local: boolean, room: Room, options: StreamOptions);
    getRecvVideo(): any;
    getRecvAudio(): any;
    subscribeToMyRemote(): void;
    displayMyRemote(): boolean;
    mirrorLocalStream(wr: any): void;
    isLocalMirrored(): boolean;
    getWrStream(): any;
    getWebRtcPeer(): any;
    addEventListener(eventName: string, listener: Function): void;
    showSpinner(spinnerParentId: string): void;
    hideSpinner(spinnerId: string): void;
    playOnlyVideo(parentElement: any, thumbnailId: string): void;
    playThumbnail(thumbnailId: string): void;
    getID(): string;
    getParticipant(): Participant;
    getGlobalID(): string;
    jq(myid: string): string;
    init(): void;
    publishVideoCallback(error: string, sdpOfferParam: string, wp: any): void;
    startVideoCallback(error: string, sdpOfferParam: string, wp: any): void;
    initWebRtcPeer(sdpOfferCallback: any): void;
    publish(): void;
    subscribe(): void;
    processSdpAnswer(sdpAnswer: any): void;
    unpublish(): void;
    dispose(): void;
}
