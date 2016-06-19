import {Participant} from './Participant'
import {Stream} from './Stream'

export interface RoomOptions {
	room: string;
	user: string;
	subscribeToStreams: boolean;
	updateSpeakerInterval: number;
	thresholdSpeaker: number;
}

export interface StreamOptions {
	id: string;
	participant: Participant;
	recvVideo: any;
	recvAudio: any;
	video: boolean;
	audio: boolean;
	data: boolean;
}

export interface ParticipantOptions {
	id: string,
	streams: StreamOptions[];
}