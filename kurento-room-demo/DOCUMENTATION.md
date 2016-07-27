
#Client TypeScript API

The developer of room applications can use this API when implementing the web interface.

It is a TypeScript library build upon other public APIs like Kurento Utils JS, Kurento JSON-RPC Client JS, EventEmitter, etc. This module can be added as a Maven dependency to projects implementing the client-side code for web browsers that support WebRTC.

The library contains four TypeScript classes, extracted from the file KurentoRoom.js of the module kurento-room-client-js.

The main classes of this library are the following:

* KurentoRoom: main class that initializes the room and the local stream, also used to communicate with the server
* Room: the room abstraction, provides access to local and remote participants and their streams
* Participant: a peer (local or remote) in the room
* Stream: wrapper for media streams published in the room

##KurentoRoom

Example:
```
let kurento = new KurentoRoom(wsUri,(error, kurento) => {...});
```
Through this initialization function, we indicate the WebSocket URI that will be used to send and receive messages from the server.

The result of opening the WebSocket connection is announced through a callback that is passed as parameter. The callback’s signature also includes as parameter a reference to the own KurentoRoom object, giving access to its API when the connection was established successfully.

The interface of KurentoRoom includes the creation of the Room and of the local stream and also, for convenience, the following:

Disconnect an active participant, be it remote or local media. This method allows to unsubscribe from receiving media from another peer or to end publishing the local media:
```
kurento.disconnectParticipant(stream);
```
---------------
Close the connection to the server and release all resources:
```
kurento.close();
```
---------------
Send messages to the other peers:
```
kurento.sendMessage(room, user, message);
```
---------------
Send a custom request whose parameters and response handling is left to the developer. In the demo application it is used to toggle the hat filter.
```
kurento.sendCustomRequest(params, (error, response) => {...});
```
---------------
Add additional parameters to all WebSocket requests sent to server.
```
kurento.setRpcParams(params);
```
---------------
##Room

Example:
```
let room = new Room(options);
```
This constructor requires a parameter which consists of the following attributes:

* room: mandatory, the name of the room
* user: mandatory, the name of the peer inside the room
* subscribeToStreams: optional, can be true (default value) or false. If false, the user won’t get automatic subscription to the published streams, but will have to explicitly subscribe in order to receive media.

###connect() method

The room interface’s main component is the connect method:
```
room.connect();
```
Instead of using a callback for dealing with the result of this operation, the client must subscribe to events emitted by the room:
###room-connected event

Example:
```
room.addEventListener("room-connected", (data) => {...});
```
* data.participants: array of existing Participant
* data.streams: array of existing Stream

Emitted in case the join room operation was successful.
###error-room event

Example:
```
room.addEventListener("error-room", (data) => {...});
```
* data.error: the error object (use data.error.message for the description)
When an error occurred when trying to register into the room.

Other events emitted during the lifecycle of the room:
###room-closed event

Example:
```
room.addEventListener("room-closed",(data) => {...}
```
* data.room: the room’s name

Emitted as a result of a server notification that the room has been forcibly closed. Receiving this event is advised to be followed by an orderly exit from the room (alert the user and close all resources associated with the room).
###participant-joined event

Example:
```
room.addEventListener("participant-joined", (data) => {...});
```
* data.participant: a new Participant

Announces that a new peer has just joined the room.
###participant-left event

Example:
```
room.addEventListener("participant-left", (data) => {...});
```
* data.participant: the Participant instance

Announces that a peer has left the room.
###participant-evicted event

Example:
```
room.addEventListener("participant-evicted", (data) => {...});
```
* data.localParticipant: the local Participant instance

Announces that this peer has to leave the room as requested by the application.
###participant-published event

Example:
```
room.addEventListener("participant-published", (data) => {...});
```
* data.participant: the Participant instance

Emitted when a publisher announces the availability of her media stream.
###stream-published event

Example:
```
room.addEventListener("stream-published", (data) => {...});
```
* data.stream: the local Stream instance

Sent after the local media has been published to the room.
###stream-subscribed event

Example:
```
room.addEventListener("stream-subscribed", (data) => {...});
```
* data.stream: the subscribed to Stream instance

Event that informs on the success of the subscribe operation.
###stream-added event

Example:
```
room.addEventListener("stream-added", (data) => {...});
```
* data.stream: the new Stream instance

When the room automatically added and subscribed to a published stream.
###stream-removed event

Example:
```
room.addEventListener("stream-removed", (data) => {...});
```
* data.stream: the disposed Stream instance

A consequence of a peer disconnecting from the room or unpublishing their media.
###error-media event

Example:
```
room.addEventListener("error-media", (data) => {...});
```
* data.error: the error message

The server is notifying of an exception in the media server. The application should inform the user about the error and, in most cases, should proceed with an orderly exit from the room.
###newMessage event

Example:
```
room.addEventListener("newMessage", (data) => {...});
```
* data.room: the room in which the message was sent
* data.user: the sender
* data.message: the text message

Upon reception of a message from a peer in the room (the sender is also notified using this event).
##Participant

This is more of an internal data structure (the client shouldn’t create instances of this type), used to group distinct media streams from the same room peer. Currently the room server only supports one stream per user.

It is a component in the data object for several emitted room events ( room-connected, participant-joined, participant-left, participant-published).
##Stream

Example:
```
let localStream = new Stream(room, options);
```
The initialization of the local stream requires the following parameters:

* room: mandatory, the Room instance

* options: required object whose attributes are optional

** participant: to whom belongs the stream
** id: stream identifier (if null, will use the String webcam)

###init method

The stream interface’s main component is the init method, which will trigger a request towards the user to grant access to the local camera and microphone:
```
localStream.init();
```
Instead of using a callback for dealing with the result of this operation, the client must subscribe to events emitted by the stream:
###access-accepted event

Example:
```
localStream.addEventListener("access-accepted", () => {...});
```
Emitted in case the user grants access to the camera and microphone.
###access-denied event

Example:
```
localStream.addEventListener("access-denied", () => {...});
```
Sent when the user denies access to her camera and microphone.
###getID() method

The identifier of the stream, usually webcam.
###getGlobalID() method

Calculates a global identifier by mixing the owner’s id (the participant name) and the local id. E.g. user1_webcam.

There are several other methods exposed by the Stream interface, they will be described in the tutorial for making a room application.
