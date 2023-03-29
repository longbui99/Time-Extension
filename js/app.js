import { Main } from "./main.js"
import { Login } from "./login.js"
import { loadEnvironment, mount, Component } from "./base.js"
import { ErrorDialog } from "./dialog/errorDialog.js";
import * as chrome from "./background/chrome.js"
import { dailyTasks } from "./dialog/dailyTasks.js"
import { helpDialog } from "./dialog/helpDialog.js"
export class App extends Component {
  serverActionRef = this.useRef('server-open')
  serverLogoutRef = this.useRef('server-logout')
  processMainRef = this.useRef('process-page')
  loadingBannerRef = this.useRef('loading-banner')
  loggedNameRef = this.useRef('logged-name')
  errorRef = this.useRef('error')
  pinRef = this.useRef('action-pin-ref')
  dailyTask = this.useRef('action-daily-task-ref')
  helpDialog = this.useRef('help-dialog')

  custom_events = {
    'authentication': this.onAuthentication,
    'loading': this.onLoading,
    'session_errors': this.onSessionError,
    'error': this.onError
  }
  constructor() {
    super(...arguments);
    this.subEnv = {};
    this.load = {};
    this.env.syncChannel(['authentication', 'issueData', 'searchData', 'historyData', 'checklistData']);
  }
  mountServerAction() {
    let self = this;
    this.serverActionRef.el.addEventListener('click', function (event) {
      window.open(self.env.serverURL, '_blank');
    })
    this.serverLogoutRef.el.addEventListener('click', function (event) {
      self.processMainRef.innerHTML = "";
      self.env.raw.jwt = false;
      self.onAuthentication(self.env.raw, false);
    })
  }
  scrollEvent() {
    window.addEventListener('scroll', event => {
      localStorage.setItem("localScrollStorage", window.pageYOffset);
    })
  }
  initGeneralEvent() {
    let self = this;
    this.scrollEvent();
    window.addEventListener('keydown', event => {
      if (window.event.altKey && window.event.ctrlKey && window.event.shiftKey) {
        self.pinRef.el.click();
      }
      else if (window.event.shiftKey && window.event.keyCode == 32) {
        if (this.popup) {
          this.popup.destroy()
        } else {
          self.dailyTask.el.click()
        }
      }
      event.stopImmediatePropagation();
    })
    this.dailyTask.el.addEventListener('click', event => {
      self.showDialog(dailyTasks, { title: "Daily Task" })
    })
    this.helpDialog.el.addEventListener('click', event => {
      self.showDialog(helpDialog, { title: "Help" })
    })
  }
  async mountingComponent() {
    let self = this;
    this.component = null;
    if (this.env?.authenticated) {
      this.component = new Main(this);
      this.mountServerAction();
      this.el.classList.add('logged');
      this.loggedNameRef.el.innerText = this.env.loggedName || '';
    }
    else {
      if (this.env.jwt && !this.checked) {
        let payload = {
          'jwt': this.env.jwt
        }
        let res = (await this.do_request('POST', this.env.serverURL + "/web/login/jwt/status", (payload)))
        if (res && (await res.json())) {
          self.update('authenticated', true)
        }
        this.checked = true;
        self.mountingComponent(true)
        return
      } else {
        this.component = new Login(this, {});
        this.el.classList.remove('logged');
      }
    }
    if (this.mode === "pinned") {
      this.pinRef.el.remove();
    }
    this.component.mount(this.processMainRef.el)
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
    if (this.env.serverURL !== data.serverURL) {
      this.env.syncOne('issueData', null)
    }
    data['authenticated'] = authenticated;
    await this.env.syncAll(data);
    await this.env.reload();
    this.processMainRef.el.innerHTML = '';
    this.loadUI();
  }
  onLoading(display = true) {
    this.loadingBannerRef.el.style.display = (display ? "inline-block" : "none");
  }
  onError(data) {
    this.showDialog(ErrorDialog, data)

  }
  onSessionError(data) {
    this.checked = true;
    this.showDialog(ErrorDialog, data)
    this.onAuthentication(this.env.raw, false);
  }
  async onIssueChanged(issueData) {
    if (chrome.storage) {
      let data = (await chrome.storage.local.get(["timeLogStorage"]))?.timeLogStorage
      data.issueData = issueData;
      chrome.storage.local.set({ 'timeLogStorage': data })
      this.flushDataToExtension({ issueUpdate: data.issueData });
    } else {
      let data = JSON.parse(localStorage.getItem(storage) || "{}");
      data.issueData = issueData;
      localStorage.setItem(storage, JSON.stringify(data));
    }
  }
  onRelativeUpdated(relatives) {
    if (this.subEnv.extensionID) {
      this.flushDataToExtension({ 'relativeUpdate': relatives })
    }
  }
  checkListChanged(payload) {
    this.flushDataToExtension({ checkGroup: payload });
  }
  flushDataToExtension(data) {
    chrome.runtime.sendMessage(data);
  }
  issueUpdate(issueData) {
    if (this.subEnv.authenticated) {
      issueData.broardcast = true;
      this.component.issueData = issueData;
      this.component.renderContent();
      this.component.issueData.broardcast = false;
    }
  }
  relativeActiveUpdate(relativeActives) {
    if (this.subEnv.authenticated) {
      this.component.issueData.broardcast = true;
      this.component.relatedActiveIssues = relativeActives;
      this.component.fetchRelativeActive();
      this.component.issueData.broardcast = false;
    }
  }
  searchedUpdate(searchData) {
    if (this.subEnv.authenticated) {
      this.component.searchData = searchData;
    }
  }
  checkListUpdated(payload) {
    if (this.subEnv.authenticated) {
      this.component.insertCheckGroup(payload)
    }
  }
  componentReady() {
    let lastScrollY = parseInt(localStorage.getItem('localScrollStorage')) || 0;
    if (lastScrollY) {
      window.scrollTo(0, lastScrollY)
    }
  }
  onLoadStart(data) {
    this.load[data] = false
  }
  onLoadDone(data) {
    this.load[data] = true
    for (let key in this.load) {
      if (!this.load[key]) {
        return;
      }
    }
    this.componentReady()
  }
  getTemplate() {
    return `
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
                    <p class="help" l-ref="help-dialog">
                      <svg class="tm-svg-inline--fa fa-question-circle fa-w-16" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="question-circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zM262.655 90c-54.497 0-89.255 22.957-116.549 63.758-3.536 5.286-2.353 12.415 2.715 16.258l34.699 26.31c5.205 3.947 12.621 3.008 16.665-2.122 17.864-22.658 30.113-35.797 57.303-35.797 20.429 0 45.698 13.148 45.698 32.958 0 14.976-12.363 22.667-32.534 33.976C247.128 238.528 216 254.941 216 296v4c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12v-1.333c0-28.462 83.186-29.647 83.186-106.667 0-58.002-60.165-102-116.531-102zM256 338c-25.365 0-46 20.635-46 46 0 25.364 20.635 46 46 46s46-20.636 46-46c0-25.365-20.635-46-46-46z"></path></svg>
                    </p>
                </div>
              </div>
            </div>
            <div class="pin-action" l-ref="pin-action">
              <span class="tm-icon-svg" l-ref="action-pin-ref" >
                <svg class="tm-svg-inline--fa" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="map-pin" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M320 144C320 223.5 255.5 288 176 288C96.47 288 32 223.5 32 144C32 64.47 96.47 0 176 0C255.5 0 320 64.47 320 144zM192 64C192 55.16 184.8 48 176 48C122.1 48 80 90.98 80 144C80 152.8 87.16 160 96 160C104.8 160 112 152.8 112 144C112 108.7 140.7 80 176 80C184.8 80 192 72.84 192 64zM144 480V317.1C154.4 319 165.1 319.1 176 319.1C186.9 319.1 197.6 319 208 317.1V480C208 497.7 193.7 512 176 512C158.3 512 144 497.7 144 480z"></path></svg>
              </span>
              <span class="tm-icon-svg" l-ref="action-daily-task-ref" >
                <svg class="tm-svg-inline--fa fa-list-check" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="list-check" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M152.1 38.16C161.9 47.03 162.7 62.2 153.8 72.06L81.84 152.1C77.43 156.9 71.21 159.8 64.63 159.1C58.05 160.2 51.69 157.6 47.03 152.1L7.029 112.1C-2.343 103.6-2.343 88.4 7.029 79.03C16.4 69.66 31.6 69.66 40.97 79.03L63.08 101.1L118.2 39.94C127 30.09 142.2 29.29 152.1 38.16V38.16zM152.1 198.2C161.9 207 162.7 222.2 153.8 232.1L81.84 312.1C77.43 316.9 71.21 319.8 64.63 319.1C58.05 320.2 51.69 317.6 47.03 312.1L7.029 272.1C-2.343 263.6-2.343 248.4 7.029 239C16.4 229.7 31.6 229.7 40.97 239L63.08 261.1L118.2 199.9C127 190.1 142.2 189.3 152.1 198.2V198.2zM224 96C224 78.33 238.3 64 256 64H480C497.7 64 512 78.33 512 96C512 113.7 497.7 128 480 128H256C238.3 128 224 113.7 224 96V96zM224 256C224 238.3 238.3 224 256 224H480C497.7 224 512 238.3 512 256C512 273.7 497.7 288 480 288H256C238.3 288 224 273.7 224 256zM160 416C160 398.3 174.3 384 192 384H480C497.7 384 512 398.3 512 416C512 433.7 497.7 448 480 448H192C174.3 448 160 433.7 160 416zM0 416C0 389.5 21.49 368 48 368C74.51 368 96 389.5 96 416C96 442.5 74.51 464 48 464C21.49 464 0 442.5 0 416z"></path></svg>
              </span>
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
}


loadEnvironment().then(() => mount(App, document.body))
