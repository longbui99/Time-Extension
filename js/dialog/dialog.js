import { Component, generateEnvironment } from "../base.js";
export class BaseDialog extends Component{
    dialogClose = this.useRef('dialog-close');
    dialogArea = this.useRef('dialog-area')
    dialogContent = this.useRef('dialog-content');
    dialogFooter = this.useRef('dialog-footer')
    dialogCancel = this.useRef('button-cancel')
    dialogTitle = this.useRef('dialog-title')
    maxHeight = 550
    constructor(){
        super(...arguments);
        this.response = {};
        if (!this.parent.baseEnv){
            this.baseEnv = this.env;
            this.env = generateEnvironment();
            this.env.origin = this.baseEnv.raw;
        }
        this.innerTemplate = '';
        this.headerTooltip = '';
        this.parentSize = 0;
        this.renderDialog();
    }
    autoCloseDialog(event){
        console.log(event)
    }
    renderDialogContent(){
        
    }
    resizeChange(){
        this.dialogArea.el.style.minHeight = "unset";
        var screenPosition = this.dialogArea.el.getBoundingClientRect();
        let height = screenPosition.height;
        height -= 20
        if (height > this.maxHeight){
            height = this.maxHeight
        }
        this.dialogArea.el.style.minHeight = parseInt(height) + "px";
        this.parentSize = this.el.parentNode.getBoundingClientRect().height;
        if (this.parentSize < height + 20){
            this.el.parentNode.style.minHeight = (height+25) + "px";
        } 
    }
    postUpdateDialogContent(){
        this.resizeChange()
    }
    destroy(){
        if (this.parentSize > 0){
            this.el.parentNode.style.minHeight = "unset";
            this.parentSize = 0;
        }
        this.parent.popup = null;
        super.destroy()
    }
    renderDialog(){
        this.renderDialogContent();
        this.template = `
            <lbwt-dialog>
                <div class="dialog-panner">
                </div>
                <div class="dialog-main" l-ref="dialog-area">
                    <div class="dialog-header">
                        <div class="dialog-title">
                            <span l-ref="dialog-title">
                                ${this.params.title || ''}
                            </span>
                            <span>
                                ${this.headerTooltip || ''}    
                            </span>
                        </div>
                        <div class="dialog-close" l-ref="dialog-close">
                            x
                        </div>
                    </div>
                    <div class="dialog-content" l-ref="dialog-content">
                        ${this.innerTemplate || ''}
                    </div>
                    <div class="dialog-footer" l-ref="dialog-footer">
                        ${this.innerFooter || ''}
                    </div>
                </div>
            </lbwt-dialog>
        `
    }

    mounted(){
        let res = super.mounted();
        let self = this;
        this.dialogClose?.el?.addEventListener('click', e=>{
            if (this.params.closeCallback){
                this.params.closeCallback(this.response);
            }
            this.destroy();
        })
        this.dialogCancel?.el?.addEventListener('click', e=>{
            if (this.params.cancelCallback){
                this.params.cancelCallback(this.response);
            }
            this.destroy();
        })
        window.addEventListener('keydown', self.autoCloseDialog.bind(self))
        const resize_ob = new ResizeObserver(function(entries) {
            self.resizeChange()
        });
        resize_ob.observe(this.dialogContent.el);
        this.dialogArea.el.style.maxHeight = this.maxHeight + "px";
        return res
    }
}