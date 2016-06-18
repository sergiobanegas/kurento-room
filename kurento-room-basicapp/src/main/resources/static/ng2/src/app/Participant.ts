/*
 * (C) Copyright 2016 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { KurentoRoom } from './KurentoRoom'
import { Room } from './Room'
import { Stream } from './Stream'

export class Participant{

    private id: number;
    private streams: Stream[] = [];
    private streamsOpts: any[]= [];
    
    constructor(private kurento: KurentoRoom,private local: any, private room: Room, private options:any){
    
        this.id = this.options.id;
        if (this.options.streams) {
            for (var streamOfOptions of this.options.streams) {
                
                let streamOpts = {
                    id: streamOfOptions.id,
                    participant: this,
                    recvVideo: (streamOfOptions.recvVideo == undefined ? true : streamOfOptions.recvVideo),
                    recvAudio: (streamOfOptions.recvAudio == undefined ? true : streamOfOptions.recvAudio)
                }
                
                let stream = new Stream(kurento, false, room, streamOpts);
                this.addStream(stream);
                this.streamsOpts.push(streamOpts);
            }
        }
        
        console.log("New " + (local ? "local " : "remote ") + "participant " + this.id
            + ", streams opts: ", this.streamsOpts);
    }

    setId(newId: number) {
        this.id = newId;
    }

    addStream(stream: Stream) {
        this.streams[stream.getID()] = stream;
        this.room.getStreams()[stream.getID()] = stream;
    }

    getStreams() {
        return this.streams;
    }

    dispose() {
        for (var key in this.streams) {
            this.streams[key].dispose();
        }
    }

    getID() {
        return this.id;
    }

    sendIceCandidate(candidate: any) {
        console.debug((this.local ? "Local" : "Remote"), "candidate for",
            this.getID(), JSON.stringify(candidate));
        this.kurento.sendRequest("onIceCandidate", {
            endpointName: this.getID(),
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex
        }, (error, response) => {
            if (error) {
                console.error("Error sending ICE candidate: "
                    + JSON.stringify(error));
            }
        });
    }

}