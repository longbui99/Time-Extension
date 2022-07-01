
class Home extends Component {
  serverActionRef = this.useRef('server-open')
  serverLogoutRef = this.useRef('server-logout')
  processMainRef = this.useRef('process-page')
  loadingBannerRef = this.useRef('loading-banner')
  loggedNameRef = this.useRef('logged-name')
  errorRef = this.useRef('error')
  pinRef = this.useRef("action-pin-ref")

  custom_events = {
    'set-env': this.setEnv,
    'authentication': this.onAuthentication,
    'authentication-failed': this.onAuthenticationFailed,
    'loading': this.onLoading,
    'error': this.onError,
    'session_errors': this.onSessionError,
    'ticket-changed': this.onTicketChanged,
    'relative-updated': this.onRelativeUpdated,
    'load_start': this.onLoadStart,
    'load_done': this.onLoadDone,
    'search-change': this.searchChanged,
    'checklist-changed': this.checkListChanged,
  }
  constructor() {
    super(...arguments);
    this.payload = {};
    // this.onAuthentication = this.onAuthentication.bind(this);
    this.subEnv = {};
    this.load = {}
  }
  async loadAuthentication() {
    if (Object.keys(this.subEnv).length === 0){
      let self = this;
      let result = {};
      if (chrome.storage){
        result = (await chrome.storage.local.get(["timeLogStorage"]))?.timeLogStorage || {};
      } else {
        result = JSON.parse(localStorage.getItem("timeLogStorage"))
      }
      self.payload = result;
      self.subEnv = this.payload;
    } else{
      this.payload = this.subEnv
    }
  }
  mountServerAction() {
    let self = this;
    this.serverActionRef.el.addEventListener('click', event => {
      window.open(self.payload.serverURL, '_blank');
    })
    this.serverLogoutRef.el.addEventListener('click', event => {
      self.processMainRef.innerHTML = "";
      self.onAuthentication(self.payload, false);
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
    if (this.payload?.authenticated) {
      this.component = new Main(this);
      this.mountServerAction();
      this.el.classList.add('logged');
      this.loggedNameRef.el.innerText=  this.payload.loggedName || '';
    }
    else {
      this.component = new Login(this, {});
      this.el.classList.remove('logged');
    }
    if (this.mode === "pinned"){
      this.pinRef.el.remove();
    }
    this.component.mount(this.processMainRef.el)
    
    this.pinRef.el.addEventListener("click", async event => {
      injectFile({subEnv: self.subEnv});
    })
    this.initGeneralEvent();
  }
  loadUI() {
    let self = this;
    this.loadAuthentication().then(() => {
      self.mountingComponent()
    })
  }
  mounted() {
    let res = super.mounted();
    this.loadUI()
    return res
  }
  setEnv(data){
    if (chrome.storage){
      chrome.storage.local.set({"timeLogStorage": data});
    } else {
      localStorage.setItem("timeLogStorage", JSON.stringify(data))
    }
    // this.flushDataToExtension(data);
  }
  async onAuthentication(data, authenticated = true) {
    if (data.jwt) {
      data['authenticated'] = authenticated;
      if (chrome.storage){
        chrome.storage.local.set({'timeLogStorage': data})
      } else {
        localStorage.setItem(storage, JSON.stringify(data))
      }
      this.processMainRef.el.innerHTML = '';
      // this.flushDataToExtension(data);
      this.subEnv = {};
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
    this.onAuthentication(this.payload,   false);
  }
  async onTicketChanged(ticketData){
    if (chrome.storage){
      let data = (await chrome.storage.local.get(["timeLogStorage"]))?.timeLogStorage
      data.ticketData = ticketData;
      chrome.storage.local.set({'timeLogStorage': data})
      this.flushDataToExtension({ticketUpdate: data.ticketData});
    } else {
      let data = JSON.parse(localStorage.getItem(storage) || "{}");
      data.ticketData = ticketData;
      localStorage.setItem(storage, JSON.stringify(data));
    }
  }
  async searchChanged(searchData){
    if (chrome.storage){
      let data = (await chrome.storage.local.get(["timeLogStorage"]))?.timeLogStorage
      data.searchData = searchData;
      chrome.storage.local.set({'timeLogStorage': data})
      this.flushDataToExtension({searchData: data.searchData});
    } else {
      let data = JSON.parse(localStorage.getItem(storage) || "{}");
      data.searchData = searchData;
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
  ticketUpdate(ticketData){
    if (this.subEnv.authenticated){
      ticketData.broardcast = true;
      this.component.ticketData = ticketData;
      this.component.renderContent();
      this.component.ticketData.broardcast = false;
    }
  }
  relativeActiveUpdate(relativeActives){
    if (this.subEnv.authenticated){
      this.component.ticketData.broardcast = true;
      this.component.relatedActiveTickets = relativeActives;
      this.component.fetchRelativeActive();
      this.component.ticketData.broardcast = false;
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
  <div class="main-page">
      <div l-ref="loading-banner" class="loading-layer"><div class="loader"></div></div>
      <div class="title">
          <div class="title-group">
            <div class="title-description">
              <div class="content" >
                  <span  l-ref="server-open">
                    <span class="tm-icon-svg">
                      <svg class="tm-svg-inline--fa" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="clock" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512zM232 256C232 264 236 271.5 242.7 275.1L338.7 339.1C349.7 347.3 364.6 344.3 371.1 333.3C379.3 322.3 376.3 307.4 365.3 300L280 243.2V120C280 106.7 269.3 96 255.1 96C242.7 96 231.1 106.7 231.1 120L232 256z"></path></svg>
                    </span> <span>LB/WT</span>
                  </span>
                  <p style="color: black;font-size:10px;margin-left: 5px;">
                    Powered by  <a style="margin-left:2px" href="https://www.drakebui.ml" target="_blank" tabindex="-1"> Long Bui</a>
                  </p>
              </div>
            </div>
          </div>
          <div class="pin-action clas" l-ref="action-pin-ref" >
            <span class="tm-icon-svg">
              <svg class="tm-svg-inline--fa" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="map-pin" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M320 144C320 223.5 255.5 288 176 288C96.47 288 32 223.5 32 144C32 64.47 96.47 0 176 0C255.5 0 320 64.47 320 144zM192 64C192 55.16 184.8 48 176 48C122.1 48 80 90.98 80 144C80 152.8 87.16 160 96 160C104.8 160 112 152.8 112 144C112 108.7 140.7 80 176 80C184.8 80 192 72.84 192 64zM144 480V317.1C154.4 319 165.1 319.1 176 319.1C186.9 319.1 197.6 319 208 317.1V480C208 497.7 193.7 512 176 512C158.3 512 144 497.7 144 480z"></path></svg>
            </span>
          </div>
          <div class="extend-tool" l-ref="server-logout">
              <span l-ref="logged-name" class="logged-name"></span>
              <span class="tm-icon-svg">
                <svg class="tm-svg-inline--fa" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="power-off" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M288 256C288 273.7 273.7 288 256 288C238.3 288 224 273.7 224 256V32C224 14.33 238.3 0 256 0C273.7 0 288 14.33 288 32V256zM80 256C80 353.2 158.8 432 256 432C353.2 432 432 353.2 432 256C432 201.6 407.3 152.9 368.5 120.6C354.9 109.3 353 89.13 364.3 75.54C375.6 61.95 395.8 60.1 409.4 71.4C462.2 115.4 496 181.8 496 255.1C496 388.5 388.5 496 256 496C123.5 496 16 388.5 16 255.1C16 181.8 49.75 115.4 102.6 71.4C116.2 60.1 136.4 61.95 147.7 75.54C158.1 89.13 157.1 109.3 143.5 120.6C104.7 152.9 80 201.6 80 256z"></path></svg>
              </span>
          </div>
      </div>
      <div class="error-layer"><div class="error" l-ref="error"></div></div>
      <div class="process-page" l-ref="process-page">
      </div>
  </div>`
}
