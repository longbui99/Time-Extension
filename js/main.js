class Main extends Component {

    searchRef = this.useRef('search-bar-ticket')
    searchResultRef = this.useRef('search-bar-result')
    totalDurationRef = this.useRef('total-duration')
    myTotalDurationRef = this.useRef('my-total-duration')
    activeDurationRef = this.useRef('active-duration')
    commentRef = this.useRef('comment-for-ticket')
    manualLogref = this.useRef('manual-log-text')
    actionAddRef = this.useRef('action-add')
    actionPauseRef = this.useRef('action-pause')
    actionStopRef = this.useRef('action-stop')
    relatedActiveRef = this.useRef("related-active")
    pointRef = this.useRef("point-ref")
    statusRef = this.useRef("status-ref")
    assingneeRef = this.useRef("assignee-ref")
    openTicketref = this.useRef("open-ticket")
    reloadTicketRef = this.useRef("reload-ticket")

    constructor() {
        super(...arguments);
        this.ticketData = this.subEnv.ticketData || null;
        this.loadedData = [];
    }
    _getDisplayName(record, length= 40) {
        return `${record.key}: ${(record.name.length > length) ? record.name.substring(0, length) + "..." : record.name}`;
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
    renderRelatedActiveData(){
        let template = ""
        for( let record of this.relatedActiveTickets){
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
                        ${secondToString(record.my_total_duration + record.active_duration)}
                    </span>
                </div>`
        }
        this.relatedActiveRef.el.innerHTML = template;
        let elements = this.relatedActiveRef.el.querySelectorAll('.push-relative-ticket')
        let self = this;
        for (let index = 0; index < elements.length; index++){
            elements[index].addEventListener('click', event=>{
                self._pauseWorkLog(this.ticketData.id, false);
                self.ticketData = self.relatedActiveTickets[index];
                self.storeAndRenderTicket(true)
            })
        }
    }
    ticketNavigator(){
        let self = this;
        this.openTicketref.el.addEventListener('click', (event)=>{
            window.open(self.ticketData.url, '_blank')
        })
        this.reloadTicketRef.el.addEventListener('click', (event)=>{
            self.do_request(`${this.subEnv.serverURL}/management/ticket/fetch/${this.ticketData.id}?jwt=${this.subEnv.jwt}`).then(()=>{
                self.renderTicketData(true);
            });
        })
    }
    async renderTicketData(refresh = false) {
        if (this.currentInterval) {
            clearInterval(this.currentInterval)
        }
        let except_id = []
        if (this.ticketData) {
            if (refresh) {
                let response = (await this.do_request(`${this.subEnv.serverURL}/management/ticket/get/${this.ticketData.id}?jwt=${this.subEnv.jwt}`));
                let result = (await response.json());
                for (let key of Object.keys(result)){this.ticketData[key] = result[key];}
                this.ticketData.displayName = this._getDisplayName(this.ticketData);
            }
            let record = this.ticketData;
            this.searchRef.el.value = this.ticketData.displayName;
            this.totalDurationRef.el.innerText = secondToString(record.total_duration);
            this.myTotalDurationRef.el.innerText = secondToString(record.my_total_duration);
            this.activeDurationRef.el.innerText = secondToString(record.active_duration);
            this.pointRef.el.innerText = record.point;
            this.statusRef.el.innerText = record.status || '';
            this.assingneeRef.el.innerText = record.assignee || '';
            this.commentRef.el.innerText = record.comment || '';
            this.commentRef.el.setAttribute("rows", ((record.comment !== "" && record.comment) ? record.comment.split("\n").length : 1));
            if (record.active_duration > 0){
                this.ticketData.timeStatus = "pause";   
            }
            if (record.last_start) {
                let pivotTime = new Date().getTime();
                this.currentInterval = setInterval(() => {
                    this.activeDurationRef.el.innerText = secondToString(parseInt(record.active_duration + (new Date().getTime() - pivotTime) / 1000));
                }, 500)
                this.ticketData.timeStatus = "active";
            }
            except_id.push(this.ticketData.id)
            this.el.querySelector('.ticket-navigation').style.display="inline-block";
            this.ticketNavigator();
        }
        else{
            this.el.querySelector('.ticket-navigation').style.display="none";
        }
        let params = JSON.stringify({
            "except": except_id,
            "limit": 6,
            "source": "Extension"
        }), self = this;
        this.do_request(`${this.subEnv.serverURL}/management/ticket/my-active?jwt=${this.subEnv.jwt}&payload=${params}`).then((response)=>{
            response.json().then(result=>{
                self.relatedActiveTickets = result;
                self.renderRelatedActiveData()
            })
        });
        this.renderTimeActions()
    }
    storeAndRenderTicket(refresh=false){
        this.renderTicketData(refresh)
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
            p.innerHTML = record.displayName;
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
    async _pauseWorkLog(id=false, refresh=true) {
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

    async _doneWorkLog() {
        let payload = {
            'source': 'Extension',
            'description': this.commentRef.el.value,
        }
        let triggerServer = true;
        if (this.manualLogref.el.value.length > 0){
            triggerServer = false;
            payload['time'] = this.manualLogref.el.value;
        }
        let params = {
            "id": this.ticketData.id,
            "jwt": this.subEnv.jwt,
            "payload": JSON.stringify(payload)
        }

        if (triggerServer){
            this.ticketData.timeStatus = false;
            (await this.do_request(`${this.subEnv.serverURL}/management/ticket/work-log/done?${new URLSearchParams(params)}`));
        }
        else{
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
    _initManualChange(){
        let self = this;
        this.manualLogref.el.addEventListener('keyup', event => {
            (10 != event.keyCode && 13 != event.keyCode) || !event.ctrlKey || self._doneWorkLog();
            if (!['pause', 'active'].includes(self.ticketData.timeStatus)) {
                self.ticketData.timeStatus = "pause";
            }
            self.renderTicketData(false)
        })
    }
    resetRows(){

    }
    _initCommentEvent(){
        let self = this;
        this.commentRef.el.addEventListener("keyup", (event)=>{
            if (event.keyCode == 13){
                self.commentRef.el.setAttribute("rows", parseInt(self.commentRef.el.getAttribute("rows")) + 1)
            }
            else{
                let value = self.commentRef.el.value;
                self.commentRef.el.setAttribute("rows", ((value !== "") ? value.split("\n").length : 1));
                // self.ticketData.comment = value;
                // localStorage.setItem(storage, JSON.stringify(self.ticketData))
            }
        })
    }
    initEvent() {
        this._initSearchBar();
        this._initPause();
        this._initAddWorkLog();
        this._initDoneWorkLog();
        this._initManualChange();
        this._initCommentEvent();
    }
    mounted() {
        let res = super.mounted();
        this.initEvent();
        this.renderTicketData(true);
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
        <div class="ticket time-log">
            <div class="ticket-content d-flex justify-content-between align-items-center p-1">
                <div><i class="fa-solid fa-arrow-right"></i> <b l-ref="assignee-ref"></b></div>
                <div><b l-ref="status-ref"></b></div>
                <div><b>Point: </b><span l-ref="point-ref">Unset</span></div>
            </div>
            <div class="duration d-flex justify-content-between align-items-center">
                <div class="total-duration">
                    <p><span class="avt"><img src="./static/sigma.png"/></span> <span l-ref="my-total-duration">0m</span></p> /
                    <small l-ref="total-duration">0m</small>
                </div>
                <div class="active-duration">
                    <span class="avt"><i class="fa-solid fa-stopwatch"></i></span> <span l-ref="active-duration">0m</span>
                </div>
            </div>
            <div class="comment">
                <textarea rows="1" type="text" class="form-control" placeholder="Comment to log step/ log work" l-ref="comment-for-ticket"></textarea>
            </div>
            <div class="time-action d-flex justify-content-between align-items-center">
                <div class="manual-log">
                    <input type="text" class="form-control" placeholder="Text log" l-ref="manual-log-text"/>
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
        <div class="ticket-active">
            <div class="heading">
                Related Active
            </div>
            <div class="active-item-group" l-ref="related-active">
            </div>
        </div>
    </div>`
}
