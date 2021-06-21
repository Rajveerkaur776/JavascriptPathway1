import { Component, OnInit } from '@angular/core';

import { Task } from '../task';
import { TaskService } from '../task.service';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TaskTasksComponent implements OnInit {
  tasks: Task[] = [];

  constructor(private taskService: TaskService) { }

  ngOnInit() {
    this.gettasks();
  }

  gettasks(): void {
    this.taskService.gettasks()
    .subscribe(tasks => this.tasks = tasks);
  }

  add(name: string): void {
    name = name.trim();
    if (!name) { return; }
    this.taskService.addTask({ name } as Task)
      .subscribe(task => {
        this.tasks.push(task);
      });
  }

  delete(task: Task): void {
    this.tasks = this.tasks.filter(h => h !== task);
    this.taskService.deleteTask(task.id).subscribe();
  }

}
