
class Component {
    custom_events = {}
    ref = []
    refs = {}
    template = null
    constructor(parent, params={}) {
        this.parent = parent;
        this.params = params;
        this.childrens = [];
        this.subEnv = {};
        if (this.parent){
            this.parent.childrens.push(this);
            this.subEnv = this.parent.subEnv;
        }
    }
    useRef(name) {
        let self = this;
        this.ref.push(name)
        return {
            get el() {
                return self.refs[name] || null;
            },
        };
    }
    mount(element){
        let self = this;
        this.willStart().then(self.render(element).then(self.mounted()));
    }
    willStart() {
        return new Promise(()=>{})
    }
    render(element) {
        if (!this.template){
            throw Error("Cannot find template: " + this.template) 
        }
        this.baseHTML = new DOMParser().parseFromString(this.template, 'text/html');
        this.el = this.baseHTML.body.firstChild
        element.append(this.el)
        return new Promise(()=>{})
    }
    mounted() {
        this.initObject()
        return new Promise(()=>{})
    }
    initObject() {
        for (let ref of this.ref){
            let element = this.el.querySelector(`[l-ref="${ref}"]`);
            if (element){
                this.refs[ref] = element
            }
        }
    }
    event(event, data) {
        if (this.custom_events[event]) {
            this.custom_events[event] = this.custom_events[event].bind(this)
            this.custom_events[event](data)
        }
        else {
            this.trigger_up(event, data)
        }
    }
    trigger_up(event, data) {
        if (this.parent) {
            this.parent.event(event, data)
        }
    }
}

function mount(object, element){
    new object(null, {}).mount(element)
}