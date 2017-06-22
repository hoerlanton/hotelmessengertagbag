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

    addTask(newTask){
        var headers = new Headers();
        headers.append('Content-Type', 'application/x-www-form-urlencoded');
        console.log(headers);
        return this.http.post('guestsMessage', JSON.stringify(newTask), {headers: headers} )
            .map(res => res.json());
    }


}