class Main extends Component {

    searchRef = this.useRef('search-bar-ticket')
    searchResultRef = this.useRef('search-bar-result')
    totalDurationRef = this.useRef('total-duration')
    activedurationRef = this.useRef('active-duration')
    commentRef = this.useRef('comment-for-ticket')
    manualLogref = this.useRef('manual-log-text')
    actionAddRef = this.useRef('action-add')
    actionPauseRef = this.useRef('action-pause')
    actionStopRef = this.useRef('action-stop')

    constructor() {
        super(...arguments);
        this.ticketData = {};
        this.loadedData = [];
    }
    renderTicketData(){

    }
    chooseTicket(index){
        this.ticketData = this.loadedData[index];
        this.searchResultRef.el.style.display='none';
        this.searchRef.el.value = this.ticketData.displayName;
        this.renderTicketData()
    }
    loadSearchedTickets(data) {
        let element = this.searchResultRef.el, record = {}, self=this;
        this.searchResultRef.el.innerHTML = '';
        for (let i = 0; i < data.length; i++) {
            record = data[i];
            let p = document.createElement('p');
            data[i].displayName = `${record.key}: ${(record.name.length > 30) ? record.name.substring(0, 40) + "..." : record.name}`;
            p.innerHTML = record.displayName;
            p.addEventListener('click', () => {
                self.chooseTicket(i);
            })
            element.append(p);
        }
        element.style.display='inline-block';
    }
    async _searchTicket(text) {
        let result = (await fetch(`${this.subEnv.serverURL}/management/ticket/search/${text}?limitRecord=${10}&jwt=${this.subEnv.jwt}`))
        this.loadedData = (await result.json())
        this.loadSearchedTickets(this.loadedData)
    }
    _initSearchBar() {
        let self = this;
        this.searchRef.el.addEventListener('change', (event) => {

            self._searchTicket(this.searchRef.el.value)
            // debounce(()=>{
            //     self._searchTicket(this.searchRef.el.value)
            // })
        })
    }
    initEvent() {
        this._initSearchBar()

    }
    mounted() {
        let res = super.mounted();
        this.initEvent();

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
                    <span class="avt"><img src="./static/sigma.png"/></span> <span l-ref="total-duration">3h 30m</span>
                </div>
                <div class="active-duration">
                    <span class="avt"><i class="fa-solid fa-stopwatch"></i></span> <span l-ref="active-duration">3h 30m</span>
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
                    <div class="action add" l-ref="action-add">
                        <i class="fa-solid fa-circle-play"></i>
                    </div>
                    <div class="action pause" l-ref="action-pause">
                        <i class="fa-solid fa-circle-pause"></i>
                    </div>
                    <div class="action stop" l-ref="action-stop">
                        <i class="fa-solid fa-circle-stop"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="ticket-active">
            <div class="heading">
                Related Active
            </div>
            <div class="active-item-group">
                <div class="active-item">
                    <div class="icon-group">
                        <span class="icon">
                            <i class="fa-solid fa-circle-play"></i>
                        </span>
                    </div>
                    <span class="ticket-key">
                        NF-12
                    </span>
                    <span class="duration">
                        1034s (31m)
                    </span>
                </div>

                <div class="active-item">
                    <div class="icon-group">
                        <span class="icon">
                            <i class="fa-solid fa-circle-play"></i>
                        </span>
                    </div>
                    <span class="ticket-key">
                        SQ-20
                    </span>
                    <span class="duration">
                        1034s (31m)
                    </span>
                </div>
            </div>
        </div>
    </div>
    `
}
