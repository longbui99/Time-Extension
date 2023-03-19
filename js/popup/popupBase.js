import { Component } from "../base.js";
export class BasePopup extends Component {
    constructor() {
        super(...arguments);
        this.response = {};
        this.parentSize = 0;
        if (!this.params.pointElement){
            throw "Cannot find pointing element when opening popup!"
        }
        this.parent.popup = this;
        this.renderDialog();
    }
    renderDialogContent() {

    }
    postUpdateDialogContent() {
        this.resizeChange()
    }
    renderDialog() {
        this.renderDialogContent();
    }
    adjustPositionPopup(){
        var screenPosition = this.params.pointElement.getBoundingClientRect();
        let bottom = screenPosition.bottom;
        if (bottom > this.maxHeight) {
            bottom = this.maxHeight
        }
        this.el.style.top = parseInt(bottom) + "px";
        this.el.style.left = parseInt(screenPosition.left-5) + "px";
        this.el.style.right = 10 + "px";
        this.params.pointElement.classList.add('lbwt-box-shadow');
    }
    windowDestroy(){
        this.destroy();
    }
    pointElementDestroy(event){
        this.destroy();
    }
    preInitEvent(){
        this.windowAction = this.windowDestroy.bind(this);
        this.pointElementAction = this.pointElementDestroy.bind(this);
        window.event.stopPropagation();
        document.body.addEventListener('click', this.windowAction)
        this.params.pointElement.addEventListener('click', this.pointElementAction)
    }
    initEvent(){
        this.el.addEventListener('click', (event)=>{
            event.stopPropagation();
        })
    }
    mounted() {
        this.preInitEvent();
        let res = super.mounted();
        this.initEvent();
        this.adjustPositionPopup();
        return res
    }
    destroy(){
        this.params.pointElement.classList.remove('lbwt-box-shadow');
        this.parent.popup = null;
        document.body.removeEventListener('click', this.windowAction);
        this.params.pointElement.removeEventListener('click', this.pointElementAction);
        super.destroy();
    }
    getTemplate() {
        return `
        <div class="popup-main">
            ${this.innerTemplate || ''}
        </div>
    `
    }
}