import { BaseDialog } from "./dialog.js";

export class ErrorDialog extends BaseDialog{
    constructor(){
        super(...arguments);
    }
    mounted(){
        let res = super.mounted();
        this.dialogContent.el.innerHTML = `
            <div class="error-content">
                ${this.params.message}
            </div>
        `;
        return res;
    }
    
}