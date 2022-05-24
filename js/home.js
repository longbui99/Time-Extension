
class Home extends Component {
  serverActionRef = this.useRef('server-open')
  serverLogoutRef = this.useRef('server-logout')
  processMainRef = this.useRef('process-page')
  loadingBannerRef = this.useRef('loading-banner')

  custom_events = {
    'authentication': this.onAuthentication,
    'authentication-failed': this.onAuthenticationFailed,
    'loading': this.onLoading
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
    // if (chrome && chrome.storage) {
    //   result = (await chrome.storage.sync.get(["timeLogStorage"]))
    // } else {
    result = JSON.parse(localStorage.getItem("timeLogStorage") || "{}")
    // }
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
              <i class="fa-solid fa-power-off"></i>
          </div>
      </div>
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