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
                    <span class="ticket-key">
                        ${this._getDisplayName(record, 20)}
                    </span>
                    <span class="duration">
                        ${secondToString(record.my_total_duration)}
                    </span>
                </div>`
        }
        this.relatedActiveRef.el.innerHTML = template;
        let elements = this.relatedActiveRef.el.querySelectorAll('.push-relative-ticket')
        let self = this;
        for (let index = 0; index < elements.length; index++){
            elements[index].addEventListener('click', event=>{
                self.ticketData = self.relatedActiveTickets[index];
                self.storeAndRenderTicket(true)
            })
        }
    }
    async renderTicketData(refresh = false) {
        if (this.currentInterval) {
            clearInterval(this.currentInterval)
        }
        let except_id = []
        if (this.ticketData) {
            if (refresh) {
                try {
                    this.trigger_up('loading', true);
                    let response = (await fetch(`${this.subEnv.serverURL}/management/ticket/get/${this.ticketData.id}?jwt=${this.subEnv.jwt}`));
                    let result = (await response.json());
                    for (let key of Object.keys(result)){this.ticketData[key] = result[key];}
                    this.ticketData.displayName = this._getDisplayName(this.ticketData);
                }
                catch (error){
                    throw error
                } finally{
                    this.trigger_up('loading', false);
                }
            }
            let record = this.ticketData;
            this.searchRef.el.value = this.ticketData.displayName;
            this.totalDurationRef.el.innerText = secondToString(record.total_duration);
            this.myTotalDurationRef.el.innerText = secondToString(record.my_total_duration);
            this.activeDurationRef.el.innerText = secondToString(record.active_duration);
            if (record.active_duration > 0){
                this.ticketData.timeStatus = "pause";   
            }
            if (record.last_start) {
                let pivotTime = new Date(record.last_start).getTime() - new Date().getTimezoneOffset() * 60000;
                this.currentInterval = setInterval(() => {
                    this.activeDurationRef.el.innerText = secondToString(parseInt(record.active_duration + (new Date().getTime() - pivotTime) / 1000));
                }, 500)
                this.ticketData.timeStatus = "active";
            }
            except_id.push(this.ticketData.id)
        }
        let params = JSON.stringify({
            "except": except_id,
            "limit": 4,
            "source": "Extension"
        }), self = this;
        fetch(`${this.subEnv.serverURL}/management/ticket/my-active?jwt=${this.subEnv.jwt}&payload=${params}`).then((response)=>{
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
        this.ticketData = this.loadedData[index];
        this.searchResultRef.el.style.display = 'none';
        this.storeAndRenderTicket()
    }
    loadSearchedTickets(data) {
        let element = this.searchResultRef.el, record = {}, self = this;
        this.searchResultRef.el.innerHTML = '';
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
        try {
            this.trigger_up('loading', true);
            let result = (await fetch(`${this.subEnv.serverURL}/management/ticket/search/${text}?limitRecord=${11}&jwt=${this.subEnv.jwt}`));
            this.loadedData = (await result.json());
            this.loadSearchedTickets(this.loadedData);
        }
        catch (error){
            throw error
        } finally{
            this.trigger_up('loading', false);
        }
    }
    _initSearchBar() {
        let self = this;
        this.searchRef.el.addEventListener('change', (event) => {
            if (this.searchRef.el.value.length > 0) {
                self._searchTicket(this.searchRef.el.value)
            }
        })
    }
    async _pauseWorkLog() {
        let params = {
            "id": this.ticketData.id,
            "jwt": this.subEnv.jwt,
            "payload": JSON.stringify({
                'description': this.commentRef.el.value,
                'source': 'Extension'
            })
        }
        try {
            this.trigger_up('loading', true);
            let result = (await fetch(`${this.subEnv.serverURL}/management/ticket/work-log/pause?${new URLSearchParams(params)}`));
            this.renderTicketData(true);
        }
        catch (error){
            throw error
        } finally{
            this.trigger_up('loading', false);
        }
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
        try {
            this.trigger_up('loading', true);
            let result = (await fetch(`${this.subEnv.serverURL}/management/ticket/work-log/add?${new URLSearchParams(params)}`));
            this.renderTicketData(true);
        }
        catch (error){
            throw error
        } finally{
            this.trigger_up('loading', false);
        }
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

        try {
            this.trigger_up('loading', true);
            if (triggerServer){
                this.ticketData.timeStatus = false;
                (await fetch(`${this.subEnv.serverURL}/management/ticket/work-log/done?${new URLSearchParams(params)}`));
            }
            else{
                (await fetch(`${this.subEnv.serverURL}/management/ticket/work-log/manual?${new URLSearchParams(params)}`));
                this.manualLogref.el.value = '';
            }
            this.renderTicketData(true)
        }
        catch (error){
            throw error
        } finally{
            this.trigger_up('loading', false);
        }
    }
    _initDoneWorkLog() {
        let self = this;
        this.actionStopRef.el.addEventListener('click', (event) => {
            self._doneWorkLog()
        })
    }
    _initManualChange(){
        let self = this;
        this.manualLogref.el.addEventListener('change', event => {
            if (!['pause', 'active'].includes(self.ticketData.timeStatus)) {
                self.ticketData.timeStatus = "pause";
            }
            self.renderTicketData(false)
        })
    }
    initEvent() {
        this._initSearchBar();
        this._initPause();
        this._initAddWorkLog();
        this._initDoneWorkLog();
        this._initManualChange();
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
            <div class="input-group">
                <input type="text" class="form-control" placeholder="Search Ticket" l-ref="search-bar-ticket"/>
            </div>
            <div class="search-bar-result" l-ref="search-bar-result">
            </div>
        </div>
        <div class="ticket time-log">
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
                <input type="text" class="form-control" placeholder="Comment to log step/ log work" l-ref="comment-for-ticket"/>
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
