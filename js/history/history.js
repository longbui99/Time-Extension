
import * as util from "../utils/utils.js"
import { Component } from "../base.js"
import { LogByDate } from "./historyByDate.js"
export class LogReport extends Component {

    logReportSectionRef = this.useRef('log-report-section')
    logHistoryDateRangeRef = this.useRef('history-date-range')
    durationUnexportedRef = this.useRef('duration-unexpored')
    logHistoryDateRangeTotalRef = this.useRef('log-history-total-range')
    logHistoryRef = this.useRef('log-history')

    constructor() {
        super(...arguments);
        this.subscribe('setGlobalData', this.setGlobalData.bind(this));
        this.subscribe('reloadHistory', this.reloadHistory.bind(this));
        this.secondToString = util.parseSecondToString(this.env.resource?.hrs_per_day || 8, this.env.resource?.days_per_week || 5)
    }
    onChangeRangeHistoryFilter(selectedDates, dateStr, instance){
        let from_unix = selectedDates[0].getTime()/1000;
        let to_unix = selectedDates[1].getTime()/1000;
        this.loadHistory(from_unix, to_unix)
    }
    reloadHistory(){
        this.loadHistory(this.unix[0], this.unix[1]+1)
    }
    async loadHistory(from_unix=0, unix=0, refresh=false){
        if ((this.unix && this.unix[0]=== from_unix && this.unix[1] === unix) || refresh){
            return
        }
        this.unix = [from_unix, unix]
        let response = (await this.do_invisible_request('GET', `${this.env.serverURL}/management/issue/work-log/history?from_unix=${from_unix}&unix=${unix}&jwt=${this.env.jwt}`));
        let result = (await response.json());
        this.logHistoryRef.el.innerHTML = '';
        this.logHistoryDateRangeTotalRef.el.innerHTML = util.secondToHour(0)
        let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let detailOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
        if (result.length){
            let historyByDate = {};
            this.env.historyByDate = historyByDate;
            let maxDate = this.unix[1] || 0, minDate = this.unix[0] || new Date().getTime()/1000;
            for (let record of result){
                let date = new Date(record['start_date']+"Z");
                let groupUnix = date.getTime()/1000;
                if (groupUnix > maxDate){
                    maxDate = groupUnix;
                } else if (groupUnix < minDate){
                    minDate = groupUnix;
                }
                let key = date.toLocaleDateString("en-US", options);
                record['start_date'] = date;
                record['date'] = date.toLocaleDateString('en-US', detailOptions)
                record['sequence'] = parseInt(Array.from(" " + record['key'])?.reduce(function(result, item){
                    if (!isNaN(item)){
                        result += item
                    } else {
                        result += item.charCodeAt(0)
                    }
                    return result
                }))
                if (historyByDate[key]){
                    historyByDate[key].values.push(record);
                } else {
                    historyByDate[key] = {values: [record]}
                }
            }
            this.unix = [minDate, maxDate]
            let pageLog = {}
            let globalTotal = 0, exportedTotal=0;
            this.logHistoryDateRangeTotalRef.el.innerHTML = util.secondToHour(globalTotal)
            for (let group in historyByDate){
                let tmpl = '';
                let total_duration = 0;
                let index = 0 ;
                let values = historyByDate[group].values.sort(function(a,b){return b.sequence-a.sequence})
                values.push({})
                let checkpointKey = values[0]?.key;
                let issueLogs = [];
                let workLogs = [];
                for (let log of values){
                    if (log.exported){
                        exportedTotal += log.duration;
                    }
                    if (log.key !== checkpointKey){
                        pageLog = values[index-1];
                        issueLogs.push({
                            'origin': pageLog,
                            'logs': workLogs,
                            'group': group,
                        })
                        workLogs = [];
                    } 
                    checkpointKey = log.key;
                    workLogs.push(log)
                    total_duration += (log.duration || 0);
                    index++;
                }
                historyByDate[group].totalDuration = total_duration;
                globalTotal += total_duration
                if (issueLogs.length){
                    new LogByDate(this, {
                        'total_duration': total_duration,
                        'tmpl': tmpl,
                        'group': group,
                        'issueLogs': issueLogs
                    }).mount(this.logHistoryRef.el)
                }
            }
            this.env.globalTotal = globalTotal;
            this.env.exportedTotal = exportedTotal;
            this.setGlobalData();
            if (this.daterange){
                this.daterange.setDate([new Date(this.unix[0]*1000), new Date(this.unix[1]*1000)]);
            }
        }
    }
    setGlobalData(){
        this.logHistoryDateRangeTotalRef.el.innerHTML = util.secondToHour(this.env.globalTotal)
        this.durationUnexportedRef.el.innerHTML = util.secondToHour(this.env.globalTotal - this.env.exportedTotal)
    }

    mounted() {
        let res = super.mounted();
        this.loadHistory();
        let self = this;
        this.daterange = flatpickr(this.logHistoryDateRangeRef.el,{mode: "range", defaultDate: [new Date(), new Date()], altInput: true, altFormat: "M j, Y",
            onClose: self.onChangeRangeHistoryFilter.bind(self)
        });
        return res
    }
    template = `
        <div class="log-report" l-ref="log-report-section">
            <div class="space-segment log-history-navigator"> 
                <div class="log-history-navigator-action">
                    <span class="filter-icon">
                        <svg class="svg-inline--fa fa-filter" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg>
                    </span>
                    <input l-ref="history-date-range" class="log-history-navigator-input tm-form-control">
                    <div style="margin-left:auto"></div>
                    <div class="duration-description">
                        <span>    
                            <svg class="svg-inline--fa fa-circle" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256z"></path></svg>
                        </span>
                        <span l-ref="duration-unexpored">
                            00:00
                        </span>
                        /
                    </div>
                    <div class="total">
                        <div l-ref="log-history-total-range">00:00</div>
                    </div>
                </div>
            </div>
            <div class="space-segment log-history" l-ref="log-history">
            </div>
        </div>
    `
}