class Login extends Component {
    constructor() {
        super(...arguments);
        this.popupRef = this.useRef('sign-in-tooltip');
        this.serverURLRef = this.useRef('server-url');
        this.usernameRef = this.useRef('username');
        this.passwordRef = this.useRef('password');
        this.signInRef = this.useRef('actionSignIn');

        this.actionSignIn = this.actionSignIn.bind(this);

    }
    _prepareValues() {
        let data = {
            'login': this.usernameRef.el.value,
            'password': this.passwordRef.el.value
        }
        return data
    }
    _prepareServerAPI() {
        return this.serverURLRef.el.value 
    }

    async actionSignIn(event) {
        let payload = this._prepareValues();
        let serverURL = this._prepareServerAPI();
        this.trigger_up('loading', true);
        try {
            const response = await fetch(serverURL + "/web/login/jwt?" + new URLSearchParams(payload));
            const data = await response.json();
            this.popupRef.el.style.display = "none";
            this.trigger_up('authentication', {
                'jwt': data.data,
                'serverURL': serverURL.trim('/')
            })
        }
        catch (error){
            this.popupRef.el.style.display = "inline-block";
            throw error
        } finally{
            this.trigger_up('loading', false);
        }
    }

    mounted(){
        let res = super.mounted();
        this.serverURLRef.el.value = this.subEnv.serverURL;
        this.signInRef.el.addEventListener('click', this.actionSignIn)
        return res
    }

    template = `
    <div class="login-page">
        <div class="sign-in-tooltip">
            <div class="text-danger">
                <span l-ref="sign-in-tooltip" class="hide">Authentication Failed</span>
            </div>
        </div>
        <div class="main-login-page">
            <div class="server-url">
                <div class="input-group mb-3">
                    <input type="text" class="form-control" placeholder="Server URL" l-ref="server-url"
                        aria-describedby="basic-addon3" value="" />
                </div>
            </div>
            <div class="navigator-username">
                <div class="input-group mb-3">
                    <input type="text" class="form-control" placeholder="Username" aria-label="Username" l-ref="username"
                        aria-describedby="basic-addon1" value=""/>
                </div>
            </div>
            <div class="navigator-password">
                <div class="input-group mb-3">
                    <input type="password" class="form-control" placeholder="Password / Access Token" l-ref="password"
                        aria-describedby="basic-addon3" value=""/>
                </div>
            </div>
            <div class="nagivator-button">
                <button type="button" class="btn btn-primary aquacolor" l-ref="actionSignIn">Sign In</button>
            </div>
        </div>
    </div>
`
}