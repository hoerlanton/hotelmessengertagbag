import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class TaskService{
    constructor(private http:Http){
        console.log('Task service initialized!');
    }
    getTasks(){
        return this.http.get('guests')
            .map(res => res.json());
    }
    getMessages(){
        return this.http.get('guestsMessages')
            .map(res => res.json());
    }

    addTask(newTask){
        var headers = new Headers();
        headers.append('Content-Type', 'application/json');
        console.log(headers);
        return this.http.post('guestsMessage', newTask, {headers: headers} )
            .map(res => res.json());
    }
}