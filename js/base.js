const storage = "WorkTrackingStorage";

export function generateEnvironment() {
    return {
        sync: true,
        mustSync: false,
        raw: {},
        channels: {},
        saveChannels: {},
        async reload() {
            let result = {};
            if (chrome.storage) {
                result = (await chrome.storage.local.get([storage]));
                result = result[storage];
            } else {
                result = JSON.parse(localStorage.getItem(storage));
            }
            for (let key in result) {
                this[key] = result[key];
            }
        },
        async saveLocal() {
            if (chrome.storage) {
                let data = {};
                data[storage] = this.raw
                await chrome.storage.local.set(data)
            } else {
                localStorage.setItem(storage, JSON.stringify(this.raw));
            }
        },
        set origin(updatedValues) {
            for (let key in updatedValues) {
                this[key] = updatedValues[key];
                if (this.channels[key]) {
                    for (let callback of this.channels[key]) {
                        callback(updatedValues[key])
                    }
                }
                if (this.saveChannels[key]) {
                    this.raw[key] = updatedValues[key];
                    this.mustSync = true;
                }
            }
            if (this.mustSync) {
                this.saveLocal();
                this.mustSync = false;
            }
        },
        syncAll(data) {
            for (let key in data) {
                this.raw[key] = data[key];
            }
            this.saveLocal();
        },
        syncOne(key, value) {
            this.raw[key] = value;
            this.saveLocal();
        },
        update(key, value) {
            this[key] = value;
            if (this.channels[key]) {
                for (let callback of this.channels[key]) {
                    callback(value)
                }
            }
            if (this.saveChannels[key]) {
                this.raw[key] = value;
                this.saveLocal();
            }
        },
        subscribe(key, callback) {
            if (this.channels[key]) {
                this.channels[key].push(callback)
            } else {
                this.channels[key] = [callback]
            }
        },
        syncChannel(keys) {
            if (typeof keys === 'string') {
                keys = [keys];
            }
            for (let key of keys) {
                if (!this[key]){
                    this[key] = {};
                }
                this.saveChannels[key] = true;
            }
        }
    }
}

var env = generateEnvironment();

export async function loadEnvironment() {
    let result = {};
    if (chrome.storage) {
        result = (await chrome.storage.local.get([storage]));
        result = result[storage];
    } else {
        result = JSON.parse(localStorage.getItem(storage))
    }
    result = result || {};
    Object.assign(env.raw, result)
    env.origin = result;
}

export class Component {
    custom_events = {}
    ref = []
    refs = {}
    template = null

    constructor(parent, params = {}) {
        this.parent = parent;
        this.params = params;
        this.childrens = [];
        this.subEnv = {};
        this.__position = 1;
        if (this.parent?.env) {
            this.env = this.parent.env;
        } else {
            this.env = env;
        }
        if (this.parent) {
            this.__position = this.parent.childrens.length;
            this.parent.childrens.push(this);
            this.subEnv = this.parent.subEnv;
        }
        if (params.subEnv) {
            this.subEnv = params.subEnv;
        }
        if (params.extensionID) {
            this.subEnv.extensionID = params.extensionID;
        }
    }

    useRef(name) {
        let self = this;
        this.ref.push(name);
        return {
            get el() {
                return self.refs[name] || null;
            },
        };
    }

    update(key, value) {
        this.env.update(key, value);
    }

    subscribe(key, callback) {
        this.env.subscribe(key, callback);
    }

    mount(element) {
        let self = this;
        let promise = this.willStart().then(()=>{
                self.render(element)
                return self.mounted()
            }
        );
        return promise
    }

    reload() {
        self = this;
        setTimeout(() => {
            let newTemplate = self.getTemplate();
            self.baseHTML = new DOMParser().parseFromString(newTemplate, 'text/html');
            let el = self.el;
            self.el = self.baseHTML.body.firstChild
            el.replaceWith(self.el);
            this.mounted();
        }, 1)
    }

    willStart() {
        return Promise.all([]);
    }
    
    getTemplate(){
        return false
    }

    render(element) {
        let template = this.getTemplate()
        if (!template) {
            throw Error("Cannot find template: " + template);
        }
        this.baseHTML = new DOMParser().parseFromString(template, 'text/html');
        this.el = this.baseHTML.body.firstChild;
        element.append(this.el);
    }

    mounted() {
        this.initObject();
        return Promise.resolve();
    }

    initObject() {
        for (let ref of this.ref) {
            let element = this.el.querySelector(`[l-ref="${ref}"]`);
            if (element) {
                this.refs[ref] = element;
                element.removeAttribute('l-ref');
            }
        }
    }

    event(event, data, matchLevel=1, f) {
        if (this.custom_events[event]) {
            this.custom_events[event] = this.custom_events[event].bind(this);
            this.custom_events[event](data);
            matchLevel -= 1 ;
        }
        if (matchLevel > 0){
            f(event, data, matchLevel);
        }     
    }

    methodEvent(method, data, matchLevel=1, f){
        if (this[method]) {
            this[method](data)
            matchLevel -= 1 ;
        }
        if (matchLevel > 0){
            f(method, data, matchLevel);
        }     
    }

    triggerUp(event, data, matchLevel = 1) {
        if (this.parent) {
            this.parent.event(event, data, matchLevel, this.triggerUp.bind(this.parent))
        }
    }

    triggerUpMethod(functionName, data, matchLevel = 1){
        if (this.parent) {
            this.parent.methodEvent(functionName, data, matchLevel, this.triggerUpMethod.bind(this.parent))
        }
    }

    patchDown(event, data, matchLevel){
        for (let child of this.childrens){
            child.event(event, data, matchLevel, this.patchDown.bind(child))
        }
    }
    patchDownMethod(event, data, matchLevel){
        for (let child of this.childrens){
            child.methodEvent(event, data, matchLevel, this.patchDownMethod.bind(child))
        }
    }

    blockHandling() {
        for (let element of document.querySelectorAll('button')) {
            element.setAttribute("disabled", "disabled")
        }
    }

    unblockHandling() {
        for (let element of document.querySelectorAll('button')) {
            element.removeAttribute("disabled")
        }
    }
    __unlinkParent(){
        this.parent.childrens.splice(this.__position, 1)
    }
    destroy() {
        setTimeout(() => {
            for (let child of this.childrens) {
                child.destroy();
            }
        }, 1)
        this.__unlinkParent()
        this.el?.remove();
    }

    async do_request(method = 'GET', url, content, mode="cors") {
        try {
            let json = {
                method: method,
                mode: mode,
            }
            if (!['GET'].includes(method)) {
                json.body = JSON.stringify(content)
            }
            this.triggerUp('loading', true);
            let res = (await fetch(url, json));
            if (res.ok) {
                return res
            } else {
                let key = "error";
                if (res.status === 403) {
                    key = 'session_errors'
                }
                this.triggerUp(key, {
                    'message': (await res.text()),
                })
                return false
            }
        } catch (erros) {
            let key = 'error';
            if (method === "GET") {
                key = 'session_errors'
            }
            this.triggerUp(key, {
                'message': erros.message
            })
            return false
        } finally {
            this.triggerUp('loading', false);
        }
    }

    async do_invisible_request(method = 'GET', url, content) {
        try {
            let json = {
                method: method,
                mode: 'cors',
            }
            if (!['GET'].includes(method)) {
                json.body = JSON.stringify(content)
            }
            let res = (await fetch(url, json));
            if (res.ok) {
                return res
            } else {
                let key = "error";
                if (res.status === 403) {
                    key = 'session_errors'
                }
                this.triggerUp(key, {
                    'message': (await res.text()),
                })
                return false
            }
        } catch (erros) {
            let key = 'error';
            if (method === "GET") {
                key = 'session_errors'
            }
            this.triggerUp(key, {
                'message': erros.message
            })
            return false
        }
    }

    showDialog(object, params = {}) {
        let element = document.getElementsByTagName('lbwt')[0].firstElementChild;
        if (element) {
            let popup = null;
            if (this.popup) {
                this.popup.destroy();
            }
            popup = new object(this, params);
            popup.mount(element);
            this.popup = popup
        }
    }
}

export function mount(object, element, params = {}) {
    let component = new object(null, params);
    component.mount(element);
    return component
}


