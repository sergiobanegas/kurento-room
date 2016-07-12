 import { Stream } from './Stream';

 declare var $;

 export class AppParticipant {

     public videoElement: any;
     private thumbnailId:any
     
     constructor(private stream: Stream){
         this.playVideo();
     }

     getStream() {
         return this.stream;
     }

     setMain () {

         let mainVideo = document.getElementById("main-video");
         let oldVideo = mainVideo.firstChild;

         this.stream.playOnlyVideo("main-video", this.thumbnailId);

         this.videoElement.className += " active-video";

         if (oldVideo !== null) {
             mainVideo.removeChild(oldVideo);
         }
     }

     removeMain() {
         $(this.videoElement).removeClass("active-video");
     }

     remove () {
         if (this.videoElement !== undefined) {
             if (this.videoElement.parentNode !== null) {
                 this.videoElement.parentNode.removeChild(this.videoElement);
             }
         }
     }

     playVideo() {

         this.thumbnailId = "video-" + this.stream.getGlobalID();

         this.videoElement = document.createElement('div');
         this.videoElement.setAttribute("id", this.thumbnailId);
         this.videoElement.className = "video";

         let buttonVideo = document.createElement('button');
         buttonVideo.className = 'action btn btn--m btn--orange btn--fab mdi md-desktop-mac';
        //FIXME this won't work, Angular can't get to bind the directive ng-click nor lx-ripple
        buttonVideo.setAttribute("ng-click", "disconnectStream();$event.stopPropagation();");
        buttonVideo.setAttribute("lx-ripple", "");
        buttonVideo.style.position = "absolute";
        buttonVideo.style.left = "75%";
        buttonVideo.style.top = "60%";
        buttonVideo.style.zIndex = "100";
        this.videoElement.appendChild(buttonVideo);
        
        let speakerSpeakingVolumen = document.createElement('div');
        speakerSpeakingVolumen.setAttribute("id","speaker" + this.thumbnailId);
        speakerSpeakingVolumen.className = 'btn--m btn--green btn--fab mdi md-volume-up blinking';
        speakerSpeakingVolumen.style.position = "absolute";
        speakerSpeakingVolumen.style.left = "3%";
        speakerSpeakingVolumen.style.top = "60%";
        speakerSpeakingVolumen.style.zIndex = "100";
        speakerSpeakingVolumen.style.display = "none";
        this.videoElement.appendChild(speakerSpeakingVolumen);

        document.getElementById("participants").appendChild(this.videoElement);
        this.stream.playThumbnail(this.thumbnailId);
    }
}