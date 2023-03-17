
import * as util from "../utils/utils.js"
import * as hUtil from "./historyUtils.js"
import { Component } from "../base.js"
import { LogByDate } from "./historyByDate.js"
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

    constructor() {
        super(...arguments);
        this.subscribe('setGlobalData', this.setGlobalData.bind(this));
        this.subscribe('reloadHistory', this.reloadHistory.bind(this));
        this.adjustDuration = this.adjustDuration.bind(this);
        this.deletDuration = this.deletDuration.bind(this);
        this.isFold = this.env.historyData?.isFold || false;
        this.env.issueData.trackingMode = this.env.issueData.trackingMode || 'all';
        this.env.issueData.lastDatetimeSelection = this.env.issueData.lastDatetimeSelection || [0, 0];
        this.secondToString = util.parseSecondToString(this.env.resource?.hrs_per_day || 8, this.env.resource?.days_per_week || 5)
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
        let res = hUtil.getLogTypeDuration(result || this.result)
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
        this.env.issueData.lastDatetimeSelection = [from_unix, to_unix];
        this.loadHistory(from_unix, to_unix);
        this.update('issueData', this.env.issueData);
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
        let response = (await this.do_invisible_request('GET', `${this.env.serverURL}/management/issue/work-log/history?from_unix=${from_unix}&unix=${unix}&tracking=${this.env.issueData.trackingMode}&jwt=${this.env.jwt}`));
        let result = (await response.json());
        this.result = result;
        this.searchChange()
    }
    async renderHistory(result){
        this.logHistoryRef.el.innerHTML = '';
        this.logHistoryDateRangeTotalRef.el.innerHTML = util.secondToHour(0)
        let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
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
            let historyByDate = util.GroupBy(result, (item) => {
                return item['start_date'].toLocaleDateString("en-US", options)
            });
            this.env.historyByDate = historyByDate;
            this.resetDuration(result);
            this.renderLogByDate(historyByDate);
        }
    }
    setGlobalData() {
        this.logHistoryDateRangeTotalRef.el.innerHTML = util.secondToHour(this.env.globalTotal)
        this.durationUnexportedRef.el.innerHTML = util.secondToHour(this.env.globalTotal - this.env.exportedTotal)
    }
    pinFilterChange() {
        this.actionPinRef.el.classList.toggle('pinned');
        this.env.issueData.pinFilter = !(this.env.issueData.pinFilter || false);
        this.update('issueData', this.env.issueData);
    }
    logTypeChange(type = 'all') {
        this.logHistoryTypeRef.el.classList.remove(this.env.issueData.trackingMode)
        this.logHistoryTypeRef.el.classList.add(type)
        this.env.issueData.trackingMode = type;
        this.update('issueData', this.env.issueData);
        this.loadHistory(this.unix[0], this.unix[1] + 1, false, true)
    }
    filterResults(){
        let searches = this.logHistorySearchRef.el.value.trim().toLowerCase();
        if (searches){
            searches = searches.split(' ');
            if (searches.length){
                let regex = new RegExp(`.*(${searches.map(e=>e.trim()).join("|")}).*`)
                let result = []
                for (let record of this.result){
                    if (regex.test(record.key.toLowerCase() + "|" + record.issueName.toLowerCase() + "|" + record.description.toLowerCase()))
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
        // this.logHistorySearchRef.el.addEventListener('keyup', this.searchKeyUp.bind(this));
    }
    mounted() {
        let res = super.mounted();
        let self = this;
        let sUnix = 0, eUnix = 0;
        if (Array.isArray(this.env.issueData.lastDatetimeSelection) && this.env.issueData.lastDatetimeSelection.length >= 2 && this.env.issueData.pinFilter) {
            sUnix = this.env.issueData.lastDatetimeSelection[0];
            eUnix = this.env.issueData.lastDatetimeSelection[1];
            this.actionPinRef.el.classList.add('pinned')
        }
        this.loadHistory(sUnix, eUnix);
        this.daterange = flatpickr(this.logHistoryDateRangeRef.el, {
            mode: "range", defaultDate: [new Date(), new Date()], altInput: true, altFormat: "M j, Y",
            onClose: self.onChangeRangeHistoryFilter.bind(self)
        });
        if (typeof this.env.issueData.trackingMode === 'string' || this.env.issueData.trackingMode instanceof String) {
            // this.logTypeChange(this.env.issueData.trackingMode)
        }
        this.actionPinRef.el.addEventListener('click', self.pinFilterChange.bind(self));
        this.logHistoryDateRangeTotalRef.el.addEventListener('click', (e) => self.logTypeChange.bind(self)('all'))
        this.durationUnexportedRef.el.addEventListener('click', (e) => self.logTypeChange.bind(self)('unexported'))
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
    getTemplate() {
        return `
        <div class="log-report" l-ref="log-report-section">
            <div class="space-segment log-history-navigator"> 
                <div class="log-history-navigator-action" l-ref='log-history-type'>
                    <span class="filter-icon">
                        <svg class="svg-inline--fa fa-filter" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="filter" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M3.853 54.87C10.47 40.9 24.54 32 40 32H472C487.5 32 501.5 40.9 508.1 54.87C514.8 68.84 512.7 85.37 502.1 97.33L320 320.9V448C320 460.1 313.2 471.2 302.3 476.6C291.5 482 278.5 480.9 268.8 473.6L204.8 425.6C196.7 419.6 192 410.1 192 400V320.9L9.042 97.33C-.745 85.37-2.765 68.84 3.854 54.87L3.853 54.87z"></path></svg>
                    </span>
                    <input l-ref="history-date-range" class="log-history-navigator-input tm-form-control">
                    <div class="pin-action" l-ref="action-pin-ref" title="Pin Filter">
                        <span class="tm-icon-svg">
                            <svg class="tm-svg-inline--fa" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="map-pin" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M320 144C320 223.5 255.5 288 176 288C96.47 288 32 223.5 32 144C32 64.47 96.47 0 176 0C255.5 0 320 64.47 320 144zM192 64C192 55.16 184.8 48 176 48C122.1 48 80 90.98 80 144C80 152.8 87.16 160 96 160C104.8 160 112 152.8 112 144C112 108.7 140.7 80 176 80C184.8 80 192 72.84 192 64zM144 480V317.1C154.4 319 165.1 319.1 176 319.1C186.9 319.1 197.6 319 208 317.1V480C208 497.7 193.7 512 176 512C158.3 512 144 497.7 144 480z"></path></svg>
                        </span>
                    </div>
                    <div class="fold-config" l-ref="fold-config">
                        <span class="fold">Fold</span>
                        <span class="unfold">Unfold</span>
                    </div>
                    <div style="margin-left:auto"></div>
                    <div class="history-search">
                        <svg class="svg-inline--fa fa-search history-search-icon fa-w-16" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="search" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path></svg>
                        <input l-ref="history-search" class="log-history-navigator-input  tm-form-control" placeholder="Search ...">
                    </div>
                    <div class="duration-description">
                        <span>    
                            <svg class="svg-inline--fa fa-circle" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256z"></path></svg>
                        </span>
                        <span l-ref="duration-unexpored">
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