import { BasePopup } from "../popup/popupBase.js";

export class historySearchPopup extends BasePopup {
    historyBreakdownRef = this.useRef("history-breakdown")
    weekStartDateRef = this.useRef('week-start-day')
    constructor(){
        super(...arguments);
    }
    adjustPositionPopup(){
        super.adjustPositionPopup();
        this.el.style.left = "10px";
    }
    searchChange(event){
        this.env.historyData.breakdown = this.historyBreakdownRef.el.value;
        this.env.historyData.startWeekDay = this.weekStartDateRef.el.value;
        this.update("searchChange", {});
    }
    mounted(){
        let res = super.mounted();
        this.historyBreakdownRef.el.value = (this.env.historyData.breakdown || 'day');
        this.weekStartDateRef.el.value = (this.env.historyData.startWeekDay || '1');
        this.historyBreakdownRef.el.addEventListener('change', this.searchChange.bind(this));
        this.weekStartDateRef.el.addEventListener('change', this.searchChange.bind(this));
        this.initEvent();
        return res;
    }
    renderDialogContent(){
        this.innerTemplate = `
            <div class="history-search-popup">
                <table>
                    <tr>
                        <th>Breakdown Mode</th>
                        <td>
                            <select name="breakdowns" l-ref="history-breakdown">
                                <option value="day">Daily</option>
                                <option value="week">Weekly</option>
                                <option value="month">Monthly</option>
                                <option value="year">Anually</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>Start Day of Week</th>
                        <td>
                            <select name="week-start-day" l-ref="week-start-day">
                                <option value="0">Sunday</option>
                                <option value="1" default>Monday</option>
                                <option value="2">Tuesday</option>
                                <option value="3">Wednesday</option>
                                <option value="4">Thusday</option>
                                <option value="5">Friday</option>
                                <option value="6">Saturday</option>
                            </select>
                        </td>
                    </tr>
                </table>
            </div>
        `;
    }
    
}