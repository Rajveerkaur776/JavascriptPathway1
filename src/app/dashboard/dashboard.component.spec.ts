import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { TaskService } from '../task.service';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let taskService;
  let gettasksSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    taskService = jasmine.createSpyObj('TaskService', ['gettasks']);
    gettasksSpy = taskService.gettasks.and.returnValue(of(taskS));
    TestBed
        .configureTestingModule({
          declarations: [DashboardComponent],
          imports: [RouterTestingModule.withRoutes([])],
          providers: [{provide: TaskService, useValue: taskService}]
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should display "Top tasks" as headline', () => {
    expect(fixture.nativeElement.querySelector('h2').textContent).toEqual('Top tasks');
  });

  it('should call taskService', waitForAsync(() => {
       expect(gettasksSpy.calls.any()).toBe(true);
     }));

  it('should display 4 links', waitForAsync(() => {
       expect(fixture.nativeElement.querySelectorAll('a').length).toEqual(4);
     }));
});
