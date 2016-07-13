import { Component, OnInit } from '@angular/core';
import { KurentoRoom } from '../KurentoRoom';
import { Room } from '../Room';
import { Stream } from '../Stream';
import { ROUTER_DIRECTIVES, Router } from "@angular/router";
import { KurentoroomService } from '../kurentoroom.service'
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';

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

		this.getKurentoInfo("ws://127.0.0.1:8080/getAllRooms")
		.then(
			result => this.listRooms = result,
			error =>  alert(error));
		this.getKurentoInfo("ws://127.0.0.1:8080/getThresholdSpeaker")
		.then(
			result => this.thresholdSpeaker = result,
			error =>  alert(error)); 	
		this.getKurentoInfo("ws://127.0.0.1:8080/getUpdateSpeakerInterval")
		.then(
			result => this.updateSpeakerInterval = result,
			error =>  alert(error));
		this.getKurentoInfo("ws://127.0.0.1:8080/getClientConfig")
		.then(
			result => this.clientConfig = result,
			error =>  alert(error));

	}

    register() {
        this.kurentoroomService.configureService(this.userName, this.roomName, this.updateSpeakerInterval, this.thresholdSpeaker, this.clientConfig);
        this.router.navigate(['/call']);
    };

    clear () {
        this.userName = "";
        this.roomName = "";
    };

    private getKurentoInfo (url:string): Promise<any> {
        return this.http.get(url)
        .toPromise()
        .then(this.extractData)
        .catch(this.handleError);
    }

    private extractData(res: Response) {
        let body = res.json();
        return body.data || { };
    }

    private handleError (error: any) {
        let errMsg = (error.message) ? error.message :
        error.status ? `${error.status} - ${error.statusText}` : 'Error: failed to get Kurento config';
        console.error(errMsg); 
        return Promise.reject(errMsg);
    }

}

