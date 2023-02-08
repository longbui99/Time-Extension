
import * as util from "../utils/utils.js"
import {Component} from "../base.js"
export class SearchBar extends Component {
        
    searchRef = this.useRef('search-bar-issue')
    reloadIssueRef = this.useRef("reload-issue")
    favoriteNavigatorRef = this.useRef('favorite-segment-ref')
    addToFavoriteRef = this.useRef('add-to-favorite-ref')
    removeToFavoriteRef = this.useRef('remove-to-favorite-ref')
    typeRef = this.useRef("type-ref")
    statusRef = this.useRef("status-ref")
    openIssueref = this.useRef("open-issue")
    searchResultRef = this.useRef('search-bar-result')

    constructor() {
        super(...arguments);
        this.subscribe('issueData', this.renderIssueSearch.bind(this));
        this.subscribe('loadIssueData', this.loadIssue.bind(this));
        this.subscribe('favorite', this.favoriteChanged.bind(this));
        this.openIssueNaviagor = this.openIssueNaviagor.bind(this);
    }
    favoriteChanged(isFavorite){
        if (isFavorite){
            this.favoriteNavigatorRef.el.classList.add('favorite');
        } else{
            this.favoriteNavigatorRef.el.classList.remove('favorite');
        }
    }
    async loadIssue(){
        if (!this.env.issueData?.broardcast) {
            let response = (await this.do_invisible_request('GET', `${this.env.serverURL}/management/issue/get/${this.env.issueData.id}?jwt=${this.env.jwt}`));
            let result = (await response.json());
            let values = this.env.issueData;
            this.env.issueData.timeStatus = false;
            for (let key of Object.keys(result)) { values[key] = result[key]; }
            this.update('issueData', this.env.issueData)
        }
    }
    renderIssueSearch(data){
        this.typeRef.el.innerHTML = `<img src="${data.type_url}"/>`;
        this.statusRef.el.innerText = data.status || '';
        this.searchRef.el.value = util._getDisplayName(data);
        this.el.querySelector('.issue-navigation').style.display = "inline-block";
    }
    async chooseIssue(index) {
        this.searchResultRef.el.style.display = 'none';
        this.update('issueData', this.searchData.values[index]);
    }
    async fetchSearchIssue(text){
        let offset = this.searchData?.values?.length || 0;
        let result = (await this.do_request('GET', `${this.env.serverURL}/management/issue/search/${text}?offset=${offset}&jwt=${this.env.jwt}`));
        return (await result.json());
    }
    loadSearchedIssues(data) {
        if (data === null || data === undefined){
            return
        }
        let element = this.searchResultRef.el, record = {}, self = this;
        element.querySelector('.search-more')?.remove()
        for (let i = 0; i < data.length; i++) {
            record = data[i];
            let p = document.createElement('p');
            data[i].displayName = util._getDisplayName(record);
            let statusSpan = document.createElement('em')
            let sprints = (record.sprint && record.sprint.split(' ') || '')
            let sprintText = ((typeof sprints === 'string')? '' : "|" + sprints[sprints.length-1])
            statusSpan.innerHTML = `${util._minifyString(record.status, 13)}<b>${sprintText} </b>`
            let typeImg = document.createElement('img')
            typeImg.setAttribute('src', record.type_url)
            let textSpan = document.createElement('span')
            textSpan.innerText = record.displayName
            p.classList.add(util.fetchSpecialClass(record))
            p.append(typeImg)
            p.append(textSpan)
            p.append(statusSpan)
            p.setAttribute('tabindex', 10+i)
            p.setAttribute('title', data[i].displayName)
            p.addEventListener('click', () => {
                self.chooseIssue(i);
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
                if (event.keyCode === 13){
                    p.click()
                }
            })
            element.append(p);
        }
        if (data.length){
            let p = document.createElement('p');
            p.classList.add('search-more');
            p.innerHTML = "Search More...";
            p.setAttribute('tabindex', 10+this.searchData?.values?.length+1);
            element.append(p);
            p.addEventListener('click', event=>{
                event.stopImmediatePropagation();
                self.fetchSearchIssue(self.searchData.query).then(result=>{
                    self.searchData.values.push(...result);
                    element.innerHTML = '';
                    self.loadSearchedIssues(self.searchData.values);
                    self.env.update('searchData', self.searchData);
                });
            })
            element.style.display = 'inline-block';
        }
    }
    async _searchIssue(text, invisible=false) {
        this.searchData = {}
        this.searchData.query = text;
        this.searchData.values =  (await this.fetchSearchIssue(text));
        if (!invisible){
            this.loadSearchedIssues(this.searchData.values);
        }
        this.update('searchData', this.searchData);
    }
    _initSearchBar() {
        let self = this;
        if (this.env.searchData){
            this.searchData = this.env.searchData;
        }
        this.searchRef.el.addEventListener('change', (event) => {
            self.searchResultRef.el.innerHTML = '';
            self.searchResultRef.el.style.display = 'none';
            if (this.searchRef.el.value.length > 0) {
                self._searchIssue(this.searchRef.el.value)
            }
        })
        this.searchRef.el.addEventListener('click', event=>{
            if (self.searchData){
                self.searchResultRef.el.innerHTML = '';
                self.searchResultRef.el.style.display = 'none';
                self.loadSearchedIssues(self.searchData.values);
                event.stopImmediatePropagation();
            }
        })
        window.addEventListener('click', (e)=>{
            self.searchResultRef.el.style.display = 'none';
        })
    }
    openIssueNaviagor(event){
        if (window.event.ctrlKey && window.event.altKey && this.issueData) {
            this.trigger_up('action-export');
        } 
        else {
            window.open(this.env.issueData.url, '_blank')
        }
    }
    async fetchIssueFromServer(){
        let response = (await this.do_request('GET', `${this.env.serverURL}/management/issue/fetch/${this.env.issueData.id}?jwt=${this.env.jwt}`));
        let data = (await response.json())
        this.update('issueData', data);
    }
    _initNavigator() {
        let self = this;
        if (this.env.issueData){
            this.reloadIssueRef.el.style.visibility = 'visible';
        }
        this.openIssueref.el.addEventListener('click', this.openIssueNaviagor)
        this.reloadIssueRef.el.addEventListener('click', (event) => {
            self.fetchIssueFromServer()
        })
    }
    _initFavorite(){
        let self = this;
        this.addToFavoriteRef.el.addEventListener('click', event=>{
            if (self.env.issueData){
                self.do_request('POST', `${self.env.serverURL}/management/issue/favorite/add?jwt=${self.env.jwt}&id=${self.env.issueData.id}`);
                self.favoriteNavigatorRef.el.classList.add('favorite');
            }
        })
        this.removeToFavoriteRef.el.addEventListener('click', event=>{
            if (self.env.issueData){
                self.do_request('POST', `${self.env.serverURL}/management/issue/favorite/delete?jwt=${self.env.jwt}&id=${self.env.issueData.id}`);
                self.favoriteNavigatorRef.el.classList.remove('favorite');
            }
        })
    }
    renderOverview(){
        if (this.env.issueData){
            this.renderIssueSearch(this.env.issueData);
        }
        let self = this;
        window.addEventListener('keydown', event=>{
            if (event.key === "Escape"){
                self.searchResultRef.el.style.display = 'none';
                self.flatPickr.close();
            }
            if (event.code === 'KeyF' && window.event.ctrlKey && window.event.shiftKey){
                self.searchRef.el.click();
                self.searchRef.el.focus();
            }
        })
    }
    mounted() {
        let res = super.mounted();
        this._initSearchBar();
        this._initNavigator();
        this._initFavorite();
        this.renderOverview();
        return res
    }

    template = `
    <div class="issue search-bar">
        <button type="button" class="reload-issue" l-ref="reload-issue" tabindex="999" title="Reload From The Original Server">
            <span class="tm-icon-svg">
                <svg class="svg-inline--fa fa-arrow-rotate-right" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-rotate-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M496 48V192c0 17.69-14.31 32-32 32H320c-17.69 0-32-14.31-32-32s14.31-32 32-32h63.39c-29.97-39.7-77.25-63.78-127.6-63.78C167.7 96.22 96 167.9 96 256s71.69 159.8 159.8 159.8c34.88 0 68.03-11.03 95.88-31.94c14.22-10.53 34.22-7.75 44.81 6.375c10.59 14.16 7.75 34.22-6.375 44.81c-39.03 29.28-85.36 44.86-134.2 44.86C132.5 479.9 32 379.4 32 256s100.5-223.9 223.9-223.9c69.15 0 134 32.47 176.1 86.12V48c0-17.69 14.31-32 32-32S496 30.31 496 48z"></path></svg>                        
            </span>
        </button>
        <div class="input-group justify-content-between">
            <span class="icon-prepend" tabindex="999" title="Reload From The Original Server">
                <div class="tm-icon-svg button-segment" l-ref="favorite-segment-ref">
                    <div class="button-add-favorite" l-ref="add-to-favorite-ref">
                        <button type="button" class="btn btn-thin btn-secondary">
                            <svg class="svg-inline--fa fa-star" aria-hidden="true" focusable="false" data-prefix="far" data-icon="star" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z"></path></svg>
                        </button>
                    </div>
                    <div class="button-remove-favorite" l-ref="remove-to-favorite-ref">
                        <button type="button" class="btn btn-thin btn-highlight">
                            <svg class="svg-inline--fa fa-star" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="star" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"></path></svg>
                        </button>
                    </div>
                </div>
            </span>
            <div class="issue-type">
                <span l-ref="type-ref"></span>
            </div>
            <input type="text" class="tm-form-control input-s-issue" placeholder="Search Issues" l-ref="search-bar-issue" tabindex="1" title="Ctrl+Shift+F"/>
            <div class="issue-navigation">
                <div class="navigation-group"> 
                    <div class="issue-status" l-ref="status-ref"></div>
                    <button type="button" l-ref="open-issue" tabindex="998" title="Ctrl+Shift+E or Ctrl+Alt+Click: Export To The Original Server">
                        <span class="tm-icon-svg">
                            <svg class="tm-svg-inline--fa" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="square-arrow-up-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M384 32H64C28.65 32 0 60.66 0 96v320c0 35.34 28.65 64 64 64h320c35.35 0 64-28.66 64-64V96C448 60.66 419.3 32 384 32zM344 312c0 17.69-14.31 32-32 32s-32-14.31-32-32V245.3l-121.4 121.4C152.4 372.9 144.2 376 136 376s-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L234.8 200H168c-17.69 0-32-14.31-32-32s14.31-32 32-32h144c17.69 0 32 14.31 32 32V312z"></path></svg>                            
                        </span>
                    </button>
                </div>  
            </div>
        </div>
        <div class="search-bar-result" l-ref="search-bar-result">
        </div>
    </div>
    `
}