import { Component } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { Task } from '../../../../Task';
import { Messages } from '../../../../Messages';

@Component({
    selector: 'tasks',
    templateUrl: 'tasks.component.html',
    styleUrls:['tasks.component.css']
})
export class TasksComponent {
    tasks: Task[];
    sentMessages: Messages[];
    title: string;
    dateGenerated: any;

    constructor(private taskService: TaskService){
        this.taskService.getTasks()
            .subscribe(tasks => {
               this.tasks = tasks;
            });

        this.taskService.getMessages()
            .subscribe(sentMessages => {
                this.sentMessages = sentMessages;
            });
    }

    addTask(event){
        event.preventDefault();
        this.dateGenerated = new Date();
        let newTask = {
            text: this.title,
            date: this.dateGenerated
        };
        console.log(newTask);

        //this.sentMessages.push(newTask);
        //console.log(Messages);

        this.taskService.addTask(newTask)
            .subscribe(Messages => {
                this.sentMessages.push(Messages);
                this.title = "";
            });

    }

}
