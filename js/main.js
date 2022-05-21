class Main extends Component {
    template = `<div class="main-action-page show">
        <div class="navigator">
        </div>
        <div class="ticket search-bar">
            <div class="input-group">
                <input type="text" class="form-control" placeholder="Search Ticket" id="search-bar-ticket"/>
            </div>
            <div class="search-bar-result hide" id="search-bar-result">
                <p>NF-126: 3232131</p>
                <p>NF-126: 3333231</p>
                <p>NF-126: 3322123</p>
                <p>NF-126: 4441321</p>
            </div>
        </div>
        <div class="ticket time-log">
            <div class="duration d-flex justify-content-between align-items-center">
                <div class="total-duration">
                    <span class="avt"><img src="./static/sigma.png"/></span> <span id="total-duration">3h 30m</span>
                </div>
                <div class="active-duration">
                    <span class="avt"><i class="fa-solid fa-stopwatch"></i></span> <span id="active-duration">3h 30m</span>
                </div>
            </div>
            <div class="comment">
                <input type="text" class="form-control" placeholder="Comment to log step/ log work" id="comment-for-ticket"/>
            </div>
            <div class="time-action d-flex justify-content-between align-items-center">
                <div class="manual-log">
                    <input type="text" class="form-control" placeholder="Text log" id="manual-log-text"/>
                </div>
                <div class="action-group d-flex justify-content-between">
                    <div class="action add" id="action-add">
                        <i class="fa-solid fa-circle-play"></i>
                    </div>
                    <div class="action pause" id="action-pause">
                        <i class="fa-solid fa-circle-pause"></i>
                    </div>
                    <div class="action stop" id="action-stop">
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
