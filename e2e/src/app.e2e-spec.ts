import { browser, element, by, ElementFinder, ElementArrayFinder } from 'protractor';

const expectedH1 = 'Tour of tasks';
const expectedTitle = `${expectedH1}`;
const targetTask = { id: 15, name: 'Magneta' };
const targetTaskDashboardIndex = 3;
const nameSuffix = 'X';
const newTaskName = targetTask.name + nameSuffix;

class Task {
  constructor(public id: number, public name: string) {}

  // Factory methods

  // Task from string formatted as '<id> <name>'.
  static fromString(s: string): Task {
    return new Task(
      +s.substr(0, s.indexOf(' ')),
      s.substr(s.indexOf(' ') + 1),
    );
  }

  // Task from task list <li> element.
  static async fromLi(li: ElementFinder): Promise<Task> {
    const stringsFromA = await li.all(by.css('a')).getText();
    const strings = stringsFromA[0].split(' ');
    return { id: +strings[0], name: strings[1] };
  }

  // Task id and name from the given detail element.
  static async fromDetail(detail: ElementFinder): Promise<Task> {
    // Get task id from the first <div>
    const id = await detail.all(by.css('div')).first().getText();
    // Get name from the h2
    const name = await detail.element(by.css('h2')).getText();
    return {
      id: +id.substr(id.indexOf(' ') + 1),
      name: name.substr(0, name.lastIndexOf(' '))
    };
  }
}

describe('Tutorial part 6', () => {

  beforeAll(() => browser.get(''));

  function getPageElts() {
    const navElts = element.all(by.css('app-root nav a'));

    return {
      navElts,

      appDashboardHref: navElts.get(0),
      appDashboard: element(by.css('app-root app-dashboard')),
      toptasks: element.all(by.css('app-root app-dashboard > div a')),

      apptasksHref: navElts.get(1),
      apptasks: element(by.css('app-root app-tasks')),
      alltasks: element.all(by.css('app-root app-tasks li')),
      selectedTaskSubview: element(by.css('app-root app-tasks > div:last-child')),

      taskDetail: element(by.css('app-root app-task-detail > div')),

      searchBox: element(by.css('#search-box')),
      searchResults: element.all(by.css('.search-result li'))
    };
  }

  describe('Initial page', () => {

    it(`has title '${expectedTitle}'`, async () => {
      expect(await browser.getTitle()).toEqual(expectedTitle);
    });

    it(`has h1 '${expectedH1}'`, async () => {
      await expectHeading(1, expectedH1);
    });

    const expectedViewNames = ['Dashboard', 'tasks'];
    it(`has views ${expectedViewNames}`, async () => {
      const viewNames = await getPageElts().navElts.map(el => el!.getText());
      expect(viewNames).toEqual(expectedViewNames);
    });

    it('has dashboard as the active view', async () => {
      const page = getPageElts();
      expect(await page.appDashboard.isPresent()).toBeTruthy();
    });

  });

  describe('Dashboard tests', () => {

    beforeAll(() => browser.get(''));

    it('has top tasks', async () => {
      const page = getPageElts();
      expect(await page.toptasks.count()).toEqual(4);
    });

    it(`selects and routes to ${targetTask.name} details`, dashboardSelectTargetTask);

    it(`updates task name (${newTaskName}) in details view`, updateTaskNameInDetailView);

    it(`cancels and shows ${targetTask.name} in Dashboard`, async () => {
      await element(by.buttonText('go back')).click();
      await browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

      const targettasklt = getPageElts().toptasks.get(targetTaskDashboardIndex);
      expect(await targettasklt.getText()).toEqual(targetTask.name);
    });

    it(`selects and routes to ${targetTask.name} details`, dashboardSelectTargetTask);

    it(`updates task name (${newTaskName}) in details view`, updateTaskNameInDetailView);

    it(`saves and shows ${newTaskName} in Dashboard`, async () => {
      await element(by.buttonText('save')).click();
      await browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

      const targettasklt = getPageElts().toptasks.get(targetTaskDashboardIndex);
      expect(await targettasklt.getText()).toEqual(newTaskName);
    });

  });

  describe('tasks tests', () => {

    beforeAll(() => browser.get(''));

    it('can switch to tasks view', async () => {
      await getPageElts().apptasksHref.click();
      const page = getPageElts();
      expect(await page.apptasks.isPresent()).toBeTruthy();
      expect(await page.alltasks.count()).toEqual(10, 'number of tasks');
    });

    it('can route to task details', async () => {
      await getTaskLiEltById(targetTask.id).click();

      const page = getPageElts();
      expect(await page.taskDetail.isPresent()).toBeTruthy('shows task detail');
      const task = await Task.fromDetail(page.taskDetail);
      expect(task.id).toEqual(targetTask.id);
      expect(task.name).toEqual(targetTask.name.toUpperCase());
    });

    it(`updates task name (${newTaskName}) in details view`, updateTaskNameInDetailView);

    it(`shows ${newTaskName} in tasks list`, async () => {
      await element(by.buttonText('save')).click();
      await browser.waitForAngular();
      const expectedText = `${targetTask.id} ${newTaskName}`;
      expect(await getTaskAEltById(targetTask.id).getText()).toEqual(expectedText);
    });

    it(`deletes ${newTaskName} from tasks list`, async () => {
      const tasksBefore = await toTaskArray(getPageElts().alltasks);
      const li = getTaskLiEltById(targetTask.id);
      await li.element(by.buttonText('x')).click();

      const page = getPageElts();
      expect(await page.apptasks.isPresent()).toBeTruthy();
      expect(await page.alltasks.count()).toEqual(9, 'number of tasks');
      const tasksAfter = await toTaskArray(page.alltasks);
      // console.log(await Task.fromLi(page.alltasks[0]));
      const expectedtasks =  tasksBefore.filter(h => h.name !== newTaskName);
      expect(tasksAfter).toEqual(expectedtasks);
      // expect(page.selectedTaskSubview.isPresent()).toBeFalsy();
    });

    it(`adds back ${targetTask.name}`, async () => {
      const addedTaskName = 'Alice';
      const tasksBefore = await toTaskArray(getPageElts().alltasks);
      const numtasks = tasksBefore.length;

      await element(by.css('input')).sendKeys(addedTaskName);
      await element(by.buttonText('Add task')).click();

      const page = getPageElts();
      const tasksAfter = await toTaskArray(page.alltasks);
      expect(tasksAfter.length).toEqual(numtasks + 1, 'number of tasks');

      expect(tasksAfter.slice(0, numtasks)).toEqual(tasksBefore, 'Old tasks are still there');

      const maxId = tasksBefore[tasksBefore.length - 1].id;
      expect(tasksAfter[numtasks]).toEqual({id: maxId + 1, name: addedTaskName});
    });

    it('displays correctly styled buttons', async () => {
      const buttons = await element.all(by.buttonText('x'));

      for (const button of buttons) {
        // Inherited styles from styles.css
        expect(await button.getCssValue('font-family')).toBe('Arial, Helvetica, sans-serif');
        expect(await button.getCssValue('border')).toContain('none');
        expect(await button.getCssValue('padding')).toBe('1px 10px 3px');
        expect(await button.getCssValue('border-radius')).toBe('4px');
        // Styles defined in tasks.component.css
        expect(await button.getCssValue('left')).toBe('210px');
        expect(await button.getCssValue('top')).toBe('5px');
      }

      const addButton = element(by.buttonText('Add task'));
      // Inherited styles from styles.css
      expect(await addButton.getCssValue('font-family')).toBe('Arial, Helvetica, sans-serif');
      expect(await addButton.getCssValue('border')).toContain('none');
      expect(await addButton.getCssValue('padding')).toBe('8px 24px');
      expect(await addButton.getCssValue('border-radius')).toBe('4px');
    });

  });

  describe('Progressive task search', () => {

    beforeAll(() => browser.get(''));

    it(`searches for 'Ma'`, async () => {
      await getPageElts().searchBox.sendKeys('Ma');
      await browser.sleep(1000);

      expect(await getPageElts().searchResults.count()).toBe(4);
    });

    it(`continues search with 'g'`, async () => {
      await getPageElts().searchBox.sendKeys('g');
      await browser.sleep(1000);
      expect(await getPageElts().searchResults.count()).toBe(2);
    });

    it(`continues search with 'e' and gets ${targetTask.name}`, async () => {
      await getPageElts().searchBox.sendKeys('n');
      await browser.sleep(1000);
      const page = getPageElts();
      expect(await page.searchResults.count()).toBe(1);
      const task = page.searchResults.get(0);
      expect(await task.getText()).toEqual(targetTask.name);
    });

    it(`navigates to ${targetTask.name} details view`, async () => {
      const task = getPageElts().searchResults.get(0);
      expect(await task.getText()).toEqual(targetTask.name);
      await task.click();

      const page = getPageElts();
      expect(await page.taskDetail.isPresent()).toBeTruthy('shows task detail');
      const task2 = await Task.fromDetail(page.taskDetail);
      expect(task2.id).toEqual(targetTask.id);
      expect(task2.name).toEqual(targetTask.name.toUpperCase());
    });
  });

  async function dashboardSelectTargetTask() {
    const targettasklt = getPageElts().toptasks.get(targetTaskDashboardIndex);
    expect(await targettasklt.getText()).toEqual(targetTask.name);
    await targettasklt.click();
    await browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

    const page = getPageElts();
    expect(await page.taskDetail.isPresent()).toBeTruthy('shows task detail');
    const task = await Task.fromDetail(page.taskDetail);
    expect(task.id).toEqual(targetTask.id);
    expect(task.name).toEqual(targetTask.name.toUpperCase());
  }

  async function updateTaskNameInDetailView() {
    // Assumes that the current view is the task details view.
    await addToTaskName(nameSuffix);

    const page = getPageElts();
    const task = await Task.fromDetail(page.taskDetail);
    expect(task.id).toEqual(targetTask.id);
    expect(task.name).toEqual(newTaskName.toUpperCase());
  }

});

async function addToTaskName(text: string): Promise<void> {
  const input = element(by.css('input'));
  await input.sendKeys(text);
}

async function expectHeading(hLevel: number, expectedText: string): Promise<void> {
  const hTag = `h${hLevel}`;
  const hText = await element(by.css(hTag)).getText();
  expect(hText).toEqual(expectedText, hTag);
}

function getTaskAEltById(id: number): ElementFinder {
  const spanForId = element(by.cssContainingText('li span.badge', id.toString()));
  return spanForId.element(by.xpath('..'));
}

function getTaskLiEltById(id: number): ElementFinder {
  const spanForId = element(by.cssContainingText('li span.badge', id.toString()));
  return spanForId.element(by.xpath('../..'));
}

async function toTaskArray(alltasks: ElementArrayFinder): Promise<Task[]> {
  return alltasks.map(task => Task.fromLi(task!));
}
