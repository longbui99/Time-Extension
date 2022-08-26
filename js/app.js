import {Main} from "./main.js"
import {Login} from "./login.js"
import { loadEnvironment, mount, Component} from "./base.js"
import { BaseDialog } from "./dialog/dialog.js";
import * as chrome from "./background/chrome.js"
export class App extends Component {
  serverActionRef = this.useRef('server-open')
  serverLogoutRef = this.useRef('server-logout')
  processMainRef = this.useRef('process-page')
  loadingBannerRef = this.useRef('loading-banner')
  loggedNameRef = this.useRef('logged-name')
  errorRef = this.useRef('error')

  custom_events = {
    'authentication': this.onAuthentication,
    'loading': this.onLoading
  }
  constructor() {
    super(...arguments);
    this.subEnv = {};
    this.load = {};
    this.env.syncChannel(['authentication', 'issueData', 'searchData']);
  }
  mountServerAction() {
    let self = this;
    this.serverActionRef.el.addEventListener('click', event => {
      window.open(self.env.serverURL, '_blank');
    })
    this.serverLogoutRef.el.addEventListener('click', event => {
      self.processMainRef.innerHTML = "";
      self.onAuthentication(self.env.raw, false);
    })
  }
  scrollEvent(){
    window.addEventListener('scroll', event=>{
      localStorage.setItem("localScrollStorage", window.pageYOffset);
    })
  }
  initGeneralEvent(){
    let self = this;
    this.scrollEvent();
    window.addEventListener('keydown', event=>{
      if (window.event.altKey && window.event.ctrlKey && window.event.shiftKey){
          self.pinRef.el.click();
      }
      event.stopImmediatePropagation();
    })
  }
  async
  mountingComponent() {
    let self = this;
    this.component = null;
    if (this.env?.authenticated) {
      this.component = new Main(this);
      this.mountServerAction();
      this.el.classList.add('logged');
      this.loggedNameRef.el.innerText=  this.env.loggedName || '';
    }
    else {
      this.component = new Login(this, {});
      this.el.classList.remove('logged');
    }
    // if (this.mode === "pinned"){
    //   this.pinRef.el.remove();
    // }
    this.component.mount(this.processMainRef.el)
    
    // this.pinRef.el.addEventListener("click", async event => {
    //   chrome.injectFile({subEnv: self.subEnv});
    // })
    this.initGeneralEvent();
  }
  loadUI() {
    this.mountingComponent()
  }
  mounted() {
    let res = super.mounted();
    this.loadUI()
    return res
  }
  async onAuthentication(data, authenticated = true) {
    if (data.jwt) {
      data['authenticated'] = authenticated;
      await this.env.syncAll(data);
      await this.env.reload();
      this.processMainRef.el.innerHTML = '';
      this.loadUI();
    }
  }
  onLoading(display=true){
    this.loadingBannerRef.el.style.display = (display?"inline-block": "none");
  }
  onError(data){
    if (data.error){
      this.errorRef.el.innerHTML = data.error
      this.errorRef.el.style.display = 'inline-block';
    }
    else{
      this.errorRef.el.style.display = 'none';
    }
  }
  onSessionError(){
    // this.onAuthentication(this.payload,   false);
  }
  async onIssueChanged(issueData){
    if (chrome.storage){
      let data = (await chrome.storage.local.get(["timeLogStorage"]))?.timeLogStorage
      data.issueData = issueData;
      chrome.storage.local.set({'timeLogStorage': data})
      this.flushDataToExtension({issueUpdate: data.issueData});
    } else {
      let data = JSON.parse(localStorage.getItem(storage) || "{}");
      data.issueData = issueData;
      localStorage.setItem(storage, JSON.stringify(data));
    }
  }
  onRelativeUpdated(relatives){
    if (this.subEnv.extensionID){
      this.flushDataToExtension({'relativeUpdate': relatives})
    }
  }
  checkListChanged(payload){
    this.flushDataToExtension({checkGroup: payload});
  }
  flushDataToExtension(data){
    chrome.runtime.sendMessage(data);
  }
  issueUpdate(issueData){
    if (this.subEnv.authenticated){
      issueData.broardcast = true;
      this.component.issueData = issueData;
      this.component.renderContent();
      this.component.issueData.broardcast = false;
    }
  }
  relativeActiveUpdate(relativeActives){
    if (this.subEnv.authenticated){
      this.component.issueData.broardcast = true;
      this.component.relatedActiveIssues = relativeActives;
      this.component.fetchRelativeActive();
      this.component.issueData.broardcast = false;
    }
  }
  searchedUpdate(searchData){
    if (this.subEnv.authenticated) {
      this.component.searchData = searchData;
    }
  }
  checkListUpdated(payload){
    if (this.subEnv.authenticated){
      this.component.insertCheckGroup(payload)
    }
  }
  componentReady(){
    let lastScrollY = parseInt(localStorage.getItem('localScrollStorage')) || 0;
    if (lastScrollY){
      window.scrollTo(0, lastScrollY)
    }
  }
  onLoadStart(data){
    this.load[data] = false
  }
  onLoadDone(data){
    this.load[data] = true
    for (let key in this.load){
      if (!this.load[key]){
        return;
      }
    }
    this.componentReady()
  }
  template = `
  <lbwt>
    <div class="main-page">
        <div l-ref="loading-banner" class="loading-layer"><div class="loader"></div></div>
        <div class="title">
            <div class="title-group">
              <div class="title-description">
                <div class="content" >
                    <button l-ref="server-open" class="server-open">
                      <span class="tm-icon-svg">
                        <svg class="tm-svg-inline--fa" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="clock" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512zM232 256C232 264 236 271.5 242.7 275.1L338.7 339.1C349.7 347.3 364.6 344.3 371.1 333.3C379.3 322.3 376.3 307.4 365.3 300L280 243.2V120C280 106.7 269.3 96 255.1 96C242.7 96 231.1 106.7 231.1 120L232 256z"></path></svg>
                      </span> <span>LB/WT</span>
                    </button>
                    <p style="color: black;font-size:10px;margin-left: 5px;">
                      Powered by  <a style="margin-left:2px" href="https://www.drakebui.ml" target="_blank" tabindex="-1"> Long Bui</a>
                    </p>
                </div>
              </div>
            </div>
            <button class="extend-tool" l-ref="server-logout">
                <span l-ref="logged-name" class="logged-name"></span>
                <span class="tm-icon-svg">
                  <svg class="tm-svg-inline--fa" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="power-off" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M288 256C288 273.7 273.7 288 256 288C238.3 288 224 273.7 224 256V32C224 14.33 238.3 0 256 0C273.7 0 288 14.33 288 32V256zM80 256C80 353.2 158.8 432 256 432C353.2 432 432 353.2 432 256C432 201.6 407.3 152.9 368.5 120.6C354.9 109.3 353 89.13 364.3 75.54C375.6 61.95 395.8 60.1 409.4 71.4C462.2 115.4 496 181.8 496 255.1C496 388.5 388.5 496 256 496C123.5 496 16 388.5 16 255.1C16 181.8 49.75 115.4 102.6 71.4C116.2 60.1 136.4 61.95 147.7 75.54C158.1 89.13 157.1 109.3 143.5 120.6C104.7 152.9 80 201.6 80 256z"></path></svg>
                </span>
            </button>
        </div>
        <div class="error-layer"><div class="error" l-ref="error"></div></div>
        <div class="process-page" l-ref="process-page">
        </div>
    </div>
  </lbwt>`
}


loadEnvironment().then(() => mount(App, document.body))
