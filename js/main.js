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
    timeLogSectionRef = this.useRef('time-log-section')
    acSectionRef = this.useRef('tm-ac-section')

    constructor() {
        super(...arguments);
        this.ticketData = this.subEnv.ticketData || null;
        this.searchData = this.subEnv.searchData || null;
        this.secondToString = parseSecondToString(this.subEnv.resource?.hrs_per_day || 8, this.subEnv.resource?.days_per_week || 5)
        this.loadID = uniqueID();
        this.trigger_up("load_start", this.loadID)
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
                        <span class="tm-icon" tabindex="${1100+i}">
                            <span class="tm-icon-svg"><svg class="svg-inline--fa fa-map-pin" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="map-pin" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M320 144C320 223.5 255.5 288 176 288C96.47 288 32 223.5 32 144C32 64.47 96.47 0 176 0C255.5 0 320 64.47 320 144zM192 64C192 55.16 184.8 48 176 48C122.1 48 80 90.98 80 144C80 152.8 87.16 160 96 160C104.8 160 112 152.8 112 144C112 108.7 140.7 80 176 80C184.8 80 192 72.84 192 64zM144 480V317.1C154.4 319 165.1 319.1 176 319.1C186.9 319.1 197.6 319 208 317.1V480C208 497.7 193.7 512 176 512C158.3 512 144 497.7 144 480z"></path></svg></span>
                        </span>
                    </div>
                    <span class="ticket-key" title="${this._getDisplayName(record, 40)}">
                        ${this._getDisplayName(record, 40)}
                    </span>
                    <span class="duration">
                        ${this.secondToString(record.active_duration)}
                    </span>
                </div>`
            i++;
        }   
        this.relatedActiveRef.el.innerHTML = template;
        let elements = this.relatedActiveRef.el.querySelectorAll('.push-relative-ticket')
        let self = this;
        let progressLog = []
        for (let index = 0; index < elements.length; index++) {
            elements[index].addEventListener('click', event => {
                if (self.ticketData) self._pauseWorkLog(this.ticketData.id, false);
                self.ticketData = self.relatedActiveTickets[index];
                self.storeAndRenderTicket(true)
            })
            if (self.relatedActiveTickets[index].last_start){
                progressLog.push({el:elements[index].parentNode.querySelector('.duration'), active_duration: self.relatedActiveTickets[index].active_duration})
            }
        }
        if (progressLog){
            if (this.relatedCurrentInterval){
                clearInterval(this.relatedCurrentInterval)
            }
            let pivotTime = new Date().getTime();
            this.relatedCurrentInterval = setInterval(() => {
                for (let progress of progressLog){
                    progress.el.innerText =this.secondToString(parseInt(progress.active_duration + (new Date().getTime() - pivotTime) / 1000));
                }
            }, 500)
        }

    }
    async fetchTicketFromServer(){
        let response = (await this.do_request('GET', `${this.subEnv.serverURL}/management/ticket/fetch/${this.ticketData.id}?jwt=${this.subEnv.jwt}`));
        this.renderContent()
    }
    async actionExportToOriginalServer(){
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
            "payload": payload
        }
        await this.do_invisible_request('POST', `${this.subEnv.serverURL}/management/ticket/export?`, params);
    }
    openTicketNaviagor(event){
        if (window.event.ctrlKey && window.event.altKey && this.ticketData) {
            this.actionExportToOriginalServer()
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
            if (refresh && !this.ticketData.broardcast) {
                let response = (await this.do_request('GET', `${this.subEnv.serverURL}/management/ticket/get/${this.ticketData.id}?jwt=${this.subEnv.jwt}`));
                let result = (await response.json());
                for (let key of Object.keys(result)) { this.ticketData[key] = result[key]; }
            }
            let record = this.ticketData;
            this.totalDurationRef.el.innerText =this.secondToString(record.total_duration);
            this.myTotalDurationRef.el.innerText =this.secondToString(record.my_total_duration);
            this.activeDurationRef.el.innerText =this.secondToString(record.active_duration);
            this.pointRef.el.innerText = record.point;
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
    async storeAndRenderTicket(refresh = false) {
        await this.renderContent()
        this.trigger_up('ticket-changed', this.ticketData)
    }
    async chooseTicket(index) {
        // if (this.ticketData) this._pauseWorkLog(this.ticketData.id, false);
        this.ticketData = this.searchData[index];
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
        let result = (await this.do_request('GET', `${this.subEnv.serverURL}/management/ticket/search/${text}?limitRecord=${11}&jwt=${this.subEnv.jwt}`));
        this.searchData = (await result.json());
        this.loadSearchedTickets(this.searchData);
        this.trigger_up('search-change', this.searchData)
    }
    _initSearchBar() {
        let self = this;
        this.searchRef.el.addEventListener('change', (event) => {
            this.searchResultRef.el.innerHTML = '';
            if (this.searchRef.el.value.length > 0) {
                self._searchTicket(this.searchRef.el.value)
            }
        })
        this.searchRef.el.addEventListener('click', event=>{
            if (self.searchData){
                self.searchResultRef.el.innerHTML = '';
                self.loadSearchedTickets(self.searchData);
                event.stopImmediatePropagation();
            }
        })
    }
    async _pauseWorkLog(id = false, refresh = true) {
        let params = {
            "id": id || this.ticketData.id,
            "jwt": this.subEnv.jwt,
            "payload": {
                'description': this.commentRef.el.value,
                'source': 'Extension'
            }
        }
        let result = (await this.do_request('POST', `${this.subEnv.serverURL}/management/ticket/work-log/pause`, params));
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
            "payload": {
                'source': 'Extension'
            }
        }
        let result = (await this.do_request('POST', `${this.subEnv.serverURL}/management/ticket/work-log/add`, params));
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
            "payload": payload
        }

        if (triggerServer) {
            this.ticketData.timeStatus = false;
            (await this.do_request('POST', `${this.subEnv.serverURL}/management/ticket/work-log/done`, params));
        }
        else {
            (await this.do_request('POST', `${this.subEnv.serverURL}/management/ticket/work-log/manual`, params));
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
                    "payload": payload
                }
                await self.do_request('POST', `${self.subEnv.serverURL}/management/ticket/work-log/cancel`, params);
                self.renderTicketData(true);
            }
        })
    }
    makeACComponent(_id, ac, content){
        return `<div class="ac-container checklistID="${ac.id}" ${(ac.is_header?'header': '')} ${(ac.initial?'initial': '')}" sequence=${ac.sequence} header=${ac.is_header}>
            <div class="ac-segment justify-content-between">
            ${(ac.initial?'': `<span class="drag-object"><span class="tm-icon-svg"><svg class="svg-inline--fa fa-sort drag-icon" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="sort" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M27.66 224h264.7c24.6 0 36.89-29.78 19.54-47.12l-132.3-136.8c-5.406-5.406-12.47-8.107-19.53-8.107c-7.055 0-14.09 2.701-19.45 8.107L8.119 176.9C-9.229 194.2 3.055 224 27.66 224zM292.3 288H27.66c-24.6 0-36.89 29.77-19.54 47.12l132.5 136.8C145.9 477.3 152.1 480 160 480c7.053 0 14.12-2.703 19.53-8.109l132.3-136.8C329.2 317.8 316.9 288 292.3 288z"></path></svg></span>
            </span>`)}
            <div class="tm-form-check">
                <input class="tm-form-check-input" type="checkbox" value="${ac.id}" id="${_id}" ${ac.checked?'checked': ''}>
                <p class="tm-form-check-label" contenteditable="true">${content}</p>
                <span class="original-value" style="display:none">${content}</span>
                </div>
            </div>
        </div>`
    }
    insertCheckGroup(payload){
        let newAC = ""
        if (!payload.params.id){
            newAC = new DOMParser().parseFromString(this.makeACComponent('', payload.params, ''), 'text/html').body.firstChild;
            this.initEditACEvent(newAC, payload.params)
        } else{
            newAC = this.acContainerRef.el.querySelector(`[checklistID="${payload.params.id}"`);
        }
        if (payload.after){
            let element = this.acContainerRef.el.querySelector(`[sequence="${payload.after}"`);
            if (element){
                this.acContainerRef.el.insertBefore(newAC, element);
                embeddedDone = true
            }
        }
        else if (payload.previous){
            let element = this.acContainerRef.el.querySelector(`[sequence="${payload.previous}"`);
            if (element){
                this.acContainerRef.el.insertBefore(newAC, element.nextElementSibling);
                embeddedDone = true
            }
        }
    }
    checkListChanged(params, previousID, afterID){
        let data = {
            'params': params,
            'previous': previousID,
            'after': afterID
        }
        this.trigger_up('checklist-changed', params)
    }
    async pushAC(el, params, parent, force=false){
        if (force || parent.getAttribute('force') === 'true' || (el.innerText !== "" && el.innerHTML.trim() !== el.nextElementSibling.innerHTML.trim())){
            let payload = {};
            let element = parent.querySelector('.tm-form-check-label');
            payload.checked = element.previousElementSibling.checked || false;
            payload.name = el.innerHTML;
            payload.is_header = parent.getAttribute('header') == "true";
            payload.sequence = parseInt(parent.previousElementSibling?.getAttribute("sequence")) || 0;
            payload.float_sequence = 1;
            payload.ticket_id = this.ticketData.id;
            params.id = parseInt(element.previousElementSibling.value) || 0
            params.payload = payload
            let res = (await this.do_invisible_request('POST', `${this.subEnv.serverURL}/management/ac`, params));
            let result = (await res.json());
            element.previousElementSibling.value = result;
            parent.classList.remove("unsaved");
            el.nextElementSibling.innerHTML = el.innerHTML.trim();
            parent.setAttribute('force', 'false')
        }
        this.checkListChanged(params, parent.previousElementSibling?.getAttribute('sequence'), parent.nextElementSibling?.getAttribute('sequence'))
    }
    initEditACEvent(element, params){
        let self = this;
        let baseParent = element
        while (!baseParent.classList.contains('ac-container')) baseParent = baseParent.parentNode;
        function resetSequence(){
            for (let index = 0; index < baseParent.parentNode.childNodes.length; index++){
                baseParent.parentNode.childNodes[index].setAttribute("sequence", index)
            }
        }
        element.previousElementSibling.addEventListener('change', event=>{
            self.pushAC(element, params, baseParent, true)
        })
        element.addEventListener('click', (event) => {
            if (element != window.selectedElement 
                && (element.innerText !== "" && element.innerHTML.trim() !== element.nextElementSibling.innerHTML.trim())
                ){
                let clickedElement = self.acContainerRef.el.querySelector('.editing');
                clickedElement?.classList.remove('editing');
                element.classList.add('editing');
                if (window.selectedElement){
                    let basePushElement = window.selectedElement;
                    while (!basePushElement.classList.contains('ac-container')) basePushElement = basePushElement.parentNode;
                    self.pushAC(window.selectedElement, params, basePushElement)
                }
                window.selectedElement = element;
            }
            event.stopPropagation();
        })
        element.addEventListener('keydown', (event) => {
            if ((event.keyCode === 8 && window.event.ctrlKey) && !baseParent.classList.contains('initial')) {
                (baseParent.previousElementSibling || baseParent.nextElementSibling).querySelector('.tm-form-check-label').focus();
                let el = (baseParent.previousElementSibling || baseParent.nextElementSibling).querySelector('.tm-form-check-label')
                el.focus();
                window.selectedElement = el;
                baseParent.remove();
                if (parseInt(element.previousElementSibling.value)){
                    self.do_invisible_request('POST', `${self.subEnv.serverURL}/management/ac/delete`, {acID:parseInt(element.previousElementSibling.value), jwt: self.subEnv.jwt})
                }
            }
            else if (event.keyCode === 13 && !window.event.shiftKey) {
                element.classList.remove('editing');
                let data = {
                    'is_header': (baseParent.getAttribute('header') === "true")
                }
                let fromInitial =  baseParent.classList.contains('initial');
                let sequencePivot = (fromInitial?baseParent.previousElementSibling: baseParent)
                data.sequence = (parseInt(sequencePivot?.getAttribute("sequence")) + 1) || 0;
                let newAC = new DOMParser().parseFromString(self.makeACComponent('', data, ''), 'text/html').body.firstChild;
                newAC.classList.add("unsaved");
                let content = ""
                if (fromInitial) {
                    baseParent.parentNode.insertBefore(newAC, baseParent);
                    content = element.innerHTML;
                    setTimeout(() => {
                        element.innerHTML = ""
                    }, 1)
                    element.focus();
                    element.classList.add('editing');
                    let HandlingElement = baseParent.previousElementSibling;
                    self.pushAC(element, params, HandlingElement);
                    resetSequence();
                } else {
                    if (!window.event.ctrlKey){
                        baseParent.parentNode.insertBefore(newAC, baseParent.nextSibling);
                        newAC.querySelector('.tm-form-check-label').focus();
                        newAC.querySelector('.tm-form-check-label').classList.add('editing');
                        window.selectedElement = newAC.querySelector('.tm-form-check-label');
                    }
                    self.pushAC(element, params, baseParent);
                    resetSequence();
                }
                if (!window.event.ctrlKey || baseParent.classList.contains('initial')){
                    self.initEditACEvent(newAC.querySelector('.tm-form-check-label'), params);
                    setTimeout(() => {
                        newAC.querySelector('.tm-form-check-label').innerHTML = content;
                        while (newAC.nextElementSibling){
                            newAC = newAC.nextElementSibling;
                            newAC.setAttribute("sequence", parseInt(newAC.getAttribute("sequence")) + 1)
                        }
                    }, 1)
                }
                event.stopPropagation();
            }
            else if (window.event.ctrlKey && event.keyCode === 191){
                let isHeader = !(baseParent.getAttribute("header", false) == "true");
                baseParent.setAttribute("header", isHeader);
                baseParent.classList.remove('header');
                baseParent.setAttribute('force', 'true');
                isHeader && baseParent.classList.add(isHeader?'header':'base');
            }
            else if (event.keyCode === 38){
                let el = baseParent.previousElementSibling?.querySelector('.tm-form-check-label');
                window.selectedElement = el;
                if (!parseInt(element.previousElementSibling.value)){
                    self.pushAC(element, params, baseParent);
                }
                if (el){
                    el.click();
                    el.focus();
                }
                event.stopPropagation();
            }
            else if (event.keyCode === 40){
                let el = baseParent.nextElementSibling?.querySelector('.tm-form-check-label');
                window.selectedElement = el;
                if (!parseInt(element.previousElementSibling.value)){
                    self.pushAC(element, params, baseParent);
                }
                if (el){
                    el.click();
                    el.focus();
                }
                event.stopPropagation();
            }
            // else if (event.ctrlKey && [66,73,85].includes(event.keyCode)){
            //     element.innerHTML = element.innerHTML.replaceAll('')
            // }
            event.stopImmediatePropagation();
        })
        element.addEventListener('keyup', (event) => {
            if ((element.innerHTML.trim() != element.nextElementSibling.innerHTML.trim()) || baseParent.getAttribute('force') === 'true'){
                baseParent.classList.add("unsaved");
            } else {
                baseParent.classList.remove("unsaved");
            }
            event.stopImmediatePropagation();
        })
        function recursiveRemoveAttribute(element, isRoot=false){
            if (!isRoot){
                let isBold = element.style.fontWeight;
                if (isBold == "bold" || parseInt(isBold) > 600){
                    let p = document.createElement('p');
                    p.innerHTML = element.innerHTML;
                    element.parentNode.insertBefore(p, element);
                    element.remove()
                    element = p;
                }
                while(element.attributes?.length > 0) {
                    element.removeAttribute(element.attributes[0].name)
                };
            }
            for (let node of element.children){
                recursiveRemoveAttribute(node)
            }
        }
        element.addEventListener("paste", event=>{
            setTimeout(() => {
                recursiveRemoveAttribute(element, true)
            }, 1);
            event.stopImmediatePropagation();
        })
    }
    
    initDragEvent(parentElement, element, event){
        let acElement = element, self = this;
        while (!acElement.classList.contains('ac-container')) acElement = acElement.parentNode;
        let clonedElement = acElement.cloneNode();
        // Get boundary
        var rect = acElement.getBoundingClientRect();
        // Set drag element object
        acElement.classList.add('dragging')
        // acElement.style.top = rect.top.toFixed(2) + "px";
        // acElement.style.left = rect.left.toFixed(2) + "px";
        // acElement.style.height = rect.height.toFixed(2) + "px";
        acElement.style.maxWidth = rect.width + "px";
        // Clone the object and set it to base parent
        clonedElement.style.height = (rect.height - 12) + "px";
        clonedElement.style.width = (rect.width - 12) + "px";
        clonedElement.classList.add('clone-drag')
        parentElement.insertBefore(clonedElement, acElement);
        // Move element with the position of mouse
        let mouseX = event.pageX, mouseY = event.pageY;
        // Fetch all visible tags
        function getBoundary(element, res){
            let boundary = element.getBoundingClientRect();
            res.center = boundary.top + boundary.height/2;
            res.top = boundary.top;
            res.bottom = boundary.bottom;
            res.height = boundary.height;
        }
        let clientTags = [], currentPosition = -1, index = 0;
        for (let el of acElement.parentNode.childNodes){
            if (el != acElement){
                let res = {el: el}
                clientTags.push(res);
                getBoundary(el, res);
                if (el == clonedElement){
                    currentPosition = index;
                }
            } 
            index++
        }
        clientTags.pop();
        let startScroll = window.scrollY;
        function swap(i, j){
            let res1 = clientTags[i], res2 = clientTags[j], t = res1.el;
            if (i > j){
                res2.el.parentNode.insertBefore(res1.el, res2.el);
            } else {
                res2.el.parentNode.insertBefore(res1.el, res2.el.nextElementSibling);
            }
            let padding = res2.height - res1.height;
            clientTags[j].top += padding;
            clientTags[j].center += padding;
            clientTags[j].bottom += padding;
            clientTags[i].el = res2.el;
            clientTags[j].el = t;
        }
        let areaRect = {
            'top': clientTags[0].top,
            'bottom': clientTags[clientTags.length-1].bottom,
        }
        function mouseMoveEvent(event){
            if (event.pageY >= areaRect.top){
                let position = (rect.top + event.pageY - mouseY)
                acElement.style.top = (position + startScroll - window.scrollY).toFixed(2) + "px";
                acElement.style.left = (rect.left + event.pageX - mouseX).toFixed(2) + "px";
                if (currentPosition > 0 && position < clientTags[currentPosition-1].center && (position < clientTags[currentPosition].center)){
                    swap(currentPosition, currentPosition-1)
                    currentPosition--;
                } else 
                if (currentPosition < clientTags.length-1 && position > clientTags[currentPosition+1].top && position > clientTags[currentPosition].top){
                    swap(currentPosition, currentPosition+1)
                    currentPosition++;
                }
            }
        }
        function mouseUpEvent(event){
            window.removeEventListener("mousemove", mouseMoveEvent);
            window.removeEventListener("mouseup", mouseUpEvent);
            acElement.classList.remove("dragging");
            acElement.parentNode.insertBefore(acElement, clientTags[currentPosition].el);
            clientTags[currentPosition].el.remove();
            clientTags[currentPosition].el = acElement;
            let params = {
                "id": self.ticketData.id,
                "jwt": self.subEnv.jwt
            }
            let payload = {};
            payload.sequence = parseInt(clientTags[currentPosition-1]?.el.getAttribute("sequence")) || -1;
            payload.float_sequence = 1;
            params.id = parseInt(acElement.querySelector('.tm-form-check-input').value) || 0
            params.payload = payload
            self.do_invisible_request('POST', `${self.subEnv.serverURL}/management/ac?`, params);
            for (let index = 0; index < clientTags.length; index++){
                clientTags[index].el.setAttribute("sequence", index)
            }
        }
        window.addEventListener("mousemove", mouseMoveEvent)
        window.addEventListener("mouseup", mouseUpEvent)
    }
    initDragEventRoot(element, event){
        element.removeEventListener("mousedown", self.initDragEventRoot);
        this.initDragEvent(element, event.srcElement, event)
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
                "payload": payload
            }
            let result = [];
            if (this.ticketData.broardcast && this.ticketData.acs){
                result = this.ticketData.acs;
            } else{
                if (this.subEnv.contentState.showLog){
                    result = (await this.do_invisible_request('GET', `${this.subEnv.serverURL}/management/ticket/ac?${new URLSearchParams(params)}`));
                } else{
                    result = (await this.do_request('GET', `${this.subEnv.serverURL}/management/ticket/ac?${new URLSearchParams(params)}`));
                }
                result = (await result.json())
                this.ticketData.acs = result;
            }
            let default_data = {
                'id':false,
                'content': '',
                'is_header': true,
                'initial': true,
            }
            result.push(default_data)
            let string = ""
            for (let ac of result){
                let _id = uniqueID(ac.id)
                let parsedData = parseAC(ac.content)
                string += this.makeACComponent(_id, ac, parsedData)
            }
            element.innerHTML = string
            for (let ac of element.querySelectorAll('.tm-form-check-label')){
                this.initEditACEvent(ac, params)
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
            element.addEventListener('mousedown', event=>{
                if (event.srcElement.classList.contains('drag-object') || 
                event.srcElement.classList.contains('drag-icon') || 
                event.srcElement.nodeName === "path"){
                    this.initDragEventRoot(element, event)
                    event.stopImmediatePropagation();
                }
            })
        }
    }
    contentStateChange(element, contentElement, type, customClass=""){
        if (type){
            element.classList.add('tm-active');
            contentElement.classList.add('open');
            contentElement.classList.remove('tm-close');
            element.parentElement.classList.add(customClass);
        } else{
            element.classList.remove('tm-active')
            contentElement.classList.remove('open')
            contentElement.classList.add('tm-close')
        }
    }
    initContentState(){
        if (this.subEnv.contentState){
            this.contentStateChange(this.timeLogHeadingRef.el, this.timeLogSectionRef.el, this.subEnv.contentState.showLog, "left");
            this.contentStateChange(this.acHeadingRef.el, this.acSectionRef.el, this.subEnv.contentState.showAC, "right");
        } else{
            this.subEnv.contentState = {
                showLog: true,
                showAC: false
            }
            this.trigger_up('set-env', this.subEnv)
        }
    }
    triggerContentType(class1, class2){
        this.initContentState();
        this.renderContent();
        this.trigger_up('set-env', this.subEnv)
        let parent = this.timeLogHeadingRef.el.parentElement;
        parent.classList.remove(class1);
        parent.classList.add(class2);
    }
    initContentEvent(){
        let self = this;
        this.timeLogHeadingRef.el.addEventListener('click', ()=>{
            if (!self.subEnv.contentState.showLog){
                self.subEnv.contentState.showAC = false;
                self.subEnv.contentState.showLog = true;
                self.triggerContentType('right', 'left')
            }
        })
        this.acHeadingRef.el.addEventListener('click', ()=>{
            if (!self.subEnv.contentState.showAC){
                self.subEnv.contentState.showLog = false;
                self.subEnv.contentState.showAC = true;
                self.triggerContentType('left', 'right')
            }
        })
    }
    async fetchRelativeActive(){
        this.relatedActiveRef.el.parentNode.style.display = "none";
        if (!this.ticketData?.broardcast){
            let params = JSON.stringify({
                "except": this.ticketData.id,
                "limit": 6,
                "source": "Extension"
            }), self = this;
            let response = (await this.do_invisible_request('GET', `${this.subEnv.serverURL}/management/ticket/my-active?jwt=${this.subEnv.jwt}&payload=${params}`))
            let result = (await response.json());
            this.relatedActiveTickets = result;
            setTimeout(()=>{
                self.trigger_up('relative-updated', result);
            },200)
        }
        this.renderRelatedActiveData()
        if (this.relatedActiveTickets.length){
            this.relatedActiveRef.el.parentNode.style.display = "block";
        }
    }
    renderOverview(){
        if (this.ticketData){
            this.typeRef.el.innerHTML = `<img src="${this.ticketData.type_url}"/>`;
            this.statusRef.el.innerText = this.ticketData.status || '';
        }
    }
    async renderContent(){
        if (this.ticketData){
            this.ticketData.displayName = this._getDisplayName(this.ticketData);
            this.searchRef.el.value = this.ticketData.displayName;
            this.el.querySelector('.ticket-navigation').style.display = "inline-block";
            this.ticketNavigator();
        } else {
            this.el.querySelector('.ticket-navigation').style.display = "none";
        }
        this.fetchRelativeActive();
        if (this.subEnv.contentState.showLog){
            await this.renderTicketData(true);
        } 
        if (this.subEnv.contentState.showAC) {
            await this.initACs();
        }
        this.renderOverview()
        this.trigger_up("load_done", this.loadID)
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
            if (event.keyCode === 49 && window.event.ctrlKey && window.event.shiftKey){
                self.timeLogHeadingRef.el.click();
                event.stopImmediatePropagation();
            }
            if (event.keyCode === 50 && window.event.ctrlKey && window.event.shiftKey){
                self.acHeadingRef.el.click();
            }
            if (event.keyCode === 69 && window.event.ctrlKey && window.event.shiftKey){
                self.actionExportToOriginalServer();
            }
            if (window.event.ctrlKey && event.keyCode == 13){
                if (self.subEnv.contentState.showLog){
                    self._doneWorkLog();
                }
            }
        })
        window.addEventListener('click', event=>{
            self.searchResultRef.el.innerHTML = ""
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
        <div class="ticket search-bar">
            <div class="input-group justify-content-between">
                <div class="ticket-type">
                    <span l-ref="type-ref"></span>
                </div>
                <input type="text" class="tm-form-control input-s-ticket" placeholder="Search Ticket" l-ref="search-bar-ticket" tabindex="1"/>
                    <div class="ticket-navigation">
                        <div class="navigation-group"> 
                            <div class="ticket-status" l-ref="status-ref"></div>
                            <span l-ref="open-ticket" tabindex="998">
                                <span class="tm-icon-svg">
                                <svg class="tm-svg-inline--fa" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="square-arrow-up-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M384 32H64C28.65 32 0 60.66 0 96v320c0 35.34 28.65 64 64 64h320c35.35 0 64-28.66 64-64V96C448 60.66 419.3 32 384 32zM344 312c0 17.69-14.31 32-32 32s-32-14.31-32-32V245.3l-121.4 121.4C152.4 372.9 144.2 376 136 376s-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L234.8 200H168c-17.69 0-32-14.31-32-32s14.31-32 32-32h144c17.69 0 32 14.31 32 32V312z"></path></svg>                            
                                </span>
                            </span>
                            <span l-ref="reload-ticket" tabindex="999">
                            <span class="tm-icon-svg">
                                <svg class="svg-inline--fa fa-arrow-rotate-right" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-rotate-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M496 48V192c0 17.69-14.31 32-32 32H320c-17.69 0-32-14.31-32-32s14.31-32 32-32h63.39c-29.97-39.7-77.25-63.78-127.6-63.78C167.7 96.22 96 167.9 96 256s71.69 159.8 159.8 159.8c34.88 0 68.03-11.03 95.88-31.94c14.22-10.53 34.22-7.75 44.81 6.375c10.59 14.16 7.75 34.22-6.375 44.81c-39.03 29.28-85.36 44.86-134.2 44.86C132.5 479.9 32 379.4 32 256s100.5-223.9 223.9-223.9c69.15 0 134 32.47 176.1 86.12V48c0-17.69 14.31-32 32-32S496 30.31 496 48z"></path></svg>                        
                            </span>
                            </span>
                        </div>  
                    </div>
            </div>
            <div class="search-bar-result" l-ref="search-bar-result">
            </div>
        </div>
        <div class="ticket-active">
            <div class="active-item-group" l-ref="related-active">
            </div>
        </div>
        <div class="tm-tab">
            <div class="tm-tab-background">
            </div>
            <div class="tm-tab-action" l-ref="time-log-heading" >
                Clock
            </div>
            <div class="tm-tab-action" l-ref="ac-heading" >
                Checklist
            </div>
        </div>
        <div class="tm-tab-content">
            <div class="ticket time-log" l-ref="time-log-section">
                <div class="space-segment">
                    <div class="ticket-content p-1" style="display:none">
                        <div>
                        <span class="tm-icon-svg">
                            <svg class="svg-inline--fa fa-arrow-right" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M438.6 278.6l-160 160C272.4 444.9 264.2 448 256 448s-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L338.8 288H32C14.33 288 .0016 273.7 .0016 256S14.33 224 32 224h306.8l-105.4-105.4c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160C451.1 245.9 451.1 266.1 438.6 278.6z"></path></svg>
                        </span>
                        <b l-ref="assignee-ref"></b></div>
                        <div><b>Point: </b><span l-ref="point-ref">Unset</span></div>
                    </div>
                    <div class="duration">
                        <div class="total-duration">
                            <p><span class="avt"><img class="avt-img" src="data:image/png;base64,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"></span> <span l-ref="my-total-duration">0m</span></p> /
                            <small l-ref="total-duration">0m</small>
                        </div>
                        <div class="active-duration">
                            <span l-ref="active-duration-icon" class="avt">
                                <span class="tm-icon-svg"><svg class="svg-inline--fa fa-stopwatch" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="stopwatch" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M272 0C289.7 0 304 14.33 304 32C304 49.67 289.7 64 272 64H256V98.45C293.5 104.2 327.7 120 355.7 143L377.4 121.4C389.9 108.9 410.1 108.9 422.6 121.4C435.1 133.9 435.1 154.1 422.6 166.6L398.5 190.8C419.7 223.3 432 262.2 432 304C432 418.9 338.9 512 224 512C109.1 512 16 418.9 16 304C16 200 92.32 113.8 192 98.45V64H176C158.3 64 144 49.67 144 32C144 14.33 158.3 0 176 0L272 0zM248 192C248 178.7 237.3 168 224 168C210.7 168 200 178.7 200 192V320C200 333.3 210.7 344 224 344C237.3 344 248 333.3 248 320V192z"></path></svg>
                            </span>
                            </span> <span l-ref="active-duration">0m</span>
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
                            <div>
                                <div class="action add" l-ref="action-add" tabindex="1003">
                                    <span class="tm-icon-svg">
                                        <svg class="svg-inline--fa fa-circle-play" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle-play" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM176 168V344C176 352.7 180.7 360.7 188.3 364.9C195.8 369.2 205.1 369 212.5 364.5L356.5 276.5C363.6 272.1 368 264.4 368 256C368 247.6 363.6 239.9 356.5 235.5L212.5 147.5C205.1 142.1 195.8 142.8 188.3 147.1C180.7 151.3 176 159.3 176 168V168z"></path></svg>
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div class="action pause" l-ref="action-pause" tabindex="1004">
                                <span class="tm-icon-svg">
                                    <svg class="svg-inline--fa fa-circle-pause" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle-pause" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM224 191.1v128C224 337.7 209.7 352 192 352S160 337.7 160 320V191.1C160 174.3 174.3 160 191.1 160S224 174.3 224 191.1zM352 191.1v128C352 337.7 337.7 352 320 352S288 337.7 288 320V191.1C288 174.3 302.3 160 319.1 160S352 174.3 352 191.1z"></path></svg>                            
                                </span>
                                </div>
                            </div>
                            <div>
                                <div class="action stop" l-ref="action-stop" tabindex="1005">
                                <span class="tm-icon-svg">
                                    <svg class="svg-inline--fa fa-circle-stop" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle-stop" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M256 0C114.6 0 0 114.6 0 256c0 141.4 114.6 256 256 256s256-114.6 256-256C512 114.6 397.4 0 256 0zM352 328c0 13.2-10.8 24-24 24h-144C170.8 352 160 341.2 160 328v-144C160 170.8 170.8 160 184 160h144C341.2 160 352 170.8 352 184V328z"></path></svg>                            
                                </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="comment">
                        <textarea rows="1" type="text" class="tm-form-control" placeholder="Comment to log step/ log work" l-ref="comment-for-ticket" tabindex="1002"></textarea>
                    </div>
                </div>
            </div>
            <div class="acceptance-criteria tm-close" l-ref="tm-ac-section">
                <div class="space-segment">
                    <div l-ref="ac-content" class="ac-content">
                        
                    </div>
                </div>
            </div>
        </div>
    </div>`
}