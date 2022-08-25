
import {Component} from "./base.js"
export class Login extends Component {
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
        try {
            const response = await this.do_request('POST', serverURL + "/web/login/jwt", (payload));
            const data = await response.json();
            this.popupRef.el.style.display = "none";
            this.trigger_up('authentication', {
                'jwt': data.data,
                'loggedName': data.name,
                "resource": data.resource,
                'serverURL': serverURL.trim('/')
            })
        }
        catch (errors) {
            this.popupRef.el.style.display = "inline-block";
        }
    }
    mounted() {
        let res = super.mounted();
        this.signInRef.el.addEventListener('click', this.actionSignIn)
        this.serverURLRef.el.value = this.env.serverURL;
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
            <div class="navigator server-url">
                <div class="tm-input-group mb-3">
                    <input type="text" class="tm-form-control" placeholder="Server URL" l-ref="server-url"
                        aria-describedby="basic-addon3" value="" />
                </div>
            </div>
            <div class="navigator navigator-username">
                <div class="tm-input-group mb-3">
                    <input type="text" class="tm-form-control" placeholder="Username" aria-label="Username" l-ref="username"
                        aria-describedby="basic-addon1" value=""/>
                </div>
            </div>
            <div class="navigator navigator-password">
                <div class="tm-input-group mb-3">
                    <input type="password" class="tm-form-control" placeholder="Password / Access Token" l-ref="password"
                        aria-describedby="basic-addon3" value=""/>
                </div>
            </div>
            <div class="nagivator-button">
                <button type="button" class="btn btn-start aquacolor" l-ref="actionSignIn">Sign In</button>
            </div>
        </div>
    </div>
`
}