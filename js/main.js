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
        this.openTicketNaviagor = this.openTicketNaviagor.bind(this);
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
        let i = 0;
        for (let record of this.relatedActiveTickets) {
            template += `
                <div class="active-item">
                    <div class="icon-group push-relative-ticket">
                        <span class="icon" tabindex="${1100+i}">
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
            i++;
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
    async fetchTicketFromServer(){
        let response = (await this.do_request(`${this.subEnv.serverURL}/management/ticket/fetch/${this.ticketData.id}?jwt=${this.subEnv.jwt}`));
        this.renderContent()
    }
    async openTicketNaviagor(event){
        if (window.event.ctrlKey && window.event.altKey && this.ticketData) {
            this.ticketData.timeStatus = null;
            let payload = {
                'source': 'Extension',
                'mode': {
                    'worklog': this.subEnv.contentState.showLog,
                    'ac': this.subEnv.contentState.showAC
                }
            }
            let params = {
                "id": this.ticketData.id,
                "jwt": this.subEnv.jwt,
                "payload": JSON.stringify(payload)
            }
            await this.do_invisible_request(`${this.subEnv.serverURL}/management/ticket/export?${new URLSearchParams(params)}`);
        } 
        else {
            window.open(this.ticketData.url, '_blank')
        }
    }
    ticketNavigator() {
        let self = this;
        this.openTicketref.el.addEventListener('click', this.openTicketNaviagor)
        this.reloadTicketRef.el.addEventListener('click', (event) => {
            self.fetchTicketFromServer();
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
            p.setAttribute('tabindex', 10+i)
            p.addEventListener('click', () => {
                self.chooseTicket(i);
            })
            p.addEventListener('keydown', event=>{
                if (event.keyCode === 38){
                    let el = p.previousElementSibling;
                    if (el){
                        el.focus();
                    }
                    event.stopPropagation();
                }
                if (event.keyCode === 40){
                    let el = p.nextElementSibling;
                    if (el){
                        el.focus();
                    }
                    event.stopPropagation();
                }
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
            (10 != event.keyCode && 13 != event.keyCode) || !event.ctrlKey || self._doneWorkLog() || event.stopPropagation();
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
                event.stopPropagation()
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
            if (window.event.ctrlKey && window.event.altKey) {
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
    makeACComponent(_id, ac, content){
        return `<div class="ac-container ${(ac.is_header?'header': '')} ${(ac.initial?'initial': '')}" sequence=${ac.sequence} header=${ac.is_header}>
            <div class="ac-segment d-flex justify-content-between">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${ac.id}" id="${_id}" ${ac.checked?'checked': ''}>
                <label class="form-check-label" contenteditable="true">${content}</label>
                </div>
            </div>
        </div>`
    }
    async pushAC(el, params, parent){
        if (el.innerText !== ""){
            let payload = {};
            let element = parent.querySelector('.form-check-label');
            payload.checked = element.checked || false;
            payload.name = el.innerHTML;
            payload.is_header = parent.getAttribute('header') == "true";
            payload.sequence = parent.previousElementSibling?.getAttribute('sequence');
            if (payload.sequence === "undefined") payload.sequence = 0;
            payload.ticket_id = this.ticketData.id;
            params.id = parseInt(element.previousElementSibling.value) || 0
            params.payload = JSON.stringify(payload)
            let res = (await this.do_invisible_request(`${this.subEnv.serverURL}/management/ac?${new URLSearchParams(params)}`));
            let result = (await res.json());
            element.previousElementSibling.value = result;
        }
    }
    initEditACEvent(element, params){
        function placeCaretAtEnd(el) {
            el.focus();
            if (typeof window.getSelection != "undefined"
                    && typeof document.createRange != "undefined") {
                var range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (typeof document.body.createTextRange != "undefined") {
                var textRange = document.body.createTextRange();
                textRange.moveToElementText(el);
                textRange.collapse(false);
                textRange.select();
            }
        }
        let self = this;
        let baseParent = element
        while (!baseParent.classList.contains('ac-container')) baseParent = baseParent.parentNode;
        element.previousElementSibling.addEventListener('change', event=>{
            self.pushAC(element, params, baseParent)
        })
        element.addEventListener('click', (event) => {
            window.selectedElement = element;
            self.acContainerRef.el.querySelector('.editing')?.classList.remove('editing')
            element.classList.add('editing')
            event.stopPropagation();
        })
        element.addEventListener('keydown', (event) => {
            if (event.keyCode === 8 && element.innerText.trim() === "" && window.event.ctrlKey && !baseParent.classList.contains('header')) {
                (baseParent.previousElementSibling || baseParent.nextElementSibling).querySelector('.form-check-label').focus();
                baseParent.remove();
                if (parseInt(element.previousElementSibling.value)){
                    self.do_invisible_request(`${self.subEnv.serverURL}/management/ac/delete/${parseInt(element.previousElementSibling.value)}?jwt=${self.subEnv.jwt}`)
                }
            }
            if (event.keyCode === 13 && !window.event.shiftKey) {
                element.classList.remove('editing')
                let newAC = new DOMParser().parseFromString(self.makeACComponent('', {'sequence': baseParent.previousElementSibling.getAttribute('sequence')}, ''), 'text/html').body.firstChild;
                let content = ""
                if (baseParent.classList.contains('initial')) {
                    if (!window.event.ctrlKey){
                        baseParent.parentNode.insertBefore(newAC, baseParent);
                        content = element.innerHTML;
                    }
                    setTimeout(() => {
                        element.innerHTML = ""
                    }, 1)
                    element.focus();
                    let HandlingElement = baseParent.previousElementSibling;
                    self.pushAC(element, params, HandlingElement)
                } else {
                    if (!window.event.ctrlKey){
                        baseParent.parentNode.insertBefore(newAC, baseParent.nextSibling);
                        newAC.querySelector('.form-check-label').focus();
                    }
                    self.pushAC(element, params, baseParent)
                }
                if (!window.event.ctrlKey){
                    self.initEditACEvent(newAC.querySelector('.form-check-label'), params);
                    setTimeout(() => {
                        newAC.querySelector('.form-check-label').innerHTML = content
                    }, 1)
                }
                event.stopPropagation();
            }
            if (window.event.ctrlKey && event.keyCode === 191){
                let isHeader = !(baseParent.getAttribute("header", false) == "true");
                baseParent.setAttribute("header", isHeader);
                baseParent.classList.remove('header');
                isHeader && baseParent.classList.add(isHeader?'header':'');
            }
            if (event.keyCode === 38){
                let el = baseParent.previousElementSibling?.querySelector('.form-check-label');
                if (el){
                    el.click();
                    placeCaretAtEnd(el);
                }
                event.stopPropagation();
            }
            if (event.keyCode === 40){
                let el = baseParent.nextElementSibling?.querySelector('.form-check-label');
                if (el){
                    el.click();
                    el.focus();
                }
                event.stopPropagation();
            }
        })
    }
    async initACs() {
        let element = this.acContainerRef.el, self = this;
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
            let result = "";
            result = (await this.do_invisible_request(`${this.subEnv.serverURL}/management/ticket/ac?${new URLSearchParams(params)}`));
            let default_data = {
                'id':false,
                'content': '',
                'is_header': true,
                'initial': true,
            }
            result = (await result.json())
            this.acs = result;
            result.push(default_data)
            if (result.length){
                let string = ""
                for (let ac of result){
                    let _id = uniqueID(ac.id)
                    let parsedData = parseAC(ac.content)
                    string += this.makeACComponent(_id, ac, parsedData)
                }
                element.innerHTML = string
                for (let ac of element.querySelectorAll('.form-check-label')){
                    this.initEditACEvent(ac, params)
                }
            }
            window.addEventListener('click', event=>{
                let selectedElement = element.querySelector('.editing')
                if (selectedElement){
                    selectedElement.classList.remove('editing');
                    let baseParent = selectedElement
                    while (!baseParent.classList.contains('ac-container')) baseParent = baseParent.parentNode;
                    self.pushAC(selectedElement, params, baseParent)
                }
            })
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
            this.el.querySelector('.ticket-navigation').style.display = "inline-block";
            this.ticketNavigator();
        } else {
            this.el.querySelector('.ticket-navigation').style.display = "none";
        }
    }
    initEvent() {
        let self = this;
        this._initPause();
        this._initAddWorkLog();
        this._initDoneWorkLog();
        this._initManualChange();
        this._initCommentEvent();
        this._initIconRef();
        flatpickr(this.loggedDate.el,{defaultDate: new Date(),dateFormat: 'Y-m-d'});
        window.addEventListener('keydown', event=>{
            if (event.keyCode === 13){
                document.activeElement.click()               
            }
            if (event.keyCode === 70 && window.event.ctrlKey && window.event.shiftKey){
                self.searchRef.el.click();
                self.searchRef.el.focus();
            }
        })
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
                <input type="text" class="form-control" placeholder="Search Ticket" l-ref="search-bar-ticket" tabindex="1"/>
                <div class="ticket-navigation">
                    <div class="d-flex justify-content-between"> 
                        <span l-ref="open-ticket" tabindex="998"><i class="fa-solid fa-square-arrow-up-right"></i></span>
                        <span l-ref="reload-ticket" tabindex="999"><i class="fa-solid fa-arrow-rotate-right"></i></span>
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
                    <textarea rows="1" type="text" class="form-control" placeholder="Comment to log step/ log work" l-ref="comment-for-ticket" tabindex="1000"></textarea>
                </div>
                <div class="time-action d-flex justify-content-between align-items-center">
                    <div class="manual-log d-flex">
                        <input type="text" class="form-control" placeholder="Text log" l-ref="manual-log-text" tabindex="1001"/>
                        <label for="start-date-selection" class="start-date-label"><i class="fa-regular fa-calendar"></i></label>
                        <input id="start-date-selection" type="text" class="form-control start-date" l-ref="start-date">
                    </div>
                    <div class="action-group d-flex justify-content-between">
                        <div>
                            <div class="action add" l-ref="action-add" tabindex="1002">
                                <i class="fa-solid fa-circle-play"></i>
                            </div>
                        </div>
                        <div>
                            <div class="action pause" l-ref="action-pause" tabindex="1003">
                                <i class="fa-solid fa-circle-pause"></i>
                            </div>
                        </div>
                        <div>
                            <div class="action stop" l-ref="action-stop" tabindex="1004">
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