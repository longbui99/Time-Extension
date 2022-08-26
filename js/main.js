

import {Component} from "./base.js"
import * as util from "./utils/utils.js"
import {SearchBar} from "./search/search.js"
import {Clock} from "./clock/clock.js"
import {LogReport} from "./history/history.js"
import {CheckList} from "./checklists/checklist.js"
import {Favorite} from "./favorite/favorite.js"
export class Main extends Component {

    searchBarSegment = this.useRef('search-bar-segment')
    contentSegment = this.useRef('tm-tab-content')
    relatedActiveRef = this.useRef("related-active")
    timeLogHeadingRef = this.useRef('time-log-heading')
    acHeadingRef = this.useRef('ac-heading')
    favoriteHeadingRef = this.useRef('favorite-heading')
    logReportHeadingRef = this.useRef('log-report-heading')

    constructor() {
        super(...arguments);
        this.loadID = util.uniqueID();
        this.secondToString = util.parseSecondToString(this.env.resource?.hrs_per_day || 8, this.env.resource?.days_per_week || 5);
        this.trigger_up("load_start", this.loadID)
        this.env.syncChannel(['contentState']);
        this.env.subscribe('issueData', this.issueDataChange.bind(this))
        this.env.subscribe('relativeAdd', this.relativeAdd.bind(this))
    }
    custom_events = {
        'action-export': this.actionExportToOriginalServer
    }
    async relativeAdd(data){
        let params = {
            "id": data.id,
            "jwt": this.env.jwt,
            "payload": {
                'source': 'Extension'
            }
        }
        await this.do_request('POST', `${this.env.serverURL}/management/issue/work-log/add`, params);
        this.fetchRelativeActive();
    }
    renderRelatedActiveData() {
        let template = ""
        let i = 0;
        for (let record of this.relatedActiveIssues) {
            template += `
                <div class="active-item">
                    <span class="issue-key" tabindex="${1100+i}">
                        ${record.key}   
                    </span>
                    <span class="issue-name" title="${record.name}">
                        ${record.name}
                    </span>
                    <span class="duration">
                        ${this.secondToString(record.active_duration)}
                    </span>
                </div>`
            i++;
        }   
        this.relatedActiveRef.el.innerHTML = template;
        let elements = this.relatedActiveRef.el.querySelectorAll('.issue-key')
        let self = this;
        let progressLog = []
        for (let index = 0; index < elements.length; index++) {
            elements[index].addEventListener('click', event => {
                self.env.issueData = self.relatedActiveIssues[index];
                this.env.update('loadIssueData', null);
                // self.env.update('issueData', self.env.issueData)
            })
            if (self.relatedActiveIssues[index].last_start){
                progressLog.push({el:elements[index].parentNode.querySelector('.duration'), active_duration: self.relatedActiveIssues[index].active_duration})
            }
        }
        if (this.relatedCurrentInterval){
            clearInterval(this.relatedCurrentInterval)
        }
        if (progressLog.length){
            let pivotTime = new Date().getTime();
            this.relatedCurrentInterval = setInterval(() => {
                for (let progress of progressLog){
                    progress.el.innerText =this.secondToString(parseInt(progress.active_duration + (new Date().getTime() - pivotTime) / 1000));
                }
            }, 500)
        }
        if (this.relatedActiveIssues.length){
            this.relatedActiveRef.el.parentNode.style.display = "block";
        }
    }
    async fetchRelativeActive(){
        this.relatedActiveRef.el.parentNode.style.display = "none";
        if (!this.env.issueData?.broardcast){
            let params = JSON.stringify({
                "except": this.env.issueData?.id,
                "limit": 6,
                "source": "Extension"
            }), self = this;
            let response = (await this.do_invisible_request('GET', `${this.env.serverURL}/management/issue/my-active?jwt=${this.env.jwt}&payload=${params}`))
            let result = (await response.json());
            this.relatedActiveIssues = result;
            setTimeout(()=>{
                self.trigger_up('relative-updated', result);
            },200)
        }
        this.renderRelatedActiveData()
    }
    issueDataChange(){
        this.fetchRelativeActive();
    }

    async actionExportToOriginalServer(){
        this.env.issueData.timeStatus = null;
        let payload = {
            'source': 'Extension',
            'mode': {
                'worklog': this.env.contentState.showLog,
                'ac': this.env.contentState.showChecklist
            }
        }
        let params = {
            "id": this.env.issueData.id,
            "jwt": this.env.jwt,
            "payload": payload
        }
        await this.do_request('POST', `${this.env.serverURL}/management/issue/export?`, params);
    }
    
    toggleDatetimeSelection(configs, mode, callback){
        let tmpl = `
            <div class="page">
                <div class="loading-layer"></div>
                <div class="input-segment">
                    <input class="date1">
                    <input class="date2 d-none">
                    <button type="button" class="btn btn-start">DONE</button>
                </div>
            </div>
        `
        let element = new DOMParser().parseFromString(tmpl, 'text/html').body.firstChild;
        let date1 = element.querySelector('.date1');
        let date1pickr = flatpickr(date1,{ enableTime: true, defaultDate: configs[0], altInput: true});
        if (mode === 'range'){
            element.querySelector('.date2').classList.remove('d-none');
            let date2 = element.querySelector('.date2');
            let date2pickr = flatpickr(date2,{ enableTime: true, defaultDate: configs[1], altInput: true});
        }
        element.querySelector('.btn').addEventListener('click', event=>{
            let res = {
                date1: new Date(date1.value),
                date2: new Date(date2.value)
            }
            callback(res);
            element.remove();
        })
        document.querySelector('.main-page').append(element);
    }
    renderContentByState(contentClass){
        if (this.contentSegment.el.activeComponent){
            this.contentSegment.el.activeComponent.destroy();
        }
        let component = new contentClass(this);
        component.mount(this.contentSegment.el);
        this.contentSegment.el.activeComponent = component;
        return component;
    }
    contentStateChange(){
        for (let key in this.env.contentState){
            if (this.env.contentState[key]){
                this.tabAtionElements[key][0].classList.add('tm-active');
                let parent = this.tabAtionElements[key][0].parentElement;
                parent.classList.remove('right', 'left', 'middle');
                setTimeout(()=>{
                    parent.classList.add(this.tabAtionElements[key][0].getAttribute('data-action'));
                }, 1)
                this.renderContentByState(this.tabAtionElements[key][1])
            }
            else{
                this.tabAtionElements[key][0].classList.remove('tm-active');
            }
        }
    }
    initContentState(){
        if (this.env.contentState){
            this.contentStateChange();
        } else{
            this.env.contentState = {
                showLog: true,
                showLogReport: false,
                showChecklist: false,
                showFavorite: false
            }
            this.env.update('contentState', this.env.contentState)
            this.initContentState();
        }
    }
    triggerContentType(){
        this.initContentState();
        this.env.update('contentState', this.env.contentState)
    }
    initContentEvent(){
        let self = this;
        function resetContentState(){
            for (let key in self.env.contentState){
                self.env.contentState[key] = false;
            }
        }
        this.timeLogHeadingRef.el.addEventListener('click', ()=>{
            if (!self.env.contentState.showLog){
                resetContentState();
                self.env.contentState.showLog = true;
                self.triggerContentType()
            }
        })
        this.logReportHeadingRef.el.addEventListener('click', ()=>{
            if (!self.env.contentState.showLogReport){
                resetContentState();
                self.env.contentState.showLogReport = true;
                self.triggerContentType()
            }
        })
        this.acHeadingRef.el.addEventListener('click', ()=>{
            if (!self.env.contentState.showChecklist){
                resetContentState();
                self.env.contentState.showChecklist = true;
                self.triggerContentType()
            }
        })
        this.favoriteHeadingRef.el.addEventListener('click', ()=>{
            if (!self.env.contentState.showFavorite){
                resetContentState();
                self.env.contentState.showFavorite = true;
                self.triggerContentType()
            }
        })
    }
    initEvent() {
        let self = this;
        window.addEventListener('keydown', event=>{
            if (event.keyCode === 13){
                document.activeElement.click()               
            }
            if (event.code === 'KeyF' && window.event.ctrlKey && window.event.shiftKey){
                self.searchRef.el.click();
                self.searchRef.el.focus();
            }
            if (event.code === 'Digit1' && window.event.ctrlKey && window.event.shiftKey){
                self.timeLogHeadingRef.el.click();
                event.stopImmediatePropagation();
            }
            if (event.code === 'Digit2' && window.event.ctrlKey && window.event.shiftKey){
                self.logReportHeadingRef.el.click();
            }
            if (event.code === 'Digit3' && window.event.ctrlKey && window.event.shiftKey){
                self.acHeadingRef.el.click();
            }
            if (event.code === 'Digit4' && window.event.ctrlKey && window.event.shiftKey){
                self.favoriteHeadingRef.el.click();
            }
            if (event.code === 'KeyE' && window.event.ctrlKey && window.event.shiftKey){
                self.actionExportToOriginalServer();
            }
        })
    }
    initGeneral(){
        this.tabAtionElements = {
            'showLog': [this.timeLogHeadingRef.el, Clock],
            'showLogReport': [this.logReportHeadingRef.el, LogReport],
            'showChecklist': [this.acHeadingRef.el, CheckList],
            'showFavorite': [this.favoriteHeadingRef.el, Favorite]
        };
        this.searchBar = new SearchBar(this).mount(this.searchBarSegment.el);
    }
    mounted() {
        let res = super.mounted();
        this.initEvent();
        this.initGeneral();
        this.initContentState();
        this.initContentEvent();
        this.fetchRelativeActive();
        return res;
    }
    template = `<div class="main-action-page show">
        <div l-ref="search-bar-segment" style="width:100%">

        </div>
        <div class="issue-active">
            <div class="active-item-group" l-ref="related-active">
            </div>
        </div>
        <div class="tm-tab">
            <div class="tm-tab-background">
            </div>
            <div class="tm-tab-action" data-action="left" l-ref="time-log-heading" title="Ctrl+Shift+1">
                Clock
            </div>
            <div class="tm-tab-action" data-action="middle" l-ref="log-report-heading" title="Ctrl+Shift+2">
                Tracking
            </div>
            <div class="tm-tab-action" data-action="middle" l-ref="ac-heading" title="Ctrl+Shift+3">
                Checklists
            </div>
            <div class="tm-tab-action" data-action="right" l-ref="favorite-heading" title="Ctrl+Shift+4">
                Favorites
            </div>
        </div>
        <div class="tm-tab-content" l-ref="tm-tab-content">
            
        </div>
    </div>`
}