import { BaseDialog } from "./dialog.js";
import { SearchBar } from "../search/search.js";
import { getTimezoneOffset } from "../utils/utils.js";

export class IssueSubsitution extends BaseDialog{
    startDateRef = this.useRef('start-date')
    endDateRef = this.useRef('end-date')
    searchBarRef = this.useRef('dialog-issue-search-bar')
    buttonConfirmRef = this.useRef('button-confirm')
    constructor(){
        super(...arguments);
    }
    renderDialogContent(){
        this.innerTemplate = `
            <div class="dialog-issue-content">
                <div>
                    <div class="dialog-issue-search-bar" l-ref="dialog-issue-search-bar">
                    </div>
                </div>
                <h2>Time</h2>
                <div class="log-range" l-ref="dialog-issue-log-range">
                    <input class="date1 tm-form-control" l-ref="start-date">
                    <svg class="svg-inline--fa fa-right-long" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="right-long" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M504.3 273.6l-112.1 104c-6.992 6.484-17.18 8.218-25.94 4.406c-8.758-3.812-14.42-12.45-14.42-21.1L351.9 288H32C14.33 288 .0002 273.7 .0002 255.1S14.33 224 32 224h319.9l0-72c0-9.547 5.66-18.19 14.42-22c8.754-3.809 18.95-2.075 25.94 4.41l112.1 104C514.6 247.9 514.6 264.1 504.3 273.6z"></path></svg>
                    <input class="date2 tm-form-control" l-ref="end-date">
                </div>
            </div>
        `;
        this.innerFooter = `
            <button type="button" class="btn btn-start" l-ref="button-confirm">CONFIRM</button>
        `
    }
    destroy(){
        this.date1pickr?.destroy();
        this.date2pickr?.destroy();
        super.destroy();
    }
    changeStartDate(selectedDates, dateStr, instance){
        this.response.startDate = selectedDates[0];
    }
    changeEndDate(selectedDates, dateStr, instance){
        this.response.endDate = selectedDates[0];
    }
    mounted(){
        let res = super.mounted();
        let self = this;
        this.response.startDate = this.params.startDate || new Date();
        this.response.endDate = this.params.endDate || new Date();
        this.searchBar = new SearchBar(this).mount(this.searchBarRef.el);
        this.date1pickr = flatpickr(this.startDateRef.el,{ enableTime: true, defaultDate: this.response.startDate, altInput: true, onClose: self.changeStartDate.bind(self)});
        this.date2pickr = flatpickr(this.endDateRef.el,{ enableTime: true, defaultDate: this.response.endDate, altInput: true, onClose: self.changeEndDate.bind(self)});
        this.buttonConfirmRef.el.addEventListener('click', e=>{
            let minDate = this.response.startDate, maxDate = this.response.endDate;
            if (minDate > maxDate){
                minDate = this.response.endDate;
                maxDate = this.response.startDate
            }
            this.response.issue = self.env.issueData;
            this.response.start = `${new Date().toISOString().substring(0,19)}+0000`
            this.response.duration = (maxDate?.getTime() - minDate.getTime())/1000
            this.dialogClose.el.click();
        })
        return res
    }
    
}