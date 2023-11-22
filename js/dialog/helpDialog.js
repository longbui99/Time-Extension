import { BaseDialog } from "./dialog.js";

export class helpDialog extends BaseDialog{
    constructor(){
        super(...arguments);
        this.env.taskData = this.params.taskData;
    }
    renderDialogContent(){
        this.innerTemplate = `
            <div class="dialog-task-content help-dialog" l-ref="dialog-content">
                <div style="flex-flow:column;">
                    <span class="segment-title" style="font-size:15px;margin-bottom:5px"><b>Search Parser</b></span>
                    <span style="flex-flow:column; margin-left:10px">
                        <span><b>[PROJECT]</b>: To search project key is PROJECT or project name spanke PROJECT</span>
                        <span><b>PRO</b>: At least three upper character in a row to search project key</span>
                        <span><b>[PRO-123]</b>: TO search by task key</span>
                        <span><b>PRO-123</b>: At least three upper character in a row connect to number by '-' to search task key</span>
                        <span><b>mine</b>: To search assigned task to current user</span>
                        <span><b>>username</b>: search tasks assign to username or test by username</span>
                        <span><b>p{date}</b>: To search personal task by date, example: p12-22-2022</span>
                        <span><b>today</b>: To search personal task today</span>
                        <span><b>tomorrow</b>: To search personal task tomorrow</span>
                        <span>Others: To search by task title</span>
                    </span>
                    <span class="segment-title" style="font-size:15px;margin-bottom:5px"><b>Keyboard Shortcut</b></span>
                    <span style="flex-flow:column; margin-left:10px">
                        <span><b>Shift + Space</b>: To open daily tasks</span>
                    </span>
                </div>

            </div>
        `;
        this.innerFooter = `
            <button type="button" class="btn btn-start" l-ref="button-confirm">DONE</button>
        `
    }
    
}