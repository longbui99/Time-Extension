
import * as util from "../utils/utils.js"
import { Component } from "../base.js"
export class Clock extends Component {

    timeLogSectionRef = this.useRef('time-log-section')
    assingneeRef = this.useRef("assignee-ref")
    testerRef = this.useRef("tester-ref")
    pointRef = this.useRef("point-ref")
    totalDurationRef = this.useRef('total-duration')
    myTotalDurationRef = this.useRef('my-total-duration')
    activeDurationIconRef = this.useRef('active-duration-icon')
    activeDurationRef = this.useRef('active-duration')
    actionAddRef = this.useRef('action-add')
    actionResumeRef = this.useRef('action-resume')
    actionPauseRef = this.useRef('action-pause')
    actionStopRef = this.useRef('action-stop')
    commentRef = this.useRef('comment-for-issue')
    manualLogref = this.useRef('manual-log-text')
    loggedDate = this.useRef("start-date")
    trackingDelete = this.useRef('action-tracking-delete')
    constructor() {
        super(...arguments);
        this.secondToString = util.parseSecondToString(this.env.resource?.hrs_per_day || 8, this.env.resource?.days_per_week || 5);
        this.subscribe('issueData', this.renderClockData.bind(this))
    }

    async renderTimeActions() {
        if (this.env.issueData) {
            if (this.env.issueData.timeStatus === "active") {
                this.actionAddRef.el.style.display = "none";
                this.actionResumeRef.el.style.display = "none";
                this.actionPauseRef.el.style.display = "flex";
                this.actionStopRef.el.style.display = "flex";
            }
            else if (this.env.issueData.timeStatus === "pause") {
                this.actionAddRef.el.style.display = "none";
                this.actionResumeRef.el.style.display = "flex";
                this.actionPauseRef.el.style.display = "none";
                this.actionStopRef.el.style.display = "flex";
            }
            else if (this.env.issueData.timeStatus === "force") {
                this.actionAddRef.el.style.display = "flex";
                this.actionResumeRef.el.style.display = "none";
                this.actionPauseRef.el.style.display = "none";
                this.actionStopRef.el.style.display = "flex";
            }
            else {
                if (this.manualLogref.el.value) {
                    this.env.issueData.timeStatus = "force";
                    this.renderTimeActions();
                }
                else {
                    this.actionAddRef.el.style.display = "flex";
                    this.actionResumeRef.el.style.display = "none";
                    this.actionPauseRef.el.style.display = "none";
                    this.actionStopRef.el.style.display = "none";
                }
            }
        }
        else {
            this.actionAddRef.el.style.display = "none";
            this.actionResumeRef.el.style.display = "none";
            this.actionPauseRef.el.style.display = "none";
            this.actionStopRef.el.style.display = "none";
        }
    }
    async renderClockData(refresh = false) {
        if (this.currentInterval) {
            clearInterval(this.currentInterval)
        }
        if (this.env.issueData) {
            if (refresh === true) {
                this.update('loadIssueData', null);
            }
            let record = this.env.issueData;
            this.totalDurationRef.el.innerText = util.secondToHMSString(record.total_duration);
            this.myTotalDurationRef.el.innerText = util.secondToHMSString(record.my_total_duration);
            this.activeDurationRef.el.innerText = util.secondToHMS(record.active_duration);
            this.pointRef.el.innerText = record.point + (record.estimate_unit !== "general" ? `(${record.estimate_unit})` : '');
            this.assingneeRef.el.innerText = record.assignee || 'Unset';
            this.testerRef.el.innerText = record.tester || 'Unset'
            this.commentRef.el.innerText = record.comment || record.localComment || '';
            this.manualLogref.el.value = record.localManualLog || '';
            this.commentRef.el.setAttribute("rows", ((record.comment !== "" && record.comment) ? record.comment.split("\n").length : 1));
            if (record.active_duration > 0) {
                this.env.issueData.timeStatus = "pause";
            }
            if (record.last_start) {
                let pivotTime = new Date().getTime();
                this.currentInterval = setInterval(() => {
                    this.activeDurationRef.el.innerText = util.secondToHMS(parseInt(record.active_duration + (new Date().getTime() - pivotTime) / 1000));
                }, 500)
                this.env.issueData.timeStatus = "active";
            }
        }
        this.renderTimeActions();
    }
    async _pauseWorkLog(id = false, refresh = true) {
        let params = {
            "id": id || this.env.issueData.id,
            "jwt": this.env.jwt,
            "payload": {
                'description': this.commentRef.el.value,
                'source': 'Extension'
            }
        }
        let result = (await this.do_invisible_request('POST', `${this.env.serverURL}/management/issue/work-log/pause`, params));
        this.renderClockData(true);
    }

    _initPause() {
        let self = this;
        this.actionPauseRef.el.addEventListener('click', (event) => {
            if (self.env.issueData.timeStatus === "active") {
                self.env.issueData.timeStatus = "pause";
                self._pauseWorkLog()
            }
        })
    }
    async _addWorkLog(refresh = true) {
        let params = {
            "id": this.env.issueData.id,
            "jwt": this.env.jwt,
            "payload": {
                'source': 'Extension'
            }
        }
        let result = (await this.do_request('POST', `${this.env.serverURL}/management/issue/work-log/add`, params));
        this.renderClockData(refresh);
    }
    _initAddWorkLog() {
        let self = this;
        this.actionAddRef.el.addEventListener('click', (event) => {
            if (self.env.issueData.timeStatus !== "active") {
                self.env.issueData.timeStatus = "active";
                self._addWorkLog()
            }
        })
        this.actionResumeRef.el.addEventListener('click', (event) => {
            if (self.env.issueData.timeStatus !== "active") {
                self.env.issueData.timeStatus = "active";
                self._addWorkLog()
            }
        })
    }

    async _doneWorkLog(refresh = true) {
        let date = new Date();
        let payload = {
            'source': 'Extension',
            'description': this.commentRef.el.value,
            'start_date': `${this.loggedDate.el.value}T${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}${util.getTimezoneOffset()}00`
        }
        let triggerServer = true;
        if (this.manualLogref.el.value.length > 0) {
            triggerServer = false;
            payload['time'] = this.manualLogref.el.value;
        }
        let params = {
            "id": this.env.issueData.id,
            "jwt": this.env.jwt,
            "payload": payload
        }

        if (triggerServer) {
            this.env.issueData.timeStatus = false;
            (await this.do_request('POST', `${this.env.serverURL}/management/issue/work-log/done`, params));
        }
        else {
            (await this.do_request('POST', `${this.env.serverURL}/management/issue/work-log/manual`, params));
            this.manualLogref.el.value = '';
        }
        this.renderClockData(refresh);
        this.commentRef.el.value = '';
        this.env.issueData.timeStatus = null;
        this.env.issueData.localManualLog = '';
        this.env.syncOne('issueData', this.env.issueData)
    }
    _initDoneWorkLog() {
        let self = this;
        this.actionStopRef.el.addEventListener('click', (event) => {
            self._doneWorkLog()
        })
    }
    _initManualChange() {
        let self = this;
        this.manualLogref.el.addEventListener('keyup', function (event) {
            if (!['pause', 'active'].includes(self.env.issueData?.timeStatus)) {
                self.env.issueData.timeStatus = "force";
                self.env.issueData.localManualLog = self.manualLogref.el.value;
                self.env.syncOne('issueData', self.env.issueData);
                self.renderTimeActions();
            }
        })
    }
    _initCommentEvent() {
        let self = this;
        this.commentRef.el.addEventListener("keyup", (event) => {
            if (event.keyCode == 13 && !window.event.ctrlKey) {
                self.commentRef.el.setAttribute("rows", parseInt(self.commentRef.el.getAttribute("rows")) + 1)
                event.stopPropagation()
            }
            else {
                let value = self.commentRef.el.value;
                self.commentRef.el.setAttribute("rows", ((value !== "") ? value.split("\n").length : 1));
            }
            self.env.issueData.localComment = self.commentRef.el.value;
            self.env.syncOne('issueData', self.env.issueData)
        })
    }
    async _initIconRef() {
        let self = this;
        this.trackingDelete.el.addEventListener("click", async (event) => {
            if (['pause', 'active'].includes(self.env.issueData.timeStatus)) {
                let payload = {
                    'source': 'Extension'
                }
                let params = {
                    "id": self.env.issueData.id,
                    "jwt": self.env.jwt,
                    "payload": payload
                }
                if (!self.manualLogref.el.value) {
                    self.env.issueData.timeStatus = "normal";
                }
                await self.do_request('POST', `${self.env.serverURL}/management/issue/work-log/cancel`, params);
                self.renderClockData(true);
            }
        })
    }
    _initEvent() {
        window.addEventListener('keyup', (event) => {
            if (window.event.ctrlKey && event.keyCode == 13) {
                if (self.env.contentState.showLog) {
                    self._doneWorkLog();
                }
            }
        })
        this._initPause();
        this._initAddWorkLog();
        this._initDoneWorkLog();
        this._initManualChange();
        this._initCommentEvent();
        this._initIconRef();
        let self = this;
        this.flatPickr = flatpickr(this.loggedDate.el, { defaultDate: new Date(), dateFormat: 'Y-m-d' });
    }
    destroy() {
        this.flatPickr.destroy();
        return super.destroy();
    }
    mounted() {
        let res = super.mounted();
        this.renderClockData(true);
        this._initEvent();
        return res
    }
    getTemplate() {
        return `
        <div class="issue time-log" l-ref="time-log-section">
            <div class="space-segment">
                <div class="clock-segment">
                    <div class="issue-content p-1">
                        <div>
                            <span class="tm-icon-svg">
                                <svg class="svg-inline--fa fa-arrow-right" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M438.6 278.6l-160 160C272.4 444.9 264.2 448 256 448s-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L338.8 288H32C14.33 288 .0016 273.7 .0016 256S14.33 224 32 224h306.8l-105.4-105.4c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160C451.1 245.9 451.1 266.1 438.6 278.6z"></path></svg>
                            </span>
                            <b l-ref="assignee-ref"></b>
                        </div>
                        <div>
                            <span class="tm-icon-svg">
                                <svg class="svg-inline--fa fa-user-check" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="user-check" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" data-fa-i2svg=""><path fill="currentColor" d="M274.7 304H173.3C77.61 304 0 381.6 0 477.3C0 496.5 15.52 512 34.66 512H413.3C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304zM224 256c70.7 0 128-57.31 128-128S294.7 0 224 0C153.3 0 96 57.31 96 128S153.3 256 224 256zM632.3 134.4c-9.703-9-24.91-8.453-33.92 1.266l-87.05 93.75l-38.39-38.39c-9.375-9.375-24.56-9.375-33.94 0s-9.375 24.56 0 33.94l56 56C499.5 285.5 505.6 288 512 288h.4375c6.531-.125 12.72-2.891 17.16-7.672l104-112C642.6 158.6 642 143.4 632.3 134.4z"></path></svg>                            </span>
                            <b l-ref="tester-ref"></b>
                        </div>
                        <div ><b>Estimate: </b><span l-ref="point-ref">Unset</span></div>
                    </div>
                    <div class="duration">
                        <div class="total-duration">
                            <p><span class="avt"><img class="avt-img" src="data:image/png;base64,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"></span> <span l-ref="my-total-duration">0m</span></p> /
                            <small l-ref="total-duration">0m</small>
                        </div>
                        <div class="active-duration">
                            <button type="button" l-ref="active-duration-icon" class="avt">
                                <span class="tm-icon-svg"><svg class="svg-inline--fa fa-stopwatch" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="stopwatch" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M272 0C289.7 0 304 14.33 304 32C304 49.67 289.7 64 272 64H256V98.45C293.5 104.2 327.7 120 355.7 143L377.4 121.4C389.9 108.9 410.1 108.9 422.6 121.4C435.1 133.9 435.1 154.1 422.6 166.6L398.5 190.8C419.7 223.3 432 262.2 432 304C432 418.9 338.9 512 224 512C109.1 512 16 418.9 16 304C16 200 92.32 113.8 192 98.45V64H176C158.3 64 144 49.67 144 32C144 14.33 158.3 0 176 0L272 0zM248 192C248 178.7 237.3 168 224 168C210.7 168 200 178.7 200 192V320C200 333.3 210.7 344 224 344C237.3 344 248 333.3 248 320V192z"></path></svg>
                            </button>
                            </span> <span l-ref="active-duration">0m</span>
                            <span class="action-tracking-delete" l-ref="action-tracking-delete" title="Remove this tracking">
                                <svg class="svg-inline--fa fa-xmark" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="xmark" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"></path></svg><!-- <i class="fas fa-times"></i> Font Awesome fontawesome.com -->
                            </span>
                        </div>
                    </div>
                    <div class="time-action">
                        <div class="manual-log">
                            <input type="text" class="tm-form-control" placeholder="1w 1d 1h 1m 1s" l-ref="manual-log-text" tabindex="1001"/>
                            <label for="start-date-selection" class="start-date-label">
                                <span class="tm-icon-svg"><svg class="svg-inline--fa fa-calendar" aria-hidden="true" focusable="false" data-prefix="far" data-icon="calendar" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"></path></svg>
                                </span>
                            </label>
                            <input id="start-date-selection" type="text" class="tm-form-control start-date" l-ref="start-date">
                        </div>
                        <div class="action-group">
                            <div class="action add" l-ref="action-add" tabindex="1003" style="display:none">
                                <button type="button" class="btn btn-start">START</button>    
                            </div>
                            <div class="action add" l-ref="action-resume" tabindex="1004"  style="display:none">
                                <button type="button" class="btn btn-resume">RESUME</button>    
                            </div>
                            <div class="action pause" l-ref="action-pause" tabindex="1005"  style="display:none">
                                <button type="button" class="btn btn-pause">PAUSE</button>       
                            </div>
                            <div title="Ctrl+Enter" class="action stop" l-ref="action-stop" tabindex="1006"  style="display:none">
                                <button type="button" type="button"  class="btn btn-done">DONE</button>      
                            </div>
                        </div>
                    </div>
                    <div class="comment">
                        <textarea rows="1" type="text" class="tm-form-control" placeholder="What are you doing?" l-ref="comment-for-issue" tabindex="1002"></textarea>
                    </div>
                </div>
            </div>
        </div>
    `
    }
}