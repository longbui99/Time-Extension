
import * as util from "../utils/utils.js"
import { mount, Component } from "../base.js"
export class Favorite extends Component {
    favoriteSectionRef = this.useRef('tm-favorite-section')
    favoriteListRef = this.useRef('favorite-list')
    timerMovingRef = this.useRef('timer')
    checklistMovingRef = this.useRef('checklist')
    noneMovingRef = this.useRef('None')
    constructor() {
        super(...arguments);
        this.subscribe('issueData', this.initFavorites.bind(this));
        this.env.favoriteData.movingMode = this.env.favoriteData.movingMode || null;
    }
    renderFavoriteIssues(){
        if (this.favoriteIssues){
            let self = this;
            let tmpl = "";
            this.update('favorite', false);
            for (let index = 0; index < this.favoriteIssues.length; index++){
                if (this.favoriteIssues[index].key === this.env.issueData?.key){
                    this.favoriteIssues.splice(index, 1);
                    this.update('favorite', true);
                    break;
                }
            }
            let groupResult = {};
            for( let element of this.favoriteIssues){
                let key = `${element['project']}`
                if (groupResult[key]){
                    groupResult[key].push(element)
                } else {
                    groupResult[key] = [element]
                }
            }
            for (let groupKey in groupResult){
                let issues = ""
                for (let record of groupResult[groupKey]){
                    issues += `
                    <div class="favorite-issue">
                        <div class="favorite-issue-start"  data-key=${record.key} style="margin-right: 5px">
                            <button type="button" class="btn btn-thin btn-primary">
                                <svg class="svg-inline--fa fa-play" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="play" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" data-fa-i2svg=""><path fill="currentColor" d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z"></path></svg>                           
                            </button>
                        </div>
                        <button type="button" class="favorite-issue-key" data-key=${record.key}>
                            ${record.key}
                        </button>
                        <div class="favorite-issue-name">
                            ${record.name}
                        </div>
                        <div class="favorite-issue-action"  data-key=${record.key}>
                            <button type="button" class="btn btn-thin btn-highlight">
                                <svg class="svg-inline--fa fa-star" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="star" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"></path></svg>
                            </button>
                        </div>
                    </div>`
                }
                if (issues.length){
                    let host = groupResult[groupKey][0]['host_image_url']
                    tmpl += `
                    <div class="favorite-group">
                        <div class="favorite-group-title">
                            <span>
                                ${groupKey} 
                            </span>
                            <span>
                                <img src="${host}">
                            </span>
                        </div>\
                        <div class="favorite-segment">
                            ${issues}
                        </div>  
                    </div>
                `
                }
            }
            this.favoriteListRef.el.innerHTML = tmpl;
            let elements = this.favoriteListRef.el.querySelectorAll('.favorite-issue-key');
            function findIssue(issueKey){
                let index = self.favoriteIssues.findIndex(e=> e.key === issueKey)
                if (index !== -1){
                    return self.favoriteIssues[index]
                }
            }
            for (let index=0; index < elements.length; index++){
                elements[index].addEventListener('click', (event)=>{
                    self.env.issueData = findIssue(event.currentTarget.getAttribute('data-key'));
                    self.env.update('issueData', self.env.issueData);
                    if (self.env.favoriteData.movingMode){
                        self.moveToPage()
                    }
                    event.stopPropagation();
                })
            }
            elements = this.favoriteListRef.el.querySelectorAll('.favorite-issue-action');
            for (let index=0; index < elements.length; index++){
                elements[index].addEventListener('click', (event)=>{
                    self.do_invisible_request('POST', `${self.env.serverURL}/management/issue/favorite/delete?jwt=${self.env.jwt}&id=${findIssue(event.currentTarget.getAttribute('data-key')).id}`);
                    elements[index].parentNode.remove();
                    event.stopPropagation();
                })
            }
            elements = this.favoriteListRef.el.querySelectorAll('.favorite-issue-start');
            for (let index=0; index < elements.length; index++){
                elements[index].addEventListener('click', async (event)=>{
                    let data = findIssue(event.currentTarget.getAttribute('data-key'));
                    self.env.update('relativeAdd', data)
                    event.stopPropagation();
                })
            }
        }
    }
    async initFavorites(){
        let response = (await this.do_invisible_request('GET', `${this.env.serverURL}/management/issue/favorite?jwt=${this.env.jwt}`));
        let result = (await response.json());
        this.favoriteIssues = result;
        this.renderFavoriteIssues();
    }
    moveToPage(){
        if (this.env.favoriteData.movingMode === "timer"){
            this.triggerUp('page', "timer")
        } else 
        if (this.env.favoriteData.movingMode === "checklist"){
            this.triggerUp('page', "checklist")
        }
    }
    setMovingChange(){
        if (this.timerMovingRef.el.checked){
            this.env.favoriteData.movingMode = this.timerMovingRef.el.value
        }
        if (this.checklistMovingRef.el.checked){
            this.env.favoriteData.movingMode = this.checklistMovingRef.el.value
        }
        if (this.noneMovingRef.el.checked){
            this.env.favoriteData.movingMode = null;
        }
        this.update('favoriteData', this.env.favoriteData);
    }
    initMovingChange(){
        this.timerMovingRef.el.addEventListener('change', this.setMovingChange.bind(this))
        this.checklistMovingRef.el.addEventListener('change', this.setMovingChange.bind(this))
        this.noneMovingRef.el.addEventListener('change', this.setMovingChange.bind(this))
        if (this.env.favoriteData.movingMode === "timer"){
            this.timerMovingRef.el.click()
        } else 
        if (this.env.favoriteData.movingMode === "checklist"){
            this.checklistMovingRef.el.click()
        } else 
        if (!this.env.favoriteData.movingMode || this.env.favoriteData.movingMode === "null"){
            this.noneMovingRef.el.click()
        }
    }
    mounted() {
        let res = super.mounted();
        this.initMovingChange()
        this.initFavorites()
        return res
    }
    getTemplate() {
        return `
        <div class="favorite-issues" l-ref="tm-favorite-section">
            <div class="favorite-moving">
                Auto Move:
                <div class="favorite-tools">
                    <input name="favorite" type="radio" id="timer" l-ref="timer" value="timer">
                    <label for="timer">Timer</label>
                    <br/>
                    <input name="favorite" type="radio" id="checklist" l-ref="checklist" value="checklist">
                    <label for="checklist">Checklists</label>
                    <br/>  
                    <input name="favorite" type="radio" id="None" l-ref="None" value="null">
                    <label for="None">None</label>
                    <br/>  
                </div>
            </div>
            <div class="space-segment">
                <div class="favorite-content">
                    <div class="favorite-list" l-ref="favorite-list">
                    <div>
                </div>
            </div>
        </div>
    `
    }
}