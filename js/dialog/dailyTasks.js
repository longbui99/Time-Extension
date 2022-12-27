import { BaseDialog } from "./dialog.js";
import { CheckList } from "../checklists/checklist.js";

export class dailyTasks extends BaseDialog{
    buttonConfirmRef = this.useRef('button-confirm')
    commentRef = this.useRef('comment-for-issue')
    dialogContent = this.useRef('dialog-content')
    applicableDate = this.useRef('applicable-date')
    applicableDateLabel = this.useRef('applicable-date-label')
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
        this.headerTooltip = `
            <label for="applicable-date-selection" class="applicable-date-label" l-ref="applicable-date-label">
                <span class="tm-icon-svg"><svg class="svg-inline--fa fa-calendar" aria-hidden="true" focusable="false" data-prefix="far" data-icon="calendar" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"></path></svg>
                </span>
            </label>
            <input id="applicable-date-selection" type="text" class="applicable-date" l-ref="applicable-date">
        `
    }
    async initDailyTaskDialog(text='today'){
        let self = this;
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
        this.initDailyTaskDialog().then(e=>{
            flatpickr(self.applicableDate.el, {defaultDate: self.env.issueData.applicable_date, altInput: true});
        });
        this.buttonConfirmRef.el.addEventListener('click', ()=>self.dialogClose.el.click());
        this.applicableDateLabel.el.addEventListener('click', ()=>self.applicableDate.el._flatpickr.toggle());
        return res
    }
    
}