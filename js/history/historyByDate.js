
import * as util from "../utils/utils.js"
import * as hUtil from "./historyUtils.js"
import { Component } from "../base.js"
import { IssueSubsitution } from "../dialog/issueSubsitution.js"
class Log extends Component{
    secondToString = util.parseSecondToString(this.env.resource?.hrs_per_day || 8, this.env.resource?.days_per_week || 5)
    constructor() {
        super(...arguments);
    }
    mounted() {
        let res = super.mounted();
        let self = this;
        for (let element of this.el.querySelectorAll('.tm-form-control')){
            element.addEventListener('change', async event=>{
                let values = hUtil.exportLogData.bind(this)(event.target);
                if (element.parentNode.classList.contains('unexported')){
                    let result = {}
                    try {
                        let response = (await self.do_invisible_request('POST', `${self.env.serverURL}/management/issue/work-log/update`, values));
                        result = (await response.json());
                    } catch {
                        result = self.params;
                    } finally {
                        for (let key in result){
                            self.params[key] = result[key]
                        }
                        self.reload();
                    }
                }
            })
        }
        for (let element of this.el.querySelectorAll('.action-log-delete')){
            element.addEventListener('click', event=>{
                hUtil.deleteLogData.bind(this)(event.currentTarget)
                if (this.parent.params.logs.length == 1){
                    this.parent.destroy();
                }
            })
        }
        function checkUnexported(element){
            if (element.value !== element.getAttribute('data-origin')){
                element.parentNode.classList.add('unexported');
            } else if (element.parentNode.getAttribute('data-export') === "true"){
                element.parentNode.classList.remove('unexported');
            }
        }
        for (let element of this.el.querySelectorAll('.log-description')){
            element.addEventListener('keyup', ()=>{
                checkUnexported(element);
            })
        }
        for (let element of this.el.querySelectorAll('.log-duration')){
            element.addEventListener('keyup', ()=>{
                checkUnexported(element);
            })
        }
        for (let element of this.el.querySelectorAll('.wl-circle-decorator')){
            element.addEventListener('click', event=>{
                function callback(data){
                    console.log(data)
                }
                self.showDialog(IssueSubsitution, {
                    title: "Change Work Log", 
                    startDate: this.params.start_date,
                    endDate: new Date(this.params.start_date.getTime()+this.params.duration*1000),
                    callback: callback})
            })
        }
        return res
    }
    template = `
        <div class="log-each ${this.params.exported? '': 'unexported'}" data-export="${this.params.exported}" data-group="${this.params.group}" data-id="${this.params['id']}">
            <input class="log-duration tm-form-control" value="${this.secondToString(this.params.duration)}" data-origin="${this.secondToString(this.params.duration)}">
            <span class="wl-circle-decorator" title="${this.params.date || ''}">
                <svg class="svg-inline--fa fa-circle" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256z"></path></svg><!-- <i class="fas fa-circle"></i> Font Awesome fontawesome.com -->
                <svg class="svg-inline--fa fa-ellipsis-vertical" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="ellipsis-vertical" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" data-fa-i2svg=""><path fill="currentColor" d="M64 360C94.93 360 120 385.1 120 416C120 446.9 94.93 472 64 472C33.07 472 8 446.9 8 416C8 385.1 33.07 360 64 360zM64 200C94.93 200 120 225.1 120 256C120 286.9 94.93 312 64 312C33.07 312 8 286.9 8 256C8 225.1 33.07 200 64 200zM64 152C33.07 152 8 126.9 8 96C8 65.07 33.07 40 64 40C94.93 40 120 65.07 120 96C120 126.9 94.93 152 64 152z"></path></svg>
            </span>
            <input class="log-description tm-form-control" value="${this.params.description}" data-origin="${this.params.description}">
            <span class="action-log-delete" title="Remove this ${this.secondToString(this.params.duration)}">
                <svg class="svg-inline--fa fa-xmark" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="xmark" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"></path></svg><!-- <i class="fas fa-times"></i> Font Awesome fontawesome.com -->
            </span>
        </div>
    `
}
class LogByIssue extends Component{
    constructor() {
        super(...arguments);
    }
    mounted() {
        let res = super.mounted();
        let element = this.el;
        let group = this.params.group, self = this;
        for(let log of this.params.logs){
            log['group'] = group;
            new Log(this, log).mount(element)
        }
        for (let element of this.el.querySelectorAll('.log-issue')){
            element.addEventListener('click', event=>{
                let data = hUtil.getLogDataGroup.bind(this)(event.currentTarget.parentNode.parentNode)
                if (!self.env.issueData){
                    self.env.issueData = {};
                }
                self.env.issueData.id = data.issue;
                self.env.update('loadIssueData', false)
                event.stopPropagation();
            })
        }
        for (let element of this.el.querySelectorAll('.log-issue-export')){
            element.addEventListener('click', event=>{
                let group = event.currentTarget.parentNode.parentNode.parentNode.getAttribute('data-group');
                let data = hUtil.getLogDataGroup.bind(self)(event.currentTarget.parentNode.parentNode)
                let exports = self.env.historyByDate[group].values.filter(e=> e.issue == data.issue);
                let total_duration = exports.reduce((x,y)=>x.duration+y.duration);
                this.env.exportedTotal -= total_duration;
                let exportIds = exports.map(e=>e.id)
                hUtil.exportLog.bind(self)(exportIds).then(function(response){
                    response.json().then(result=>{
                        self.params.logs = result.sort(function(a,b){return b.sequence-a.sequence});
                        self.env.update('setGlobalData', null)
                        self.reload();
                    })
                });
            })
        }
        return res
    }
    template = `
        <div class="log" data-group="${this.params.group}" data-id="${this.params.origin['id']}">
            <div class="log-title">
                <div class="log-title-heading">
                    <button type="button" class="log-issue">
                        ${this.params.origin.key}
                    </button>
                    <button type="button" class="log-issue-export">
                        <svg class="svg-inline--fa fa-square-up-right" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="square-up-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M384 32H64C28.65 32 0 60.65 0 96v320c0 35.34 28.65 64 64 64h320c35.35 0 64-28.66 64-64V96C448 60.65 419.3 32 384 32zM330.5 323.9c0 6.473-3.889 12.3-9.877 14.78c-5.979 2.484-12.86 1.105-17.44-3.469l-45.25-45.25l-67.92 67.92c-12.5 12.5-32.72 12.46-45.21-.0411l-22.63-22.63C109.7 322.7 109.6 302.5 122.1 289.1l67.92-67.92L144.8 176.8C140.2 172.2 138.8 165.3 141.3 159.4c2.477-5.984 8.309-9.875 14.78-9.875h158.4c8.835 0 15.1 7.163 15.1 15.1V323.9z"></path></svg>
                    </button>
                </div>
                
                <span class="log-display-name" title="${this.params.origin.issueName}">
                    ${this.params.origin.issueName}
                </span>
            </div>
        </div>
    `
}
export class LogByDate extends Component {
    logSegment = this.useRef('log-segment')
    constructor() {
        super(...arguments);
    }
    mounted() {
        let res = super.mounted();
        let element = this.logSegment.el;
        for (let issue of this.params.issueLogs){
            new LogByIssue(this, issue).mount(element)
        }
        for (let element of this.el.querySelectorAll('.log-date-export')){
            element.addEventListener('click', event=>{
                let group = event.currentTarget.getAttribute('data-group');
                let exportIds = historyByDate[group].values.map(e=> e.id);
                hUtil.exportLog(exportIds).bind(this).then(e=>{
                    self.parent.loadHistory(this.parent.unix[0]-1, this.parent.unix[1])
                });
            })
        }
        return res
    }
    template = `
        <div class="log-group">
            <div class="log-heading">
                <div class="log-heading-title">
                    <span class="datetime"> ${this.params.group} </span>
                    <button type="button" class="log-date-export" data-group="${this.params.group}">
                        <svg class="svg-inline--fa fa-square-up-right" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="square-up-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M384 32H64C28.65 32 0 60.65 0 96v320c0 35.34 28.65 64 64 64h320c35.35 0 64-28.66 64-64V96C448 60.65 419.3 32 384 32zM330.5 323.9c0 6.473-3.889 12.3-9.877 14.78c-5.979 2.484-12.86 1.105-17.44-3.469l-45.25-45.25l-67.92 67.92c-12.5 12.5-32.72 12.46-45.21-.0411l-22.63-22.63C109.7 322.7 109.6 302.5 122.1 289.1l67.92-67.92L144.8 176.8C140.2 172.2 138.8 165.3 141.3 159.4c2.477-5.984 8.309-9.875 14.78-9.875h158.4c8.835 0 15.1 7.163 15.1 15.1V323.9z"></path></svg>
                    </button>
                </div>
                <div>
                    Total: <div class="total-duration"> ${util.secondToHour(this.params.total_duration)} </div> 
                </div>
            </div>
            <div class="log-segment" l-ref="log-segment">
            </div>
        </div>
    `
}