import { BasePopup } from "../popup/popupBase.js";

export class historySearchPopup extends BasePopup {
    historyBreakdownRef = this.useRef("history-breakdown")
    constructor(){
        super(...arguments);
    }
    adjustPositionPopup(){
        super.adjustPositionPopup();
        this.el.style.left = "10px";
    }
    searchChange(event){
        this.env.historyData.breakdown = this.historyBreakdownRef.el.value;
        this.update("searchChange", {});
    }
    mounted(){
        let res = super.mounted();
        this.initEvent();
        this.historyBreakdownRef.el.addEventListener('change', this.searchChange.bind(this));
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
                </table>
            </div>
        `;
    }
    
}