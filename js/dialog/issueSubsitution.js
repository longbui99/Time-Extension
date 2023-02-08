import { BaseDialog } from "./dialog.js";
import { SearchBar } from "../search/search.js";
import { getTimezoneOffset } from "../utils/utils.js";

export class IssueSubsitution extends BaseDialog{
    startDateRef = this.useRef('start-date')
    endDateRef = this.useRef('end-date')
    searchBarRef = this.useRef('dialog-issue-search-bar')
    buttonConfirmRef = this.useRef('button-confirm')
    commentRef = this.useRef('comment-for-issue')
    constructor(){
        super(...arguments);
        this.startChange = false;
        this.endChange = false
        this.env.issueData = this.params.issueData;
    }
    renderDialogContent(){
        this.innerTemplate = `
            <div class="dialog-issue-content">
                <div>
                    <div class="dialog-issue-search-bar" l-ref="dialog-issue-search-bar">
                    </div>
                </div>
                <div class="log-range" l-ref="dialog-issue-log-range">
                    <input class="date1 tm-form-control" tabindex="10002" l-ref="start-date">
                    <svg class="svg-inline--fa fa-right-long" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="right-long" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M504.3 273.6l-112.1 104c-6.992 6.484-17.18 8.218-25.94 4.406c-8.758-3.812-14.42-12.45-14.42-21.1L351.9 288H32C14.33 288 .0002 273.7 .0002 255.1S14.33 224 32 224h319.9l0-72c0-9.547 5.66-18.19 14.42-22c8.754-3.809 18.95-2.075 25.94 4.41l112.1 104C514.6 247.9 514.6 264.1 504.3 273.6z"></path></svg>
                    <input class="date2 tm-form-control" tabindex="10003" l-ref="end-date">
                </div>
                <div>
                    <textarea rows="1" type="text" class="tm-form-control" placeholder="What are you doing?" l-ref="comment-for-issue" tabindex="10004"></textarea>
                </div>
            </div>
        `;
        this.innerFooter = `
            <button type="button" class="btn btn-start" l-ref="button-confirm">CONFIRM</button>
            <button type="button" class="btn btn-primary" l-ref="button-cancel">CANCEL</button>
        `
    }
    destroy(){
        this.date1pickr?.destroy();
        this.date2pickr?.destroy();
        super.destroy();
    }
    changeStartDate(selectedDates, dateStr, instance){
        if (!this.endChange){
            this.response.endDate = new Date(this.response.endDate.getTime() - this.response.startDate.getTime() + selectedDates[0].getTime());
            this.startChange = true;
            this.date2pickr.setDate(this.response.endDate);
        }
        this.response.startDate = selectedDates[0];
    }
    changeEndDate(selectedDates, dateStr, instance){
        if (!this.startChange){
            this.response.startDate = new Date(this.response.startDate.getTime() - this.response.startDate.getTime() + selectedDates[0].getTime());
            this.endChange = true;
            this.date1pickr.setDate(this.response.startDate);
        }
        this.response.endDate = selectedDates[0];
    }
    async mounted(){
        let res = super.mounted();
        let self = this;
        this.response.startDate = this.params.startDate || new Date();
        this.response.endDate = this.params.endDate || new Date();
        this.searchBar = new SearchBar(this);
        this.searchBar.mount(this.searchBarRef.el);
        this.searchBar._searchIssue('favorite', true)
        this.commentRef.el.innerText = this.params.comment || '';
        this.date1pickr = flatpickr(this.startDateRef.el,{ enableTime: true, defaultDate: this.response.startDate, altInput: true, onClose: self.changeStartDate.bind(self)});
        this.date2pickr = flatpickr(this.endDateRef.el,{ enableTime: true, defaultDate: this.response.endDate, altInput: true, onClose: self.changeEndDate.bind(self)});
        this.buttonConfirmRef.el.addEventListener('click', e=>{
            let minDate = self.response.startDate, maxDate = self.response.endDate;
            if (minDate > maxDate){
                minDate = self.response.endDate;
                maxDate = self.response.startDate
            }
            self.response.issue = self.env.issueData;
            self.response.start = minDate.getTime()/1000;
            self.response.duration = (maxDate?.getTime() - minDate.getTime())/1000;
            self.response.id = self.params.id;
            self.response.comment = self.commentRef.el.value;
            if (self.params.successCallback){
                self.params.successCallback(self.response);
            }
            self.dialogClose.el.click();
        })
        return res
    }
    
}