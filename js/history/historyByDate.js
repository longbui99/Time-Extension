
import * as util from "../utils/utils.js"
import * as hUtil from "./historyUtils.js"
import { Component } from "../base.js"
import { IssueSubsitution } from "../dialog/issueSubsitution.js"
import { LogCompare } from "../dialog/logCompare.js"
class Log extends Component {
    logDurationRef = this.useRef('log-duration')
    logDescriptionRef = this.useRef('log-description')
    actionLogDeleteRef = this.useRef('action-log-delete')
    actionAdjustLogRef = this.useRef('wl-circle-decorator')
    actionViewDifference = this.useRef('question-mark')
    secondToString = util.parseSecondToString(this.env.resource?.hrs_per_day || 8, this.env.resource?.days_per_week || 5)

    constructor() {
        super(...arguments);
        this.data = this.params.datas;
        this.exported = this.data.exported;
        this.duration = this.secondToString(this.params.datas.duration);
        this.description = this.data.description;
    }

    updateExported(data) {
        this.exported = 1;
        this.toggleExported()
    }

    __getSyncValue(key="all") {
        let res = {
            id: this.data.id,
            time: this.logDurationRef.el.value,
            description: this.logDescriptionRef.el.value,
            jwt: this.env.jwt
        }
        if (key != "description"){
            delete res['description']
        }  
        if (key != "time") {
            delete res['time']
        }
        return res
    }

    toggleExported() {
        for (let elClass of this.el.classList){
            if (elClass.startsWith('export-state')){
                this.el.classList.remove(elClass)
            }
        }
        this.el.classList.add('export-state-' + this.exported)
    }

    async _onchangeLogContent(key="time") {
        if (this.exported) {
            this.exported = 0;
            this.toggleExported();
        }
        if (this.exported !== 1) {
            let values = this.__getSyncValue(key);
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
                    if (this.data[key] !== result[key]) {
                        update[key] = result[key];
                    }
                    this.data[key] = result[key]
                }
                if (update) {
                    let datas = {};
                    datas[this.data.id] = update
                    this.reload();
                    this.triggerUpMethod('adjustDuration', datas, 5);
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
            'mode': (this.exported == 1 ? 'exported' : 'unexported'),
            'logID': this.data.id
        }, 5)
    }

    checkUnexported() {
        let a = 0, b = 0;
        if (this.logDescriptionRef.el.value != this.description) a = 3
        if (this.logDurationRef.el.value != this.duration) b = 5
        this.exported = (a + b) || this.data.exported
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
            endDate: new Date(this.data.start_date.getTime() + this.data.duration * 1000),
            comment: this.data.description,
            issueData: {
                id: this.data.issue,
                name: this.data.issueName,
                key: this.data.key,
                type_url: this.data.type_url,
            },
            successCallback: callback
        })
    }
    async showCompareDifferent(){
        let self = this;
        let values = {
            'ids': [self.data.id],
            'jwt': self.env.jwt
        }
        async function callback(data) {
            hUtil.exportLog.bind(this)([this.data.id]).then(function (response) {
                self.updateExported();
                let res = {};
                res[self.data.id] = {'exported': 1}
                self.triggerUpMethod('adjustDuration', res, 5)
            });
        }
        self.do_request('POST', `${self.env.serverURL}/management/issue/work-log/compare`, values).then(function (response){
            response.json().then(e=>{
                self.showDialog(LogCompare, {
                    title: "Compare Log",
                    id: self.data.id,
                    datas: e[self.data.id],
                    successCallback: callback
                })
            })
        });

    }

    mounted() {
        let res = super.mounted();
        let self = this;
        this.logDurationRef.el.addEventListener('change', ()=>self._onchangeLogContent.bind(self)("time"));
        this.logDescriptionRef.el.addEventListener('change', ()=>self._onchangeLogContent.bind(self)("description"));
        this.actionLogDeleteRef.el.addEventListener('click', self.__actionDeleteWorkLogs.bind(self));
        this.logDurationRef.el.addEventListener('keyup', self.checkUnexported.bind(self));
        this.logDescriptionRef.el.addEventListener('keyup', self.checkUnexported.bind(self));
        this.actionAdjustLogRef.el.addEventListener('click', self.editLog.bind(self));
        this.actionViewDifference.el.addEventListener('click', self.showCompareDifferent.bind(self))
        return res
    }
    destroy() {
        super.destroy()
        delete this.params.datas;
    }
    getTemplate() {
        return `
        <div class="log-each export-state-${this.params.datas.exported}" l-ref="export-statement">
            <span class="question-mark" l-ref="question-mark" title="Click to get more detail about exporting status">
                <svg class="svg-inline--fa fa-question" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="question" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M80 160c0-35.3 28.7-64 64-64h32c35.3 0 64 28.7 64 64v3.6c0 21.8-11.1 42.1-29.4 53.8l-42.2 27.1c-25.2 16.2-40.4 44.1-40.4 74V320c0 17.7 14.3 32 32 32s32-14.3 32-32v-1.4c0-8.2 4.2-15.8 11-20.2l42.2-27.1c36.6-23.6 58.8-64.1 58.8-107.7V160c0-70.7-57.3-128-128-128H144C73.3 32 16 89.3 16 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm80 320a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"></path></svg>
            </span>
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
}
class LogByIssue extends Component {
    LogByIssueBtnRef = this.useRef("log-issue-btn")
    LogIssueExportBtnRef = this.useRef("log-issue-export")
    constructor() {
        super(...arguments);
        this.deletDuration = this.deletDuration.bind(this);
    }
    adjustDuration(data) {
        // console.log("LOGBYDATE")
    }
    deletDuration(data) {
        util.popItem(this.params.datas.values, (e) => e.id === data.logID)
        if (this.params.datas.values.length === 0) {
            this.destroy();
        }
    }
    exportLogs(event) {
        let datas = this.params.datas.values;
        let exports = datas.filter(e => e.exported != 1);
        let self = this;
        if (exports.length) {
            let total_duration = 0;
            if (exports.length === 1) {
                total_duration = exports[0].duration;
            } else {
                total_duration = exports.reduce((x, y) => x + y.duration, 0);
            }
            datas = {}
            let exportIds = exports.map(e => e.id)
            exports.map(function (element) {
                datas[element.id] = { 'exported': 1 }
            })
            hUtil.exportLog.bind(this)(exportIds).then(function (response) {
                self.patchDownMethod('updateExported', {})
                self.triggerUpMethod('adjustDuration',
                    datas
                    , 4)
            });
        }
    }
    mounted() {
        let res = super.mounted();
        let self = this;
        let element = this.el;
        for (let logs of this.params.datas.values) {
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
    getTemplate() {
        return `
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
}
class LogByProject extends Component {
    projectTitleRef = this.useRef('project-title')
    projectLogRef = this.useRef('project-logs')
    projectDurationRef = this.useRef('project-duration')
    constructor() {
        super(...arguments);
        this.deletDuration = this.deletDuration.bind(this);
        this.isFold = this.params.isFold;
    }
    adjustDuration(data) {
        // console.log("LOGBYDATE")
    }
    deletDuration(data) {
        util.popItem(this.params.datas.values, (e) => e.id === data.logID);
        if (this.params.datas.values.length === 0) {
            this.destroy();
        } else {
            this.resetDuration()
        }
    }
    resetDuration() {
        let logs = hUtil.getLogTypeDuration(this.params.datas.values);
        this.projectDurationRef.el.innerHTML = util.secondToHour(logs[1])
    }
    updateFoldState(){
        let self = this;
        this.projectLogRef.el.classList.remove(...['fold', 'unfold'])
        if (this.isFold){
                self.projectLogRef.el.classList.add('fold')
                this.projectLogRef.el.style.display = "none";
        } else{
                self.projectLogRef.el.classList.add('unfold')
                this.projectLogRef.el.style.display = "inline-block";
        }
    }
    forceFoldState(state){
        this.isFold = state;
        this.updateFoldState();
    }
    toggleFoldState(){
        this.isFold = !this.isFold;
        this.updateFoldState();
    }
    loadIssueLogs(){
        this.params.datas.values.sort(function (a, b) { return b.sequence - a.sequence })
        let logByIssue = util.GroupBy(this.params.datas.values, "issueName")
        let element = this.projectLogRef.el;
        for (let issueName in logByIssue) {
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
    }
    initEvent(){
        this.projectTitleRef.el.addEventListener('click', this.toggleFoldState.bind(this));
    }
    mounted() {
        let res = super.mounted();
        this.resetDuration();
        this.updateFoldState();
        this.initEvent();
        this.loadIssueLogs();
        return res
    }
    getTemplate() {
        return `
        <div class="project">
            <div class="project-title" l-ref="project-title">
                <span>
                    ${this.params.projectGroup}
                </span>
                <span class="project-duration" l-ref="project-duration">
                    00:00
                </span>
            </div>
            <div class="project-logs" l-ref="project-logs">
                
            </div>
        </div>
    `
    }
}
export class LogByDate extends Component {
    logSegment = this.useRef('log-segment')
    totalDurationRef = this.useRef("total-duration")
    logActionRef = this.useRef('log-date-export')
    foldConfigRef = this.useRef('fold-config')
    constructor() {
        super(...arguments);
        this.adjustDuration = this.adjustDuration.bind(this);
        this.deletDuration = this.deletDuration.bind(this);
        this.isFold = this.params.isFold || false;
    }
    adjustDuration(datas) {
        util.updateItemsByKey(this.params.datas.values, datas, 'id');
        this.resetDuration()
    }
    deletDuration(data) {
        util.popItem(this.params.datas.values, (e) => e.id === data.logID);
        if (this.params.datas.values.length === 0) {
            this.destroy();
        } else {
            this.resetDuration()
        }
    }
    resetDuration() {
        let logs = hUtil.getLogTypeDuration(this.params.datas.values);
        this.totalDurationRef.el.innerHTML = util.secondToHour(logs[1])
    }
    updateFoldState(patch=true){
        this.foldConfigRef.el.classList.remove(...['fold','unfold']);
        if (this.isFold){
            this.foldConfigRef.el.classList.add('fold');
        } else{
            this.foldConfigRef.el.classList.add('unfold');
        }
        if (patch)
            this.patchDownMethod('forceFoldState', this.isFold)
    }
    toggleFoldState(){
        this.isFold = !this.isFold;
        this.updateFoldState();
    }
    forceFoldState(state){
        this.isFold = state;
        this.updateFoldState();
    }
    initEvent(){
        this.foldConfigRef.el.addEventListener('click', this.toggleFoldState.bind(this));
    }
    renderProjectLogs(){
        let self = this;
        let element = this.logSegment.el;
        let dateLogbyProject = util.GroupBy(this.params.datas.values, "projectName")
        for (let group in dateLogbyProject) {
            new LogByProject(this, {
                'dateGroup': this.params.dateGroup,
                'projectGroup': group,
                'datas': dateLogbyProject[group],
                'isFold': this.isFold
            }).mount(element)
        }
        this.logActionRef.el.addEventListener('click', event => {
            let datas = self.params.datas.values;
            let exports = datas.filter(e => e.exported != 1);
            let exportIds = exports.map(e => e.id)
            hUtil.exportLog.bind(self)(exportIds).then(function (response) {
                self.patchDownMethod('updateExported', {})
            });
        })
    }
    mounted() {
        let res = super.mounted();
        this.updateFoldState(false);
        this.resetDuration();
        this.initEvent();
        this.renderProjectLogs();
        return res
    }
    getTemplate() {
        return `
        <div class="log-group">
            <div class="log-heading">
                <div class="log-heading-title">
                    <span class="datetime"> ${this.params.dateGroup} </span>
                    <button type="button" class="log-date-export" l-ref="log-date-export">
                        <svg class="svg-inline--fa fa-square-up-right" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="square-up-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M384 32H64C28.65 32 0 60.65 0 96v320c0 35.34 28.65 64 64 64h320c35.35 0 64-28.66 64-64V96C448 60.65 419.3 32 384 32zM330.5 323.9c0 6.473-3.889 12.3-9.877 14.78c-5.979 2.484-12.86 1.105-17.44-3.469l-45.25-45.25l-67.92 67.92c-12.5 12.5-32.72 12.46-45.21-.0411l-22.63-22.63C109.7 322.7 109.6 302.5 122.1 289.1l67.92-67.92L144.8 176.8C140.2 172.2 138.8 165.3 141.3 159.4c2.477-5.984 8.309-9.875 14.78-9.875h158.4c8.835 0 15.1 7.163 15.1 15.1V323.9z"></path></svg>
                    </button>
                    <div class="fold-config" l-ref="fold-config">
                        <span class="fold">Fold</span>
                        <span class="unfold">Unfold</span>
                    </div>
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
}