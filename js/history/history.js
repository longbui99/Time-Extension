
import * as util from "../utils/utils.js"
import { mount, Component } from "../base.js"
export class LogReport extends Component {

    logReportSectionRef = this.useRef('log-report-section')
    logHistoryDateRangeRef = this.useRef('hisory-date-range')
    durationUnexportedRef = this.useRef('duration-unexpored')
    logHistoryDateRangeTotalRef = this.useRef('log-history-total-range')
    logHistoryRef = this.useRef('log-history')

    constructor() {
        super(...arguments);
        this.secondToString = util.parseSecondToString(this.env.resource?.hrs_per_day || 8, this.env.resource?.days_per_week || 5)
    }
    onChangeRangeHistoryFilter(selectedDates, dateStr, instance){
        let from_unix = selectedDates[0].getTime()/1000;
        let to_unix = selectedDates[1].getTime()/1000;
        this.loadHistory(from_unix, to_unix)
    }
    async loadHistory(from_unix=0, unix=0){
        if (this.unix && this.unix[0]=== from_unix && this.unix[1] === unix){
            return
        }
        this.unix = [from_unix, unix]
        let self = this;
        let response = (await this.do_invisible_request('GET', `${this.env.serverURL}/management/issue/work-log/history?from_unix=${from_unix}&unix=${unix}&jwt=${this.env.jwt}`));
        let result = (await response.json());
        this.logHistoryDateRangeTotalRef.el.innerHTML = util.secondToHour(0)
        this.logHistoryRef.el.innerHTML = '';
        let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let detailOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
        if (result.length){
            let historyByDate = {};
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
            let innerHTML = '', pageLog = {}
            let globalTotal = 0, exportedTotal=0;
            this.logHistoryDateRangeTotalRef.el.innerHTML = util.secondToHour(globalTotal)
            this.logHistoryRef.el.innerHTML = innerHTML;
            for (let group in historyByDate){
                let tmpl = '';
                let total_duration = 0;
                let index = 0 ;
                let values = historyByDate[group].values.sort(function(a,b){return b.sequence-a.sequence})
                values.push({})
                let checkpointKey = values[0]?.key, logHTML = '';
                for (let log of values){
                    if (log.exported){
                        exportedTotal += log.duration;
                    }
                    let eachLogHTML =  `<div class="log-each ${log.exported? '': 'unexported'}" data-export="${log.exported}" data-group="${group}" data-id="${log['id']}">
                            <input class="log-duration tm-form-control" value="${self.secondToString(log.duration)}" data-origin="${self.secondToString(log.duration)}">
                            <span class="wl-circle-decorator" title="${log.date || ''}">
                                <svg class="svg-inline--fa fa-circle" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256z"></path></svg><!-- <i class="fas fa-circle"></i> Font Awesome fontawesome.com -->
                            </span>
                            <input class="log-description tm-form-control" value="${log.description}" data-origin="${log.description}">
                            <span class="action-log-delete" title="Remove this ${self.secondToString(log.duration)}log">
                                <svg class="svg-inline--fa fa-xmark" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="xmark" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"></path></svg><!-- <i class="fas fa-times"></i> Font Awesome fontawesome.com -->
                            </span>
                        </div>
                    `
                    if (log.key !== checkpointKey){
                        pageLog = values[index-1];
                        tmpl += `
                        <div class="log" data-group="${group}" data-id="${pageLog['id']}">
                            <div class="log-title">
                                <div class="log-title-heading">
                                    <button type="button" class="log-issue">
                                        ${pageLog.key}
                                    </button>
                                    <button type="button" class="log-issue-export">
                                        <svg class="svg-inline--fa fa-square-up-right" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="square-up-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M384 32H64C28.65 32 0 60.65 0 96v320c0 35.34 28.65 64 64 64h320c35.35 0 64-28.66 64-64V96C448 60.65 419.3 32 384 32zM330.5 323.9c0 6.473-3.889 12.3-9.877 14.78c-5.979 2.484-12.86 1.105-17.44-3.469l-45.25-45.25l-67.92 67.92c-12.5 12.5-32.72 12.46-45.21-.0411l-22.63-22.63C109.7 322.7 109.6 302.5 122.1 289.1l67.92-67.92L144.8 176.8C140.2 172.2 138.8 165.3 141.3 159.4c2.477-5.984 8.309-9.875 14.78-9.875h158.4c8.835 0 15.1 7.163 15.1 15.1V323.9z"></path></svg>
                                    </button>
                                </div>
                                
                                <span class="log-display-name" title="${pageLog.issueName}">
                                    ${pageLog.issueName}
                                </span>
                            </div>
                            ${logHTML}
                        </div>`
                        logHTML = '';
                    } 
                    checkpointKey = log.key;
                    logHTML += eachLogHTML
                    total_duration += (log.duration || 0);
                    index++;
                }
                historyByDate[group].totalDuration = total_duration;
                globalTotal += total_duration
                if (tmpl.length){
                    innerHTML += `
                    <div class="log-group">
                        <div class="log-heading">
                            <div class="log-heading-title">
                                <span class="datetime"> ${group} </span>
                                <button type="button" class="log-date-export" data-group="${group}">
                                    <svg class="svg-inline--fa fa-square-up-right" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="square-up-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M384 32H64C28.65 32 0 60.65 0 96v320c0 35.34 28.65 64 64 64h320c35.35 0 64-28.66 64-64V96C448 60.65 419.3 32 384 32zM330.5 323.9c0 6.473-3.889 12.3-9.877 14.78c-5.979 2.484-12.86 1.105-17.44-3.469l-45.25-45.25l-67.92 67.92c-12.5 12.5-32.72 12.46-45.21-.0411l-22.63-22.63C109.7 322.7 109.6 302.5 122.1 289.1l67.92-67.92L144.8 176.8C140.2 172.2 138.8 165.3 141.3 159.4c2.477-5.984 8.309-9.875 14.78-9.875h158.4c8.835 0 15.1 7.163 15.1 15.1V323.9z"></path></svg>
                                </button>
                            </div>
                            <div>
                                Total: <div class="total-duration"> ${util.secondToHour(total_duration)} </div> 
                            </div>
                        </div>
                        <div class="log-segment">
                            ${tmpl}
                        </div>
                    </div>`
                }
            }
            this.logHistoryDateRangeTotalRef.el.innerHTML = util.secondToHour(globalTotal)
            this.durationUnexportedRef.el.innerHTML = util.secondToHour(globalTotal - exportedTotal)
            this.logHistoryRef.el.innerHTML = innerHTML;
            if (this.daterange){
                this.daterange.setDate([new Date(this.unix[0]*1000), new Date(this.unix[1]*1000)]);
            }
            function getLogDataGroup(target){
                let parentNode = target.parentNode;
                let group = parentNode.getAttribute('data-group');
                let id = parseInt(parentNode.getAttribute('data-id'));
                let index = historyByDate[group].values.findIndex(e=>e.id === id)
                if (index !== -1){
                    return historyByDate[group].values[index];
                }
                return {};
            }
            function exportLogData(target){
                let data = getLogDataGroup(target);
                let parentNode = target.parentNode;
                return {
                    id: data.id,
                    time: parentNode.querySelector('.log-duration').value,
                    description: parentNode.querySelector('.log-description').value,
                    jwt: self.env.jwt
                }
            }
            for (let element of this.logHistoryRef.el.querySelectorAll('.tm-form-control')){
                element.addEventListener('change', event=>{
                    let values = exportLogData(event.target);
                    if (element.parentNode.classList.contains('unexported')){
                        (self.do_invisible_request('POST', `${self.env.serverURL}/management/issue/work-log/update`, values));
                        element.setAttribute('data-origin', element.value)
                        if (element.parentNode.getAttribute('data-export') === "true"){
                            element.parentNode.classList.remove('unexported');
                        }
                    }
                })
            }
            function deleteLogData(target){
                let data = getLogDataGroup(target)
                    let values = exportLogData(target);
                    self.do_invisible_request('POST', `${self.env.serverURL}/management/issue/work-log/delete/${values.id}`, values);
                    let group = target.parentNode.getAttribute('data-group');
                    historyByDate[group].totalDuration -= data.duratsion;
                    target.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('.total-duration').innerHTML = secondToHour(historyByDate[group].totalDuration);
                    target.parentNode.remove()
                    globalTotal -= data.duration;
                    self.logHistoryDateRangeTotalRef.el.innerHTML = util.secondToHour(globalTotal)
                    if (!values.exported){
                        this.durationUnexportedRef.el.innerHTML = util.secondToHour(globalTotal - exportedTotal)
                    }
            }
            for (let element of this.logHistoryRef.el.querySelectorAll('.log-issue')){
                element.addEventListener('click', event=>{
                    let data = getLogDataGroup(event.currentTarget.parentNode.parentNode)
                    if (!self.env.issueData){
                        self.env.issueData = {};
                    }
                    self.env.issueData.id = data.issue;
                    self.env.update('loadIssueData', false)
                    event.stopPropagation();
                })
            }
            for (let element of this.logHistoryRef.el.querySelectorAll('.action-log-delete')){
                element.addEventListener('click', event=>{
                    deleteLogData(event.currentTarget)
                })
            }
            function updateLog(target){
                let data = getLogDataGroup(target);
                let startDate = data.start_date;
                let endDate = new Date(startDate.getTime() + data.duration);
                let config = [startDate, endDate]
                function onSelectedLogchange(selectedDates){
                    let date1 = selectedDates.date1;
                    let date2 = selectedDates.date2;
                    let newDuration = (date2.getTime()-date1.getTime())/1000;
                    if (date1 && date2){
                        if ((date1.toISOString().substring(0,10) !== startDate.toISOString().substring(0,10))
                           ||
                            newDuration !== duration
                           ){
                            // Doing something here
                           }
                    }
                }
                self.toggleDatetimeSelection(config, 'range', onSelectedLogchange)
            }
            for (let element of this.logHistoryRef.el.querySelectorAll('.wl-circle-decorator')){
                element.addEventListener('click', event=>{
                    self.toggleDatetimeSelection([new Date(), new Date()], 'range', (data)=>{
                        console.log(data)
                    })
                })
            }
            async function exportLog(exportIds){
                let res = {
                    exportIds: exportIds,
                    jwt: self.env.jwt
                };
                return self.do_request('POST', `${self.env.serverURL}/management/issue/work-log/export`, res);
            }
            for (let element of this.logHistoryRef.el.querySelectorAll('.log-date-export')){
                element.addEventListener('click', event=>{
                    let group = event.currentTarget.getAttribute('data-group');
                    let exportIds = historyByDate[group].values.map(e=> e.id);
                    exportLog(exportIds).then(e=>{
                        self.loadHistory(self.unix[0]-1, self.unix[1]);
                    });
                })
            }
            for (let element of this.logHistoryRef.el.querySelectorAll('.log-issue-export')){
                element.addEventListener('click', event=>{
                    let group = event.currentTarget.parentNode.parentNode.parentNode.getAttribute('data-group');
                    let data = getLogDataGroup(event.currentTarget.parentNode.parentNode)
                    let exportIds = historyByDate[group].values.filter(e=> e.issue == data.issue).map(e=>e.id);
                    exportLog(exportIds).then(e=>{
                        self.loadHistory(self.unix[0]-1, self.unix[1]);
                    });
                })
            }
            function checkUnexported(element){
                if (element.value !== element.getAttribute('data-origin')){
                    element.parentNode.classList.add('unexported');
                } else if (element.parentNode.getAttribute('data-export') === "true"){
                    element.parentNode.classList.remove('unexported');
                }
            }
            for (let element of this.logHistoryRef.el.querySelectorAll('.log-description')){
                element.addEventListener('keyup', ()=>{
                    checkUnexported(element);
                })
            }
            for (let element of this.logHistoryRef.el.querySelectorAll('.log-duration')){
                element.addEventListener('keyup', ()=>{
                    checkUnexported(element);
                })
            }
        }
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
                    <input l-ref="hisory-date-range" class="log-history-navigator-input tm-form-control">
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