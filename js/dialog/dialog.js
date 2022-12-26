import { Component, generateEnvironment } from "../base.js";
export class BaseDialog extends Component{
    dialogClose = this.useRef('dialog-close');
    dialogArea = this.useRef('dialog-area')
    dialogContent = this.useRef('dialog-content');
    dialogFooter = this.useRef('dialog-footer')
    dialogCancel = this.useRef('button-cancel')
    maxHeight = 525
    constructor(){
        super(...arguments);
        this.response = {};
        if (!this.parent.baseEnv){
            this.baseEnv = this.env;
            this.env = generateEnvironment();
            this.env.origin = this.baseEnv.raw;
        }
        this.innerTemplate = '';
        this.parentSize = 0;
        this.renderDialog();
    }
    autoCloseDialog(event){
        console.log(event)

    }
    renderDialogContent(){
        
    }
    postUpdateDialogContent(){
        var screenPosition = this.dialogArea.el.getBoundingClientRect();
        let height = screenPosition.height;
        if (height > this.maxHeight){
            height = this.maxHeight
        }
        this.parentSize = this.el.parentNode.getBoundingClientRect().height;
        this.dialogArea.el.style.height = parseInt(height) + "px";
        this.el.parentNode.style.height = (height+50) + "px";
    }
    destroy(){
        if (this.parentSize > 0){
            this.el.parentNode.style.height = (this.parentSize) + "px";
            this.parentSize = 0;
        }
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
                            ${this.params.title || ''}
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
        console.log(window)
        return res
    }
}