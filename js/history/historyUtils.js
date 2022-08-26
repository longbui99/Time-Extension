import { secondToHour } from "../utils/utils.js";
export function getLogDataGroup(target) {
    let parentNode = target.parentNode;
    let group = parentNode.getAttribute('data-group');
    let id = parseInt(parentNode.getAttribute('data-id'));
    let index = this.env.historyByDate[group].values.findIndex(e => e.id === id)
    if (index !== -1) {
        return this.env.historyByDate[group].values[index];
    }
    return {};
}
export function exportLogData(target) {
    let data = getLogDataGroup.bind(this)(target);
    let parentNode = target.parentNode;
    return {
        id: data.id,
        time: parentNode.querySelector('.log-duration').value,
        description: parentNode.querySelector('.log-description').value,
        jwt: this.env.jwt
    }
}
export function deleteLogData(target) {
    let data = getLogDataGroup.bind(this)(target)
    let values = exportLogData.bind(this)(target);
    this.do_invisible_request('POST', `${this.env.serverURL}/management/issue/work-log/delete/${values.id}`, values);
    let group = target.parentNode.getAttribute('data-group');
    this.env.historyByDate[group].totalDuration -= data.duration;
    target.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('.total-duration').innerHTML = secondToHour(this.env.historyByDate[group].totalDuration);
    target.parentNode.remove();
    this.env.globalTotal -= data.duration;
    if (values.exported) {
        this.env.exportedTotal -= data.duration;
    }
    this.env.update('setGlobalData', null)
}
export async function exportLog(exportIds) {
    let res = {
        exportIds: exportIds,
        jwt: this.env.jwt
    };
    return this.do_request('POST', `${this.env.serverURL}/management/issue/work-log/export`, res);
}