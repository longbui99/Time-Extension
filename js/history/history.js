
import * as util from "../utils/utils.js"
import * as hUtil from "./historyUtils.js"
import { Component } from "../base.js"
import { LogByDate } from "./historyByDate.js"
import { historySearchPopup } from "./historySearchPopup.js"
export class LogReport extends Component {

    logReportSectionRef = this.useRef('log-report-section')
    logHistoryDateRangeRef = this.useRef('history-date-range')
    durationUnexportedRef = this.useRef('duration-unexpored')
    logHistoryDateRangeTotalRef = this.useRef('log-history-total-range')
    logHistoryRef = this.useRef('log-history')
    logHistorySearchRef = this.useRef('history-search')
    logHistoryTypeRef = this.useRef('log-history-type')
    actionPinRef = this.useRef('action-pin-ref')
    foldConfigRef = this.useRef('fold-config')
    historySearchDetailRef = this.useRef('history-search-detail')

    constructor() {
        super(...arguments);
        this.subscribe('setGlobalData', this.setGlobalData.bind(this));
        this.subscribe('searchChange', this.searchChange.bind(this));
        this.adjustDuration = this.adjustDuration.bind(this);
        this.deletDuration = this.deletDuration.bind(this);
        this.isFold = this.env.historyData?.isFold || false;
        this.env.taskData.trackingMode = this.env.taskData.trackingMode || 'all';
        this.env.taskData.lastDatetimeSelection = this.env.taskData.lastDatetimeSelection || [0, 0];
        this.secondToString = util.parseSecondToString(this.env.resource?.hrs_per_day || 8, this.env.resource?.days_per_week || 5);
    }
    adjustDuration(datas) {
        util.updateItemsByKey(this.result, datas, 'id');
        this.resetDuration()
    }
    deletDuration(data) {
        util.popItem(this.result, (e) => e.id === data.logID);
        if (this.result.length === 0) {
            this.destroy();
        } else {
            this.resetDuration()
        }
    }
    resetDuration(result) {
        let res = hUtil.getLogTypeDuration(this.result)
        this.env.globalTotal = res[1];
        this.env.exportedTotal = res[0];
        this.setGlobalData();
        if (this.daterange) {
            this.daterange.setDate([new Date(this.unix[0] * 1000), new Date(this.unix[1] * 1000)]);
        }
    }
    onChangeRangeHistoryFilter(selectedDates, dateStr, instance) {
        let from_unix = selectedDates[0].getTime() / 1000;
        let to_unix = selectedDates[1].getTime() / 1000;
        this.env.taskData.lastDatetimeSelection = [from_unix, to_unix];
        this.loadHistory(from_unix, to_unix);
        this.update('taskData', this.env.taskData);
    }
    renderLogByDate(historyByDate) {
        for (let group in historyByDate) {
            new LogByDate(this, {
                'dateGroup': group,
                'datas': historyByDate[group],
                'isFold': this.isFold
            }).mount(this.logHistoryRef.el)
        }
    }

    reloadHistory() {
        this.loadHistory(this.unix[0], this.unix[1] + 1)
    }
    async loadHistory(from_unix = 0, unix = 0, refresh = false, keepTotal = false) {
        if ((this.unix && this.unix[0] === from_unix && this.unix[1] === unix) || refresh) {
            return
        }
        this.unix = [from_unix, unix]
        let response = (await this.do_invisible_request('GET', `${this.env.serverURL}/management/task/work-log/history?from_unix=${from_unix}&unix=${unix}&tracking=all&jwt=${this.env.jwt}`));
        let result = (await response.json());
        this.result = result;
        this.searchChange()
    }

    getDateBreakdown(){
        let dailyOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return (item)=>item['start_date'].toLocaleDateString("en-US", dailyOptions)
    }
    getWeekBreakdown(){
        let dailyOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
        let startDate = new Date(this.unix[0]*1000), endDate = new Date(this.unix[1]*1000), startDateOfWeek = parseInt(this.env.historyData.startWeekDay);
        let year = startDate.getFullYear();
        function getStartDateEndDate(date){
            let baseDate = util.addDays(date, -startDateOfWeek)
            let startDate = util.addDays(baseDate, -(baseDate.getDay() + (-startDateOfWeek)))
            let endDate = util.addDays(startDate, 6)
            return [startDate, endDate]
        }
        let weekStartDate = getStartDateEndDate(startDate)[0]

        let firstDate = new Date(startDate.getFullYear(), 0, 1);
        let firstYearTime = firstDate.getTime();
        let nameByWeekNum = {};
        if (weekStartDate.getDay() !== firstDate.getDay()){
            firstDate = getStartDateEndDate(util.addDays(firstDate, 7))[0];
            firstYearTime = firstDate.getTime();
        }
        while (weekStartDate.getFullYear() <= year && weekStartDate <= endDate){
            let nextDate = util.addDays(weekStartDate, 6)
            let week = parseInt((weekStartDate.getTime() - firstYearTime)/(1000*24*60*60)/7)
            nextDate = ((nextDate > endDate)? endDate : nextDate)
            weekStartDate = ((weekStartDate < startDate)? startDate : weekStartDate)
            nameByWeekNum[week] = `Week ${week}, ${weekStartDate.toLocaleDateString("en-US", dailyOptions)} -> ${nextDate.toLocaleDateString("en-US", dailyOptions)}`
            weekStartDate = util.addDays(nextDate, 1)
        }
        return (item)=>{
            let DaysDifference = (item['start_date'].getTime() - firstYearTime)/(1000*24*60*60)
            let week = parseInt(DaysDifference/7)
            return nameByWeekNum[week]
        }

    }
    getMonthBreakdown(){
        let monthlyOptions = {year: 'numeric', month: 'long'};
        return (item)=>item['start_date'].toLocaleDateString("en-US", monthlyOptions)
    }
    getYearBreakdown(){
        let anuallyOptions = {year: 'numeric'};
        return (item)=>item['start_date'].toLocaleDateString("en-US", anuallyOptions)
    }
    getBreakdown(){
        if (this.env.historyData.breakdown == "week"){
            return this.getWeekBreakdown()
        } else
        if (this.env.historyData.breakdown == "month"){
            return this.getMonthBreakdown()
        } else 
        if (this.env.historyData.breakdown == "year") {
            return this.getYearBreakdown()
        } else {
            return this.getDateBreakdown();
        }
    }

    async renderHistory(result){
        this.logHistoryRef.el.innerHTML = '';
        this.logHistoryDateRangeTotalRef.el.innerHTML = util.secondToHour(0)
        let detailOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
        if (result.length) {
            let maxDate = this.unix[1] || 0, minDate = this.unix[0] || new Date().getTime() / 1000;
            for (let record of result) {
                let date = record['start_date'];
                if (!(date instanceof Date)){
                    date = new Date(record['start_date'] + "Z");
                }
                let groupUnix = date.getTime() / 1000;
                if (groupUnix > maxDate) {
                    maxDate = groupUnix;
                } else if (groupUnix < minDate) {
                    minDate = groupUnix;
                }
                record['start_date'] = date;
                record['date'] = date.toLocaleDateString('en-US', detailOptions)
                record['sequence'] = parseInt(Array.from(" " + record['key'])?.reduce((result, item) => {
                    if (!isNaN(item))
                        result += item
                    else
                        result += item.charCodeAt(0)
                    return result
                }))
            }
            this.unix = [minDate, maxDate];
            let historyByDate = util.GroupBy(result, this.getBreakdown());
            this.env.historyByDate = historyByDate;
            this.renderLogByDate(historyByDate);
        }
        this.resetDuration(result);
    }
    setGlobalData() {
        this.logHistoryDateRangeTotalRef.el.innerHTML = util.secondToHour(this.env.globalTotal)
        this.durationUnexportedRef.el.innerHTML = util.secondToHour(this.env.globalTotal - this.env.exportedTotal)
    }
    pinFilterChange() {
        this.actionPinRef.el.classList.toggle('pinned');
        this.env.taskData.pinFilter = !(this.env.taskData.pinFilter || false);
        this.update('taskData', this.env.taskData);
    }
    logTypeChange(type = 'all') {
        let result = []
        this.logHistoryTypeRef.el.classList.remove(this.env.taskData.trackingMode);
        this.logHistoryTypeRef.el.classList.add(type);
        if (type === 'all'){
            result = this.result;
        } else {
            for (let record of this.result){
                if (record.exported !== 1)
                    result.push(record)
            }
        }
        this.env.taskData.trackingMode = type;
        this.renderHistory(result)
    }
    filterResults(){
        let searches = this.logHistorySearchRef.el.value.trim().toLowerCase();
        if (searches){
            searches = searches.split(' ');
            if (searches.length){
                let regex = new RegExp(`.*(${searches.map(e=>e.trim()).join("|")}).*`)
                let result = []
                for (let record of this.result){
                    if (regex.test(record.key.toLowerCase() + "|" + record.taskName.toLowerCase() + "|" + record.description.toLowerCase()))
                    result.push(record)
                }
                this.renderHistory(result)
            }
        }

    }
    searchChange(){
        if (this.logHistorySearchRef.el.value){
            this.filterResults();
        } else{
            this.renderHistory(this.result);
        }
    }
    searchKeyUp(event){
        if ((event.keyCode || event.which) === 13){
            this.searchChange();
        }
    }
    initEvent(){
        let self = this;
        this.foldConfigRef.el.addEventListener('click', this.toggleFoldState.bind(this));
        this.logHistorySearchRef.el.addEventListener('change', this.searchChange.bind(this));
        this.logHistorySearchRef.el.addEventListener('keyup', this.searchKeyUp.bind(this));
    }
    renderAdvanceSearchPopup(){
        if (!this.popup){
            new historySearchPopup(this, {
                pointElement: this.historySearchDetailRef.el,
            }).mount(document.body);
        }
    }
    mounted() {
        let res = super.mounted();
        let self = this;
        let sUnix = 0, eUnix = 0;
        if (Array.isArray(this.env.taskData.lastDatetimeSelection) && this.env.taskData.lastDatetimeSelection.length >= 2 && this.env.taskData.pinFilter) {
            sUnix = this.env.taskData.lastDatetimeSelection[0];
            eUnix = this.env.taskData.lastDatetimeSelection[1];
            this.actionPinRef.el.classList.add('pinned')
        }
        this.loadHistory(sUnix, eUnix).then(e=>{
            if (typeof self.env.taskData.trackingMode === 'string' || self.env.taskData.trackingMode instanceof String) {
                self.logTypeChange(self.env.taskData.trackingMode)
            }
        });
        this.daterange = flatpickr(this.logHistoryDateRangeRef.el, {
            mode: "range", defaultDate: [new Date(), new Date()], altInput: true, altFormat: "M j, Y",
            onClose: self.onChangeRangeHistoryFilter.bind(self)
        });
        this.actionPinRef.el.addEventListener('click', self.pinFilterChange.bind(self));
        this.logHistoryDateRangeTotalRef.el.addEventListener('click', (e) => self.logTypeChange.bind(self)('all'))
        this.durationUnexportedRef.el.addEventListener('click', (e) => self.logTypeChange.bind(self)('unexported'))
        this.historySearchDetailRef.el.addEventListener('click', this.renderAdvanceSearchPopup.bind(this))
        this.initEvent();
        this.updateFoldState();
        return res
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
        this.env.historyData.isFold = this.isFold;
        this.update('historyData', this.env.historyData);
    }
    toggleFoldState(){
        this.isFold = !this.isFold;
        this.updateFoldState();
    }
    forceFoldState(state){
        this.isFold = state;
        this.updateFoldState();
    }
    destroy(){
        this.daterange.destroy()
        super.destroy()
    }
    getTemplate() {
        return `
        <div class="log-report" l-ref="log-report-section">
            <div class="space-segment log-history-navigator"> 
                <div class="log-history-navigator-action" l-ref='log-history-type'>
                    <div class="history-search-detail" l-ref="history-search-detail">
                        <svg class="svg-inline--fa fa-sliders-h fa-w-16" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="sliders-h" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M496 384H160v-16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h80v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h336c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm0-160h-80v-16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h336v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h80c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm0-160H288V48c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16C7.2 64 0 71.2 0 80v32c0 8.8 7.2 16 16 16h208v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h208c8.8 0 16-7.2 16-16V80c0-8.8-7.2-16-16-16z"></path></svg>
                    </div>
                    <div class="history-date-range">
                        <span class="filter-icon">
                            <svg class="svg-inline--fa fa-filter" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg>
                        </span>
                        <input l-ref="history-date-range" class="log-history-navigator-input tm-form-control">
                    </div>
                    <div class="pin-action" l-ref="action-pin-ref" title="Pin Filter">
                        <span class="tm-icon-svg">
                            <svg class="tm-svg-inline--fa" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="map-pin" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M320 144C320 223.5 255.5 288 176 288C96.47 288 32 223.5 32 144C32 64.47 96.47 0 176 0C255.5 0 320 64.47 320 144zM192 64C192 55.16 184.8 48 176 48C122.1 48 80 90.98 80 144C80 152.8 87.16 160 96 160C104.8 160 112 152.8 112 144C112 108.7 140.7 80 176 80C184.8 80 192 72.84 192 64zM144 480V317.1C154.4 319 165.1 319.1 176 319.1C186.9 319.1 197.6 319 208 317.1V480C208 497.7 193.7 512 176 512C158.3 512 144 497.7 144 480z"></path></svg>
                        </span>
                    </div>
                    <div class="history-search">
                        <svg class="svg-inline--fa fa-search history-search-icon fa-w-16" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="search" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path></svg>
                        <input l-ref="history-search" class="log-history-navigator-input  tm-form-control" placeholder="Search ...">
                    </div>
                    <div style="margin-left:auto"></div>
                    <div class="fold-config" l-ref="fold-config">
                        <span class="fold">Fold</span>
                        <span class="unfold">Unfold</span>
                    </div>
                    <div class="duration-description">
                        <span>    
                            <svg class="svg-inline--fa fa-circle" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256z"></path></svg>
                        </span>
                        <span class="duration-unexported" l-ref="duration-unexpored">
                            00:00
                        </span>
                    </div>
                    /
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
}