import { Component, OnInit } from '@angular/core';
import { KurentoRoom } from '../KurentoRoom';
import { Room } from '../Room';
import { Stream } from '../Stream';
import { ROUTER_DIRECTIVES, Router } from "@angular/router";
import { KurentoroomService } from '../kurentoroom.service'
import { Http, Response } from '@angular/http';

@Component({
	moduleId: module.id,
	selector: 'index',
	templateUrl: 'index.component.html',
	styleUrls: ['index.component.css'],
})

export class IndexComponent implements OnInit{

	private listRooms:any;        
	private clientConfig:any;
	private updateSpeakerInterval: any;
	private thresholdSpeaker: any;
	private userName:string;
	private roomName:string;

	constructor(private router: Router, private kurentoroomService: KurentoroomService, private http: Http) {

	} 

	ngOnInit(){

		this.getKurentoInfo("http://127.0.0.1:8080/getAllRooms").
		subscribe(
			data =>this.listRooms = JSON.stringify(data),
			error=>alert(error),
			()=>console.log('Finished Get Rooms')
		);

		this.getKurentoInfo("http://127.0.0.1:8080/getThresholdSpeaker").
		subscribe(
			data =>this.thresholdSpeaker = JSON.stringify(data),
			error=>alert(error),
			()=>console.log('Finished Get ThresholdSpeaker')
		);

		this.getKurentoInfo("http://127.0.0.1:8080/getUpdateSpeakerInterval").
		subscribe(
			data =>this.updateSpeakerInterval = JSON.stringify(data),
			error=>alert(error),
			()=>console.log('Finished Get UpdateSpeakerInterval')
		);

		this.getKurentoInfo("http://127.0.0.1:8080/getClientConfig").
		subscribe(
			data =>this.clientConfig = JSON.stringify(data),
			error=>alert(error),
			()=>console.log('Finished Get ClientConfig')
		);

	}

    register() {
        this.kurentoroomService.configureService(this.userName, this.roomName, this.updateSpeakerInterval, this.thresholdSpeaker, this.clientConfig);
        this.router.navigate(['/call']);
    };

    clear () {
        this.userName = "";
        this.roomName = "";
    };

    private getKurentoInfo (url:string) {
        return this.http.get(url)
      .map(res=>res.json());
    }

}
