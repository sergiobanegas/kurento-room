/*declare var Stream: any;
export class Participant{

    private id: Number;
    private streams = {};
    private streamsOpts:any[]= [];
    constructor(private kurento: any,private local: any, private room: any, private options:any){
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

    setId(newId:Number) {
        this.id = newId;
    }

    addStream(stream) {
        this.streams[stream.getID()] = stream;
        this.room.getStreams()[stream.getID()] = stream;
    }

    //this.addStream = addStream;

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

    sendIceCandidate(candidate) {
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

}*/