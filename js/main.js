class Main extends Component {

    searchRef = this.useRef('search-bar-ticket')
    searchResultRef = this.useRef('search-bar-result')
    totalDurationRef = this.useRef('total-duration')
    myTotalDurationRef = this.useRef('my-total-duration')
    activeDurationRef = this.useRef('active-duration')
    activeDurationIconRef = this.useRef('active-duration-icon')
    commentRef = this.useRef('comment-for-ticket')
    manualLogref = this.useRef('manual-log-text')
    actionAddRef = this.useRef('action-add')
    actionPauseRef = this.useRef('action-pause')
    actionStopRef = this.useRef('action-stop')
    relatedActiveRef = this.useRef("related-active")
    pointRef = this.useRef("point-ref")
    typeRef = this.useRef("type-ref")
    statusRef = this.useRef("status-ref")
    assingneeRef = this.useRef("assignee-ref")
    openTicketref = this.useRef("open-ticket")
    reloadTicketRef = this.useRef("reload-ticket")
    loggedDate = this.useRef("start-date")
    acContainerRef = this.useRef("ac-content")
    timeLogHeadingRef = this.useRef('time-log-heading')
    acHeadingRef = this.useRef('ac-heading')

    constructor() {
        super(...arguments);
        this.ticketData = this.subEnv.ticketData || null;
        this.loadedData = [];
        this.secondToString = parseSecondToString(this.subEnv.resource.hrs_per_day, this.subEnv.resource.days_per_week)
    }
    _getDisplayName(record, length = 40000) {
        return `${record.key}: ${(record.name.length > length) ? record.name.substring(0, length) + "..." : record.name}`;
    }
    _minifyString(string, length){
        if (string.length >= length){
            string = string.split(" ").map(e => e[0].toUpperCase()).join("")
        }
        return string
    }
    async renderTimeActions() {
        if (this.ticketData) {
            if (this.ticketData.timeStatus === "active") {
                this.actionAddRef.el.style.display = "none";
                this.actionPauseRef.el.style.display = "inline-block";
                this.actionStopRef.el.style.display = "inline-block";
            }
            else if (this.ticketData.timeStatus === "pause") {
                this.actionAddRef.el.style.display = "inline-block";
                this.actionPauseRef.el.style.display = "none";
                this.actionStopRef.el.style.display = "inline-block";
            }
            else {
                this.actionAddRef.el.style.display = "inline-block";
                this.actionPauseRef.el.style.display = "none";
                this.actionStopRef.el.style.display = "none";
            }
        }
        else {
            this.actionAddRef.el.style.display = "none";
            this.actionPauseRef.el.style.display = "none";
            this.actionStopRef.el.style.display = "none";
        }
    }
    renderRelatedActiveData() {
        let template = ""
        for (let record of this.relatedActiveTickets) {
            template += `
                <div class="active-item">
                    <div class="icon-group push-relative-ticket">
                        <span class="icon">
                            <i class="fa-solid fa-map-pin"></i>
                        </span>
                    </div>
                    <span class="ticket-key" title="${this._getDisplayName(record, 40)}">
                        ${this._getDisplayName(record, 22)}
                    </span>
                    <span class="duration">
                        ${this.secondToString(record.my_total_duration + record.active_duration)}
                    </span>
                </div>`
        }
        this.relatedActiveRef.el.innerHTML = template;
        let elements = this.relatedActiveRef.el.querySelectorAll('.push-relative-ticket')
        let self = this;
        for (let index = 0; index < elements.length; index++) {
            elements[index].addEventListener('click', event => {
                if (self.ticketData) self._pauseWorkLog(this.ticketData.id, false);
                self.ticketData = self.relatedActiveTickets[index];
                self.storeAndRenderTicket(true)
            })
        }
    }
    ticketNavigator() {
        let self = this;
        this.openTicketref.el.addEventListener('click', (event) => {
            window.open(self.ticketData.url, '_blank')
        })
        this.reloadTicketRef.el.addEventListener('click', (event) => {
            self.do_request(`${this.subEnv.serverURL}/management/ticket/fetch/${this.ticketData.id}?jwt=${this.subEnv.jwt}`).then(() => {
                self.renderTicketData(true);
            });
        })
    }
    async renderTicketData(refresh = false) {
        if (this.currentInterval) {
            clearInterval(this.currentInterval)
        }
        if (this.ticketData) {
            if (refresh) {
                let response = (await this.do_request(`${this.subEnv.serverURL}/management/ticket/get/${this.ticketData.id}?jwt=${this.subEnv.jwt}`));
                let result = (await response.json());
                for (let key of Object.keys(result)) { this.ticketData[key] = result[key]; }
            }
            let record = this.ticketData;
            this.totalDurationRef.el.innerText =this.secondToString(record.total_duration);
            this.myTotalDurationRef.el.innerText =this.secondToString(record.my_total_duration);
            this.activeDurationRef.el.innerText =this.secondToString(record.active_duration);
            this.pointRef.el.innerText = record.point;
            this.typeRef.el.innerHTML = `<img src="${record.type_url}"/>`
            this.statusRef.el.innerText = record.status || '';
            this.assingneeRef.el.innerText = record.assignee || '';
            this.commentRef.el.innerText = record.comment || '';
            this.commentRef.el.setAttribute("rows", ((record.comment !== "" && record.comment) ? record.comment.split("\n").length : 1));
            if (record.active_duration > 0) {
                this.ticketData.timeStatus = "pause";
            }
            if (record.last_start) {
                let pivotTime = new Date().getTime();
                this.currentInterval = setInterval(() => {
                    this.activeDurationRef.el.innerText =this.secondToString(parseInt(record.active_duration + (new Date().getTime() - pivotTime) / 1000));
                }, 500)
                this.ticketData.timeStatus = "active";
            }
            this.el.querySelector('.ticket-navigation').style.display = "inline-block";
            this.ticketNavigator();
        }
        else {
            this.el.querySelector('.ticket-navigation').style.display = "none";
        }
        this.renderTimeActions()
    }
    storeAndRenderTicket(refresh = false) {
        this.renderContent()
        // if (chrome?.storage) {
        //     let data = (await chrome.storage.sync.get([storage]));
        //     data.ticketData = this.ticketData;
        //     await chrome.storage.sync.set({ 'timeLogStorage': data })
        // }
        // else {
        let data = JSON.parse(localStorage.getItem(storage) || "{}");
        data.ticketData = this.ticketData;
        localStorage.setItem(storage, JSON.stringify(data))
        // }
    }
    async chooseTicket(index) {
        if (this.ticketData) this._pauseWorkLog(this.ticketData.id, false);
        this.ticketData = this.loadedData[index];
        this.searchResultRef.el.style.display = 'none';
        this.storeAndRenderTicket()
    }
    loadSearchedTickets(data) {
        let element = this.searchResultRef.el, record = {}, self = this;
        for (let i = 0; i < data.length; i++) {
            record = data[i];
            let p = document.createElement('p');
            data[i].displayName = this._getDisplayName(record);
            let statusSpan = document.createElement('em')
            statusSpan.innerText = this._minifyString(record.status, 11)
            let typeImg = document.createElement('img')
            typeImg.setAttribute('src', record.type_url)
            let textSpan = document.createElement('span')
            textSpan.innerText = record.displayName
            p.append(typeImg)
            p.append(textSpan)
            p.append(statusSpan)
            p.addEventListener('click', () => {
                self.chooseTicket(i);
            })
            element.append(p);
        }
        element.style.display = 'inline-block';
    }
    async _searchTicket(text) {
        let result = (await this.do_request(`${this.subEnv.serverURL}/management/ticket/search/${text}?limitRecord=${11}&jwt=${this.subEnv.jwt}`));
        this.loadedData = (await result.json());
        this.loadSearchedTickets(this.loadedData);
    }
    _initSearchBar() {
        let self = this;
        this.searchRef.el.addEventListener('change', (event) => {
            this.searchResultRef.el.innerHTML = '';
            if (this.searchRef.el.value.length > 0) {
                self._searchTicket(this.searchRef.el.value)
            }
        })
    }
    async _pauseWorkLog(id = false, refresh = true) {
        let params = {
            "id": id || this.ticketData.id,
            "jwt": this.subEnv.jwt,
            "payload": JSON.stringify({
                'description': this.commentRef.el.value,
                'source': 'Extension'
            })
        }
        let result = (await this.do_request(`${this.subEnv.serverURL}/management/ticket/work-log/pause?${new URLSearchParams(params)}`));
        if (refresh)
            this.renderTicketData(true);
    }
    _initPause() {
        let self = this;
        this.actionPauseRef.el.addEventListener('click', (event) => {
            if (self.ticketData.timeStatus === "active") {
                self.ticketData.timeStatus = "pause";
                self._pauseWorkLog()
            }
        })
    }
    async _addWorkLog() {
        let params = {
            "id": this.ticketData.id,
            "jwt": this.subEnv.jwt,
            "payload": JSON.stringify({
                'source': 'Extension'
            })
        }
        let result = (await this.do_request(`${this.subEnv.serverURL}/management/ticket/work-log/add?${new URLSearchParams(params)}`));
        this.renderTicketData(true);
    }
    _initAddWorkLog() {
        let self = this;
        this.actionAddRef.el.addEventListener('click', (event) => {
            if (self.ticketData.timeStatus !== "active") {
                self.ticketData.timeStatus = "active";
                self._addWorkLog()
            }
        })
    }
    _getTimezoneOffset(){
        let offset = String(-new Date().getTimezoneOffset()/60)
        if (offset.length === 1){
            offset = "+" + offset
        }
        offset = offset[0] + offset[1].padStart(2, '0')
        return offset
    }

    async _doneWorkLog() {
        let payload = {
            'source': 'Extension',
            'description': this.commentRef.el.value,
            'start_date': `${this.loggedDate.el.value}${"T12:00:00"}${this._getTimezoneOffset()}00`
        }
        let triggerServer = true;
        if (this.manualLogref.el.value.length > 0) {
            triggerServer = false;
            payload['time'] = this.manualLogref.el.value;
        }
        let params = {
            "id": this.ticketData.id,
            "jwt": this.subEnv.jwt,
            "payload": JSON.stringify(payload)
        }

        if (triggerServer) {
            this.ticketData.timeStatus = false;
            (await this.do_request(`${this.subEnv.serverURL}/management/ticket/work-log/done?${new URLSearchParams(params)}`));
        }
        else {
            (await this.do_request(`${this.subEnv.serverURL}/management/ticket/work-log/manual?${new URLSearchParams(params)}`));
            this.manualLogref.el.value = '';
        }
        this.renderTicketData(true)
    }
    _initDoneWorkLog() {
        let self = this;
        this.actionStopRef.el.addEventListener('click', (event) => {
            self._doneWorkLog()
        })
    }
    _initManualChange() {
        let self = this;
        this.manualLogref.el.addEventListener('keyup', event => {
            (10 != event.keyCode && 13 != event.keyCode) || !event.ctrlKey || self._doneWorkLog();
            if (!['pause', 'active'].includes(self.ticketData?.timeStatus)) {
                self.ticketData.timeStatus = "pause";
                self.renderTimeActions();
            }
        })
    }
    resetRows() {

    }
    _initCommentEvent() {
        let self = this;
        this.commentRef.el.addEventListener("keyup", (event) => {
            if (event.keyCode == 13) {
                self.commentRef.el.setAttribute("rows", parseInt(self.commentRef.el.getAttribute("rows")) + 1)
            }
            else {
                let value = self.commentRef.el.value;
                self.commentRef.el.setAttribute("rows", ((value !== "") ? value.split("\n").length : 1));
            }
        })
    }
    async _initIconRef(){
        let self = this;
        this.activeDurationIconRef.el.addEventListener("click", async (event)=>{
            if (window.event.ctrlKey && window.event.shiftKey) {
                self.ticketData.timeStatus = null;
                let payload = {
                    'source': 'Extension'
                }
                let params = {
                    "id": self.ticketData.id,
                    "jwt": self.subEnv.jwt,
                    "payload": JSON.stringify(payload)
                }
                await self.do_request(`${self.subEnv.serverURL}/management/ticket/work-log/cancel?${new URLSearchParams(params)}`);
                self.renderTicketData(true);
            }
        })
    }
    initEvent() {
        this._initPause();
        this._initAddWorkLog();
        this._initDoneWorkLog();
        this._initManualChange();
        this._initCommentEvent();
        this._initIconRef();
        flatpickr(this.loggedDate.el,{defaultDate: new Date(),dateFormat: 'Y-m-d'});
    }
    async initACs(){
        let element = this.acContainerRef.el;
        element.innerHTML = "";
        if (this.ticketData){
            let payload = {
                'source': 'Extension'
            }
            let params = {
                "id": this.ticketData.id,
                "jwt": this.subEnv.jwt,
                "payload": JSON.stringify(payload)
            }
            let result = (await this.do_invisible_request(`${this.subEnv.serverURL}/management/ticket/ac?${new URLSearchParams(params)}`));
            result = (await result.json())
            if (result.length){
                let string = ""
                for (let ac of result){
                    let _id = uniqueID(ac.id)
                    let parsedData = parseAC(ac.content)
                    string += `
                    <div class="ac-container ${(ac.is_header?'header': '')}">
                        <div class="ac-segment d-flex justify-content-between">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="${ac.id}" id="${_id}" ${ac.checked?'checked': ''}>
                            <label class="form-check-label" for="${_id}">
                                ${parsedData}
                            </label>
                            </div>
                        </div>
                    </div>
                    `
                }
                element.innerHTML = string
                for(let el of element.querySelectorAll('.form-check-input')){
                    el.addEventListener('change', event=>{
                        payload = JSON.parse(params.payload)
                        payload.checked = el.checked
                        params.id = parseInt(el.value)
                        params.payload = JSON.stringify(payload)
                        this.do_invisible_request(`${this.subEnv.serverURL}/management/ac?${new URLSearchParams(params)}`)
                    })
                }
            }
        }
    }
    initContentState(){
        if (this.subEnv.contentState){
            if (this.subEnv.contentState.showLog){
                this.timeLogHeadingRef.el.classList.remove('close')
                this.timeLogHeadingRef.el.classList.add('open')
            } else{
                this.timeLogHeadingRef.el.classList.remove('open')
                this.timeLogHeadingRef.el.classList.add('close')
            }
            if (this.subEnv.contentState.showAC){
                this.acHeadingRef.el.classList.remove('close')
                this.acHeadingRef.el.classList.add('open')
            } else{
                this.acHeadingRef.el.classList.remove('open')
                this.acHeadingRef.el.classList.add('close')
            }
        } else{
            this.subEnv.contentState = {
                showLog: true,
                showAC: false
            }
            this.trigger_up('set-env', this.subEnv)
        }
    }
    initContentEvent(){
        let self = this;
        this.timeLogHeadingRef.el.children[0].addEventListener('click', ()=>{
            self.subEnv.contentState.showLog = !self.subEnv.contentState.showLog;
            self.initContentState();
            if (self.subEnv.contentState.showLog){
                self.renderTicketData(true);
            }
            self.trigger_up('set-env', self.subEnv)
        })
        this.acHeadingRef.el.children[0].addEventListener('click', ()=>{
            self.subEnv.contentState.showAC = !self.subEnv.contentState.showAC;
            self.initContentState();
            if (self.subEnv.contentState.showAC){
                self.initACs();
            }
            self.trigger_up('set-env', self.subEnv)
        })
    }
    renderContent(){
        if (this.subEnv.contentState.showLog){
            this.renderTicketData(true);
        } 
        if (this.subEnv.contentState.showAC) {
            this.initACs();
        }
        if (this.ticketData){
            this.ticketData.displayName = this._getDisplayName(this.ticketData);
            this.searchRef.el.value = this.ticketData.displayName;
            let params = JSON.stringify({
                "except": this.ticketData.id,
                "limit": 6,
                "source": "Extension"
            }), self = this;
            this.do_invisible_request(`${this.subEnv.serverURL}/management/ticket/my-active?jwt=${this.subEnv.jwt}&payload=${params}`).then((response) => {
                response.json().then(result => {
                    self.relatedActiveTickets = result;
                    self.renderRelatedActiveData()
                })
            });
        }
    }
    mounted() {
        let res = super.mounted();
        this.initContentState();
        this.initContentEvent();
        this._initSearchBar();
        this.initEvent();
        this.renderContent();
        return res;
    }
    template = `<div class="main-action-page show">
        <div class="navigator">
        </div>
        <div class="ticket search-bar">
            <div class="input-group d-flex justify-content-between">
                <input type="text" class="form-control" placeholder="Search Ticket" l-ref="search-bar-ticket"/>
                <div class="ticket-navigation">
                    <div class="d-flex justify-content-between"> 
                        <span l-ref="open-ticket"><i class="fa-solid fa-square-arrow-up-right"></i></span>
                        <span l-ref="reload-ticket"><i class="fa-solid fa-arrow-rotate-right"></i></span>
                    </div>  
                </div>
            </div>
            <div class="search-bar-result" l-ref="search-bar-result">
            </div>
        </div>
        <div l-ref="time-log-heading" class="ticket time-log open">
            <div class="heading d-flex justify-content-between">
                <span>Time Management</span>
                <b><i class="fas fa-angle-double-down open"></i><i class="fas fa-angle-double-left close"></i></b>
            </div>
            <div class="space-segment">
                <div class="ticket-content d-flex justify-content-between align-items-center p-1">
                    <div><i class="fa-solid fa-arrow-right"></i> <b l-ref="assignee-ref"></b></div>
                    <div class="d-flex align-items-center"><span style="margin-right:5px" l-ref="type-ref"></span> <b l-ref="status-ref"></b></div>
                    <div><b>Point: </b><span l-ref="point-ref">Unset</span></div>
                </div>
                <div class="duration d-flex justify-content-between align-items-center">
                    <div class="total-duration">
                        <p><span class="avt"><img src="./static/sigma.png"/></span> <span l-ref="my-total-duration">0m</span></p> /
                        <small l-ref="total-duration">0m</small>
                    </div>
                    <div class="active-duration">
                        <span l-ref="active-duration-icon" class="avt"><i class="fa-solid fa-stopwatch"></i></span> <span l-ref="active-duration">0m</span>
                    </div>
                </div>
                <div class="comment">
                    <textarea rows="1" type="text" class="form-control" placeholder="Comment to log step/ log work" l-ref="comment-for-ticket"></textarea>
                </div>
                <div class="time-action d-flex justify-content-between align-items-center">
                    <div class="manual-log d-flex">
                        <input type="text" class="form-control" placeholder="Text log" l-ref="manual-log-text"/>
                        <label for="start-date-selection" class="start-date-label"><i class="fa-regular fa-calendar"></i></label>
                        <input id="start-date-selection" type="text" class="form-control start-date" l-ref="start-date">
                    </div>
                    <div class="action-group d-flex justify-content-between">
                        <div>
                            <div class="action add" l-ref="action-add">
                                <i class="fa-solid fa-circle-play"></i>
                            </div>
                        </div>
                        <div>
                            <div class="action pause" l-ref="action-pause">
                                <i class="fa-solid fa-circle-pause"></i>
                            </div>
                        </div>
                        <div>
                            <div class="action stop" l-ref="action-stop">
                                <i class="fa-solid fa-circle-stop"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="ticket-active">
            <div class="active-item-group" l-ref="related-active">
            </div>
        </div>
        <div l-ref="ac-heading" class="acceptance-criteria close">
            <div  class="heading d-flex justify-content-between">
                <span>Acceptance Criteria</span>
                <b><i class="fas fa-angle-double-down open"></i><i class="fas fa-angle-double-left close"></i></b>
            </div>
            <div class="space-segment">
                <div l-ref="ac-content" class="ac-content">
                    
                </div>
            </div>
        </div>
    </div>`
}