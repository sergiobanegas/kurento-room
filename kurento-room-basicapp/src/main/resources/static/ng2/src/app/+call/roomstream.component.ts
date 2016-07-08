import { Component, OnInit, Input, NgZone } from '@angular/core';
import { Stream } from '../Stream'
import { Room } from '../Room'
import {DomSanitizationService, SafeUrl} from '@angular/platform-browser';
import { KurentoroomService } from '../kurentoroom.service'

@Component({
  moduleId: module.id,
  selector: 'roomstream',
  templateUrl: 'roomstream.component.html'
})
export class RoomStreamComponent {

  @Input()
  stream: Stream;

  public src:SafeUrl;

  constructor(private sanitizer: DomSanitizationService, private zone:NgZone){}

  ngOnInit(){  
		this.stream.addEventListener('src-added', (streamEvent:any) => {
			this.src=this.sanitizer.bypassSecurityTrustUrl(this.stream.src);
		});
  }

}
