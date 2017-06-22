import { Component } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { Task } from '../../../../Task';

@Component({
    selector: 'tasks',
    templateUrl: 'tasks.component.html',
    styleUrls:['tasks.component.css']
})
export class TasksComponent {
    tasks: Task[];
    title: string;

    constructor(private taskService: TaskService){
        this.taskService.getTasks()
            .subscribe(tasks => {
               this.tasks = tasks;
            });
    }

    addTask(event){
        event.preventDefault();
        var newTask = this.title;
        console.log(newTask);

        this.taskService.addTask(newTask)
            .subscribe(task => {
                this.tasks.push(task);
                this.title = "";
            });

    }
}
