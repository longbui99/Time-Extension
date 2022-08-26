import { Component } from "../base.js";

export class BaseDialog extends Component{
    constructor(){
        super(...arguments);
        let cloneEnv = {};
        Object.assign(cloneEnv, this.env);
        this.originEnv = this.env;
        this.env = cloneEnv;
    }
    innerTemplate = '';
    template = `
        <lbwt-dialog>
            <div class="dialog-header">
            
            </div>
            <div class="dialog-content">
                ${this.innerTemplate}
            </div>
            <div class="dialog-footer">
            
            </div>
        </lbwt-dialog>
    `
}