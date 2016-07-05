import { Component, OnInit, Input } from '@angular/core';
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


  @Input()
  src:SafeUrl;

  constructor(private sanitizer: DomSanitizationService){
	}

  ngOnInit(){  
  }


}
