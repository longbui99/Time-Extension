import { Component, generateEnvironment } from "../base.js";
export class BaseDialog extends Component{
    dialogClose = this.useRef('dialog-close');
    dialogContent = this.useRef('dialog-content');
    dialogCancel = this.useRef('button-cancel')
    constructor(){
        super(...arguments);
        this.response = {};
        if (!this.parent.baseEnv){
            this.baseEnv = this.env;
            this.env = generateEnvironment();
            this.env.origin = this.baseEnv.raw;
        }
        this.innerTemplate = '';
        this.renderDialog();
    }
    renderDialogContent(){
        
    }
    renderDialog(){
        this.renderDialogContent();
        this.template = `
            <lbwt-dialog>
                <div class="dialog-panner">
                </div>
                <div class="dialog-main">
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
                    <div class="dialog-footer">
                        ${this.innerFooter || ''}
                    </div>
                </div>
            </lbwt-dialog>
        `
    }
    mounted(){
        let res = super.mounted();
        
        this.dialogClose.el.addEventListener('click', e=>{
            if (this.params.closeCallback){
                this.params.closeCallback(this.response);
            }
            this.destroy();
        })
        this.dialogCancel?.el.addEventListener('click', e=>{
            if (this.params.cancelCallback){
                this.params.cancelCallback(this.response);
            }
            this.destroy();
        })
        return res
    }
}