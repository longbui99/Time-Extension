import { BaseDialog } from "./dialog.js";

export class helpDialog extends BaseDialog{
    constructor(){
        super(...arguments);
        this.env.issueData = this.params.issueData;
    }
    renderDialogContent(){
        this.innerTemplate = `
            <div class="dialog-issue-content help-dialog" l-ref="dialog-content">
                <div style="flex-flow:column;">
                    <span class="segment-title" style="font-size:15px;margin-bottom:5px"><b>Search Parser</b></span>
                    <span style="flex-flow:column; margin-left:10px">
                        <span><b>[PROJECT]</b>: To search project key is PROJECT or project name spanke PROJECT</span>
                        <span><b>PRO</b>: At least three upper character in a row to search project key</span>
                        <span><b>[PRO-123]</b>: TO search by issue key</span>
                        <span><b>PRO-123</b>: At least three upper character in a row connect to number by '-' to search issue key</span>
                        <span><b>mine</b>: To search assigned issue to current user</span>
                        <span><b>>username</b>: search issues assign to username or test by username</span>
                        <span><b>p{date}</b>: To search personal issue by date, example: p12-22-2022</span>
                        <span><b>today</b>: To search personal issue today</span>
                        <span><b>tomorrow</b>: To search personal issue tomorrow</span>
                        <span>Others: To search by issue title</span>
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