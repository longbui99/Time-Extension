
import * as util from "../utils/utils.js"
import * as hUtil from "./historyUtils.js"
import { Component } from "../base.js"
import { IssueSubsitution } from "../dialog/issueSubsitution.js"
class Log extends Component {
    logDurationRef = this.useRef('log-duration')
    logDescriptionRef = this.useRef('log-description')
    actionLogDeleteRef = this.useRef('action-log-delete')
    actionAdjustLogRef = this.useRef('wl-circle-decorator')
    secondToString = util.parseSecondToString(this.env.resource?.hrs_per_day || 8, this.env.resource?.days_per_week || 5)

    constructor() {
        super(...arguments);
        this.data = this.params.datas;
        this.exported = this.data.exported;
        this.duration = this.secondToString(this.params.datas.duration);
        this.description = this.data.description;
    }

    updateExported(data){
        this.data.exported = true;
        this.toggleExported()
    }

    __getSyncValue(){
        return {
            id: this.data.id,
            time: this.logDurationRef.el.value,
            description: this.logDescriptionRef.el.value,
            jwt: this.env.jwt
        }
    }

    toggleExported(){
        this.el.classList.remove('unexported')
        if (!this.data.exported){
            this.el.classList.add('unexported')
        }
    }

    async _onchangeLogContent(){
        if (this.data.exported){
            this.data.exported = false;
            this.toggleExported();
        }
        if (this.data.exported === false){
            let values = this.__getSyncValue();
            let result = {}
            try {
                let response = (await this.do_invisible_request('POST', `${this.env.serverURL}/management/issue/work-log/update`, values));
                result = (await response.json());
            } catch {
                result = this.data;
            } finally {
                let update = {};
                result['start_date'] = new Date(result['start_date'] + "Z")
                this.data.start_date = result['start_date'];
                for (let key in result) {
                    if (this.data[key] !== result[key]){
                        update[key] = result[key];
                    }
                    this.data[key] = result[key]
                }
                if (update){
                    this.reload();
                    this.triggerUpMethod('adjustDuration', util.concat(update, {'id': this.data.id}), 5);
                }
            }
        }
    }

    __actionDeleteWorkLogs() {
        let values = this.__getSyncValue();
        this.destroy();
        this.do_invisible_request('POST', `${this.env.serverURL}/management/issue/work-log/delete/${values.id}`, values);
        this.triggerUpMethod("deletDuration", {
            'duration': this.data.duration,
            'mode': (this.data.exported?'exported':'unexported'),
            'logID': this.data.id
        }, 5)
    }

    checkUnexported(element, origin) {
        if (element.value !== origin) {
            this.data.exported = false;
        } else if (this.data.exported) {
            this.data.exported = true;
        }
        this.toggleExported();
    }
    editLog() {
        let self = this;
        async function callback(data) {
            let values = {
                'id': data.id,
                'issue_id': data.issue?.id,
                'duration': data.duration,
                'start_date': data.start,
                'description': data.comment,
                'jwt': self.env.jwt
            }
            await self.do_invisible_request('POST', `${self.env.serverURL}/management/issue/work-log/update`, values);
            self.parent.parent.parent.parent.reloadHistory()
        }
        self.showDialog(IssueSubsitution, {
            title: "Edit Log",
            id: this.data.id,
            startDate: this.data.start_date,
            endDate: new Date(this.data.start_date.getTime() + this.params.datas.duration * 1000),
            comment: this.description,
            issueData: {
                id: this.data.issue,
                name: this.data.issueName,
                key: this.data.key,
                type_url: this.data.type_url,
            },
            successCallback: callback
        })
    }

    mounted() {
        let res = super.mounted();
        let self = this;
        this.logDurationRef.el.addEventListener('change', self._onchangeLogContent.bind(this));
        this.logDescriptionRef.el.addEventListener('change', self._onchangeLogContent.bind(this));
        this.actionLogDeleteRef.el.addEventListener('click', self.__actionDeleteWorkLogs.bind(this));
        this.logDurationRef.el.addEventListener('keyup', ()=>self.checkUnexported(self.logDurationRef.el, self.duration));
        this.logDescriptionRef.el.addEventListener('keyup', ()=>self.checkUnexported(self.logDescriptionRef.el, self.description));
        this.actionAdjustLogRef.el.addEventListener('click', self.editLog.bind(this));
        return res
    }
    destroy(){
        super.destroy()
        delete this.params.datas;
    }
    template = `
        <div class="log-each ${this.params.datas.exported ? '' : 'unexported'}" l-ref="export-statement">
            <input class="log-duration tm-form-control" l-ref="log-duration" value="${this.secondToString(this.params.datas.duration)}">
            <span class="wl-circle-decorator" title="${this.params.datas.date || ''}" l-ref="wl-circle-decorator">
                <svg class="svg-inline--fa fa-circle" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256z"></path></svg><!-- <i class="fas fa-circle"></i> Font Awesome fontawesome.com -->
                <svg class="svg-inline--fa fa-ellipsis-vertical" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="ellipsis-vertical" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" data-fa-i2svg=""><path fill="currentColor" d="M64 360C94.93 360 120 385.1 120 416C120 446.9 94.93 472 64 472C33.07 472 8 446.9 8 416C8 385.1 33.07 360 64 360zM64 200C94.93 200 120 225.1 120 256C120 286.9 94.93 312 64 312C33.07 312 8 286.9 8 256C8 225.1 33.07 200 64 200zM64 152C33.07 152 8 126.9 8 96C8 65.07 33.07 40 64 40C94.93 40 120 65.07 120 96C120 126.9 94.93 152 64 152z"></path></svg>
            </span>
            <input class="log-description tm-form-control" l-ref="log-description" value="${this.params.datas.description}" data-origin="${this.params.datas.description}">
            <span class="action-log-delete" l-ref="action-log-delete" title="Remove this ${this.secondToString(this.params.datas.duration)}">
                <svg class="svg-inline--fa fa-xmark" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="xmark" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"></path></svg><!-- <i class="fas fa-times"></i> Font Awesome fontawesome.com -->
            </span>
        </div>
    `
}
class LogByIssue extends Component {
    LogByIssueBtnRef = this.useRef("log-issue-btn")
    LogIssueExportBtnRef = this.useRef("log-issue-export")
    constructor() {
        super(...arguments);
        this.deletDuration = this.deletDuration.bind(this);
    }
    adjustDuration(data){
        // console.log("LOGBYDATE")
    }
    deletDuration(data){
        util.popItem(this.params.datas.values, (e)=>e.id === data.logID)
        if (this.params.datas.values.length === 0){
            this.destroy();
        }
    }
    exportLogs(event){
        let datas = this.params.datas.values;
        let exports = datas.filter(e => e.exported == false);
        if (exports.length){
            let total_duration = 0;
            if (exports.length === 1) {
                total_duration = exports[0].duration;
            } else {
                total_duration = exports.reduce((x, y) => x + y.duration, 0);
            }
            this.triggerUpMethod('adjustDuration', {
                'duration': total_duration,
                'type': 'exported'
            }, 2)
            let exportIds = exports.map(e=>e.id)
            hUtil.exportLog.bind(this)(exportIds).then(function(response){
                this.patchDownMethod('updateExported', {})
            });
        }
    }
    mounted() {
        let res = super.mounted();
        let self = this;
        let element = this.el;
        for (let logs of this.params.datas.values){
            new Log(this, util.concat(
                self.params, 
                {
                    'datas': logs
                }
            )).mount(element)
        }
        this.LogByIssueBtnRef.el.addEventListener('click', event => {
            if (!self.env.issueData) {
                self.env.issueData = {};
            }
            self.env.issueData.id = self.params.datas.model.issueID;
            self.env.update('loadIssueData', false)
            event.stopPropagation();
        })
        this.LogIssueExportBtnRef.el.addEventListener('click', this.exportLogs.bind(this))
        return res
    }
    template = `
        <div class="log">
            <div class="log-title">
                <div class="log-title-heading">
                    <img class="issue-type-url" src="${this.params.datas.model.typeURL}"/>
                    <button type="button" class="log-issue" l-ref="log-issue-btn">
                        ${this.params.datas.model.issueKey}
                    </button>
                    <button type="button" class="log-issue-export" l-ref="log-issue-export">
                        <svg class="svg-inline--fa fa-square-up-right" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="square-up-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M384 32H64C28.65 32 0 60.65 0 96v320c0 35.34 28.65 64 64 64h320c35.35 0 64-28.66 64-64V96C448 60.65 419.3 32 384 32zM330.5 323.9c0 6.473-3.889 12.3-9.877 14.78c-5.979 2.484-12.86 1.105-17.44-3.469l-45.25-45.25l-67.92 67.92c-12.5 12.5-32.72 12.46-45.21-.0411l-22.63-22.63C109.7 322.7 109.6 302.5 122.1 289.1l67.92-67.92L144.8 176.8C140.2 172.2 138.8 165.3 141.3 159.4c2.477-5.984 8.309-9.875 14.78-9.875h158.4c8.835 0 15.1 7.163 15.1 15.1V323.9z"></path></svg>
                    </button>
                </div>
                
                <span class="log-display-name" title="${this.params.datas.model.issueName}">
                    ${this.params.datas.model.issueName}
                </span>
            </div>
        </div>
    `
}
class LogByProject extends Component {
    projectLogRef = this.useRef('project-logs')
    constructor() {
        super(...arguments);
        this.deletDuration = this.deletDuration.bind(this);
    }
    adjustDuration(data){
        // console.log("LOGBYDATE")
    }
    deletDuration(data){
        util.popItem(this.params.datas.values, (e)=>e.id === data.logID);
        if (this.params.datas.values.length === 0){
            this.destroy();
        }
    }
    mounted() {
        let res = super.mounted();
        this.params.datas.values.sort(function(a,b){return b.sequence-a.sequence})
        let logByIssue = util.GroupBy(this.params.datas.values, "issueName")
        let element = this.projectLogRef.el;
        for (let issueName in logByIssue){
            logByIssue[issueName]['model'] = {
                'issueID': logByIssue[issueName].values[0].issue,
                'issueName': issueName,
                'issueKey': logByIssue[issueName].values[0]['key'],
                'typeURL': logByIssue[issueName].values[0]['type_url']
            }
            let newParams = util.concat(this.params, {
                'datas': logByIssue[issueName]
            })
            new LogByIssue(this, newParams).mount(element)
        }
        return res
    }
    template = `
        <div class="project">
            <div class="project-title" l-ref="project-title">
                ${this.params.projectGroup}
            </div>
            <div class="project-logs" l-ref="project-logs">
                
            </div>
        </div>
    `
}
export class LogByDate extends Component {
    logSegment = this.useRef('log-segment')
    totalDurationRef = this.useRef("total-duration")
    logActionRef = this.useRef('log-date-export')
    constructor() {
        super(...arguments);
        this.adjustDuration = this.adjustDuration.bind(this);
        this.deletDuration = this.deletDuration.bind(this);
    }
    adjustDuration(data){
        util.updateItem(this.params.datas.values, (e)=>e.id === data.id, data);
        this.resetDuration()
    }
    deletDuration(data){
        util.popItem(this.params.datas.values, (e)=>e.id === data.logID);
        if (this.params.datas.values.length === 0){
            this.destroy();
        } else {
            this.resetDuration()
        }
    }
    resetDuration(){
        let logs = hUtil.getLogTypeDuration(this.params.datas.values);
        this.totalDurationRef.el.innerHTML = util.secondToHour(logs[1])
    }
    mounted() {
        let self = this;
        let res = super.mounted();
        let element = this.logSegment.el;
        let dateLogbyProject = util.GroupBy(this.params.datas.values, "projectName")
        for (let group in dateLogbyProject) {
            new LogByProject(this, {
                'dateGroup': this.params.dateGroup,
                'projectGroup': group,
                'datas': dateLogbyProject[group]
            }).mount(element)
        }
        this.logActionRef.el.addEventListener('click', event => {
            let exportIds = exports.map(e=>e.id && e.exported === false)
            hUtil.exportLog.bind(this)(exportIds).then(function(response){
                this.patchDownMethod('updateExported', {})
            });
        })
        this.resetDuration()
        return res
    }
    template = `
        <div class="log-group">
            <div class="log-heading">
                <div class="log-heading-title">
                    <span class="datetime"> ${this.params.dateGroup} </span>
                    <button type="button" class="log-date-export" l-ref="log-date-export">
                        <svg class="svg-inline--fa fa-square-up-right" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="square-up-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M384 32H64C28.65 32 0 60.65 0 96v320c0 35.34 28.65 64 64 64h320c35.35 0 64-28.66 64-64V96C448 60.65 419.3 32 384 32zM330.5 323.9c0 6.473-3.889 12.3-9.877 14.78c-5.979 2.484-12.86 1.105-17.44-3.469l-45.25-45.25l-67.92 67.92c-12.5 12.5-32.72 12.46-45.21-.0411l-22.63-22.63C109.7 322.7 109.6 302.5 122.1 289.1l67.92-67.92L144.8 176.8C140.2 172.2 138.8 165.3 141.3 159.4c2.477-5.984 8.309-9.875 14.78-9.875h158.4c8.835 0 15.1 7.163 15.1 15.1V323.9z"></path></svg>
                    </button>
                </div>
                <div>
                    Total: <div class="total-duration" l-ref="total-duration"> 00:00 </div> 
                </div>
            </div>
            <div class="log-segment" l-ref="log-segment">
            </div>
        </div>
    `
}