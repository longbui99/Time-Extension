import { BaseDialog } from "./dialog.js";

export class ErrorDialog extends BaseDialog{
    constructor(){
        super(...arguments);
    }
    renderDialogContent(){
        this.innerTemplate = `
            <div class="error-content">
                ${this.params.message}
            </div>
        `;
    }
    
}