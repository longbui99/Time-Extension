import { Component } from "../base.js";

export class BaseDialog extends Component{
    dialogClose = this.useRef('dialog-close');
    dialogContent = this.useRef('dialog-content');
    constructor(){
        super(...arguments);
        if (this.parent.dialogEnv){
            this.dialogEnv = this.parent.dialogEnv;
        } else {
            let cloneEnv = {};
            Object.assign(cloneEnv, this.env);
            this.dialogEnv = cloneEnv;
        }
    }
    mounted(){
        let res = super.mounted();
        this.dialogClose.el.addEventListener('click', e=>{
            if (this.params.dialogCallback){
                this.params.dialogCallback(this.env);
            }
            this.destroy();
        })
        return res
    }
    innerTemplate = '';
    template = `
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
                    ${this.innerTemplate}
                </div>
                <div class="dialog-footer">
                
                </div>
            </div>
        </lbwt-dialog>
    `
}