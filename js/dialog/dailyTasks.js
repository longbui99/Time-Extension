import { BaseDialog } from "./dialog.js";
import { CheckList } from "../checklists/checklist.js";

export class dailyTasks extends BaseDialog{
    buttonConfirmRef = this.useRef('button-confirm')
    commentRef = this.useRef('comment-for-issue')
    dialogContent = this.useRef('dialog-content')
    constructor(){
        super(...arguments);
        this.env.issueData = this.params.issueData;
    }
    renderDialogContent(){
        this.innerTemplate = `
            <div class="dialog-issue-content daily-tasks" l-ref="dialog-content">
            </div>
        `;
        this.innerFooter = `
            <button type="button" class="btn btn-start" l-ref="button-confirm">DONE</button>
        `
    }
    async initDailyTaskDialog(){
        let self = this;
        let text = 'today';
        let result = (await this.do_request('GET', `${this.env.serverURL}/management/issue/search/${text}?offset=0&jwt=${this.env.jwt}`));
        let tasks = (await result.json());
        this.env.issueData = tasks[0];
        this.dialogTitle.el.textContent = `[${this.env.issueData.key}] ${this.env.issueData.name}`
        let component = new CheckList(this);
        component.mount(this.dialogContent.el).then(e=>{
            self.postUpdateDialogContent();
        })
    }
    mounted(){
        let res = super.mounted();
        let self = this;
        this.initDailyTaskDialog();
        this.buttonConfirmRef.el.addEventListener('click', ()=>self.dialogClose.el.click())
        return res
    }
    
}