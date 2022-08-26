const storage = "WorkTrackingStorage";
var env = {
    sync: true,
    mustSync: false,
    raw: {},
    channels: {},
    saveChannels: {},
    async reload(){
        let result = {};
        if (chrome.storage){
            result = (await chrome.storage.local.get([storage]));
            result = result[storage];
        } else {
            result = JSON.parse(localStorage.getItem(storage));
        }
        for(let key in result){
            this[key] = result[key];
        }
    },
    async saveLocal(){
        if (chrome.storage){
            let data = {};
            data[storage] = this.raw
            await chrome.storage.local.set(data)
        } else {
            localStorage.setItem(storage, JSON.stringify(this.raw));
        }
    },
    set origin(updatedValues){
        for (let key in updatedValues){
            this[key] = updatedValues[key];
            if (this.channels[key]){
                for (let callback of this.channels[key]){
                    callback(updatedValues[key])
                }
            }
            if (this.saveChannels[key]){
                this.raw[key] = updatedValues[key];
                this.mustSync = true;
            }
        }
        if (this.mustSync){
            this.saveLocal();
            this.mustSync = false;
        }
    },
    syncAll(data){
        for (let key in data){
            this.raw[key] = data[key];
        }
        this.saveLocal();
    },
    syncOne(key, value){
        this.raw[key] = value;
        this.saveLocal();
    },
    update(key, value){
        this[key] = value;
        if (this.channels[key]){
            for (let callback of this.channels[key]){
                callback(value)
            }
        }
        if (this.saveChannels[key]){
            this.raw[key] = value;
            this.saveLocal();
        }
    },
    subscribe(key, callback){
        if (this.channels[key]){
            this.channels[key].push(callback)
        } else {
            this.channels[key] = [callback]
        }
    },
    syncChannel(keys){
        if (typeof keys === 'string'){
            keys = [keys];
        }
        for (let key of keys){
            this.saveChannels[key] = true;
        }
    }
}
export async function loadEnvironment(){
    let result = {};
    if (chrome.storage){
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
        this.env = env;
        if (this.parent) {
            this.parent.childrens.push(this);
            this.subEnv = this.parent.subEnv;
        }
        if (params.subEnv){
            this.subEnv = params.subEnv;
        }
        if (params.extensionID){
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
    mount(element) {
        let self = this;
        this.willStart().then(self.render(element).then(self.mounted()));
        return this;
    }
    reload(){
        let parent = this.parent, afterNode=this.el.nextSibling, parentNode = this.el.parentNode, self = this;
        setTimeout(()=>{
            self.el.remove();
            let tempoClass = (new self.constructor(parent, self.params))
            let newTemplate = tempoClass.template;
            self.baseHTML = new DOMParser().parseFromString(newTemplate, 'text/html');
            self.el = self.baseHTML.body.firstChild;
            parentNode.insertBefore(self.el, afterNode);
            this.mounted();
        }, 1)
    }
    willStart() {
        return new Promise(() => { });
    }
    render(element) {
        if (!this.template) {
            throw Error("Cannot find template: " + this.template);
        }
        this.baseHTML = new DOMParser().parseFromString(this.template, 'text/html');
        this.el = this.baseHTML.body.firstChild;
        element.append(this.el);
        return new Promise(() => { });
    }
    mounted() {
        this.initObject()
        return new Promise(() => { });
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
    event(event, data) {
        if (this.custom_events[event]) {
            this.custom_events[event] = this.custom_events[event].bind(this);
            this.custom_events[event](data);
        }
        else {
            this.trigger_up(event, data);
        }
    }
    trigger_up(event, data) {
        if (this.parent) {
            this.parent.event(event, data)
        }
    }
    blockHandling(){
        for (let element of document.querySelectorAll('button')){
            element.setAttribute("disabled", "disabled")
        }
    }
    unblockHandling(){
        for (let element of document.querySelectorAll('button')){
            element.removeAttribute("disabled")
        }
    }
    destroy(){
        setTimeout(()=>{
            for(let child of this.childrens){
                child.destroy();
            }
        }, 1)
        this.el?.remove();
    }
    async do_request(method='GET', url, content) {
        try {
            let json = {
                method: method,
                mode: 'cors',
            }
            if (!['GET'].includes(method)){
                json.body = JSON.stringify(content)
            }
            this.trigger_up('error', {})
            this.trigger_up('loading', true);
            this.blockHandling();
            let res = (await fetch(url, json));
            this.unblockHandling();
            if (res.ok){
                return res
            }
            else{
                this.trigger_up('error', {
                    'error': (await res.text())
                })
            }
        }
        catch (erros) {
            this.trigger_up('session_errors', {
                'error': erros.message
            })
        }
        finally {
            this.trigger_up('loading', false);
        }
    }
    async do_invisible_request(method='GET', url, content) {
        try {
            let json = {
                method: method,
                mode: 'cors',
            }
            if (!['GET'].includes(method)){
                json.body = JSON.stringify(content)
            }
            let res = (await fetch(url, json));
            if (res.ok){
                return res
            }
            else{
                this.trigger_up('error', {
                    'error': (await res.text())
                })
            }
        }
        catch (erros) {
            this.trigger_up('session_errors', {
                'error': erros.message
            })
        }
    }
}

export function mount(object, element, params={}) {
    let component = new object(null, params);
    component.mount(element);
    return component
}


