
class Home extends Component {
  serverActionRef = this.useRef('server-open')
  serverLogoutRef = this.useRef('server-logout')
  processMainRef = this.useRef('process-page')
  loadingBannerRef = this.useRef('loading-banner')
  loggedNameRef = this.useRef('logged-name')
  errorRef = this.useRef('error')

  custom_events = {
    'authentication': this.onAuthentication,
    'authentication-failed': this.onAuthenticationFailed,
    'loading': this.onLoading,
    'error': this.onError,
    'session_errors': this.onSessionError
  }
  constructor() {
    super(...arguments);
    this.payload = {};
    // this.onAuthentication = this.onAuthentication.bind(this);
    this.subEnv = {};
  }
  async loadAuthentication() {
    let self = this;
    let result = {};
    result = JSON.parse(localStorage.getItem("timeLogStorage") || "{}")
    self.payload = result;
    self.subEnv = this.payload;
  }
  mountServerAction() {
    let self = this;
    this.serverActionRef.el.addEventListener('click', event => {
      window.open(self.payload.serverURL, '_blank')
    })
    this.serverLogoutRef.el.addEventListener('click', event => {
      self.onAuthentication(self.payload, false);
    })
  }
  async
  mountingComponent() {
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
    this.component.mount(this.processMainRef.el)
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
  async onAuthentication(data, authenticated = true) {
    if (data.jwt) {
      data['authenticated'] = authenticated;
      // if (chrome?.storage) {
      //   await chrome.storage.sync.set({ timeLogStorage: data })
      // }
      // else {
      localStorage.setItem(storage, JSON.stringify(data))
      // }
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
    this.onAuthentication(this.payload,   false);
  }
  template = `
  <div class="main-page">
      <div l-ref="loading-banner" class="loading-layer"><div class="loader"></div></div>
      <div class="title d-flex justify-content-between">
          <div class="content" l-ref="server-open">
              <span><i class="fa-solid fa-clock"></i></span> <span>LB/TM</span>
              <p style="color: black;font-size:12px;margin-left: 5px;">
                  Powered by <a href="https://www.drakebui.ml" target="_blank">Long Bui</a>
              </p>
          </div>
          <div class="extend-tool" l-ref="server-logout">
              <span l-ref="logged-name"></span>
              <i class="fa-solid fa-power-off"></i>
          </div>
      </div>
      <div class="error-layer"><div class="error" l-ref="error"></div></div>
      <div class="process-page" l-ref="process-page">
          <t t-if="state.authentication">
            <Main/>
          </t>
          <t t-else="">
            <Login/>
          </t>
      </div>
  </div>`
}


mount(Home, document.body);