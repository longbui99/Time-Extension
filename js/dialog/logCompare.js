import * as util from "../utils/utils.js"
import { BaseDialog } from "./dialog.js";

export class LogCompare extends BaseDialog{
    startDateSectionRef = this.useRef('start-date-section')
    startDateExportedRef = this.useRef('start-date-section-exported')
    startDateCurrentRef = this.useRef('start-date-section-current')
    descriptionSectionRef = this.useRef('description-section')
    descriptionExportedRef = this.useRef('description-section-exported')
    descriptioneCurrentRef = this.useRef('description-section-current')
    durationSectionRef = this.useRef('duration-section')
    durationExportedRef = this.useRef('duration-section-exported')
    durationCurrentRef = this.useRef('duration-section-current')
    constructor(){
        super(...arguments);
    }
    renderDialogContent(){
        this.innerTemplate = `
            <div class="dialog-log-compare">
                <div class="item" l-ref="start-date-section">
                    <h3>Start Date</h3>
                    <div class="section">
                        <p class="old" l-ref="start-date-section-exported">${this.startDate[1]}</p>
                        <i class="fa-solid fa-arrow-right"></i>
                        <p class="new" l-ref="start-date-section-current">${this.startDate[0]}</p>
                    </div>
                </div>
                <div class="item" l-ref="description-section">
                    <h3>Description</h3>
                    <div class="section">
                        <p class="old" l-ref="description-section-exported">${this.description[1]}</p>
                        <i class="fa-solid fa-arrow-right"></i>
                        <p class="new" l-ref="description-section-current">${this.description[0]}</p>
                    </div>
                </div>
                <div class="item" l-ref="duration-section">
                    <h3>Duration</h3>
                    <div class="section">
                        <p class="old" l-ref="duration-section-exported">${util.secondToHMSString(this.duration[1])}</p>
                        <i class="fa-solid fa-arrow-right"></i>
                        <p class="new" l-ref="duration-section-current">${util.secondToHMSString(this.duration[0])}</p>
                    </div>
                </div>
            </div>
        `;
        this.innerFooter = `
            <button type="button" class="btn btn-primary" l-ref="button-cancel">CANCEL</button>
        `
    }
    renderDialog(){
        this.env.taskData = this.params.taskData;
        this.startDate = [0,0]
        this.startDateExist = null
        if (this.params.datas.start_date){
            this.startDate = this.params.datas.start_date
            this.startDateExist = true
        }
        this.description = [0,0]
        this.descriptionExist = null
        if (this.params.datas.description){
            this.description = this.params.datas.description
            this.descriptionExist = true
        }
        this.duration = [0,0]
        this.durationExist = null
        if (this.params.datas.duration){
            this.duration = this.params.datas.duration
            this.durationExist = true
        }
        return super.renderDialog();
    }
    async mounted(){
        let res = super.mounted();
        if (!this.startDateExist){
            this.startDateSectionRef.el.style.display = "none";
        }
        if (!this.descriptionExist){
            this.descriptionSectionRef.el.style.display = "none";
        }
        if (!this.durationExist){
            this.durationSectionRef.el.style.display = "none";
        }
        return res
    }
    
}