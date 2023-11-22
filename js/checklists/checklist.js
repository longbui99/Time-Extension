
import * as util from "../utils/utils.js"
import { Component } from "../base.js"
export class CheckList extends Component {
    acSectionRef = this.useRef('tm-ac-section')
    acContainerRef = this.useRef("ac-content")
    toggleDoneRef = this.useRef('toggle-done')
    constructor() {
        super(...arguments);
        this.excludeDone = this.env.checklistData?.excludeDone || true;
    }

    makeChecklistComponent(_id, ac, content) {
        return `<div class="ac-container ${(ac.is_header ? 'header' : '')} ${(ac.initial ? 'initial' : '')}" checklistID="${ac.id}"  sequence=${ac.sequence} header=${ac.is_header}>
            <div class="ac-segment justify-content-between">
            ${(ac.initial ? '' : `<span class="drag-object"><span class="tm-icon-svg"><svg class="svg-inline--fa fa-sort drag-icon" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="sort" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M27.66 224h264.7c24.6 0 36.89-29.78 19.54-47.12l-132.3-136.8c-5.406-5.406-12.47-8.107-19.53-8.107c-7.055 0-14.09 2.701-19.45 8.107L8.119 176.9C-9.229 194.2 3.055 224 27.66 224zM292.3 288H27.66c-24.6 0-36.89 29.77-19.54 47.12l132.5 136.8C145.9 477.3 152.1 480 160 480c7.053 0 14.12-2.703 19.53-8.109l132.3-136.8C329.2 317.8 316.9 288 292.3 288z"></path></svg></span>
            </span>`)}
            <div class="tm-form-check">
                <input class="tm-form-check-input" type="checkbox" value="${ac.id}" id="${_id}" ${ac.checked ? 'checked' : ''}>
                <p class="tm-form-check-label" contenteditable="true">${content}</p>
                <span class="original-value" style="display:none">${content}</span>
                </div>
            </div>
        </div>`
    }
    insertCheckGroup(payload) {
        let newChecklist = ""
        if (!payload.params.id) {
            newChecklist = new DOMParser().parseFromString(this.makeChecklistComponent('', payload.params, ''), 'text/html').body.firstChild;
        } else {
            newChecklist = this.acContainerRef.el.querySelector(`[checklistID="${payload.params.id}"`);
        }
        if (payload.previous) {
            let element = this.acContainerRef.el.querySelector(`[sequence="${payload.previous}"`);
            if (element) {
                this.acContainerRef.el.insertBefore(newChecklist, element.nextElementSibling);
            }
        }
        else if (payload.after) {
            let element = this.acContainerRef.el.querySelector(`[sequence="${payload.after}"`);
            if (element) {
                this.acContainerRef.el.insertBefore(newChecklist, element);
            }
        }
        if (!payload.params.id) {
            this.initEditChecklistEvent(newChecklist, payload.params)
        }
    }
    checkListChanged(params, previousID, afterID) {
        let data = {
            'params': params,
            'previous': previousID,
            'after': afterID
        }
        this.triggerUp('checklist-changed', data)
    }
    async pushChecklist(el, params, parent, force = false) {
        if (force || parent.getAttribute('force') === 'true' || (el.innerText !== "" && el.innerHTML.trim() !== el.nextElementSibling.innerHTML.trim())) {
            let payload = {};
            let element = parent.querySelector('.tm-form-check-label');
            payload.checked = element.previousElementSibling.checked || false;
            payload.name = el.innerHTML;
            payload.is_header = parent.getAttribute('header') == "true";
            payload.sequence = parseInt(parent.previousElementSibling?.getAttribute("sequence")) || 0;
            payload.float_sequence = 1;
            payload.task_id = this.env.taskData.id;
            params.id = parseInt(element.previousElementSibling.value) || 0
            params.payload = payload
            let res = (await this.do_invisible_request('POST', `${this.env.serverURL}/management/ac`, params));
            let result = (await res.json());
            element.previousElementSibling.value = result;
            parent.classList.remove("unsaved");
            el.nextElementSibling.innerHTML = el.innerHTML.trim();
            parent.setAttribute('force', 'false')
            element._checkListData = params;
        }

        // this.checkListChanged(params, parent.previousElementSibling?.getAttribute('sequence'), parent.nextElementSibling?.getAttribute('sequence'))
    }
    initEditChecklistEvent(element, params) {
        let self = this;
        let baseParent = element;
        element._checkListData = params;
        while (!baseParent.classList.contains('ac-container')) baseParent = baseParent.parentNode;
        function resetSequence() {
            for (let index = 0; index < baseParent.parentNode.childNodes.length; index++) {
                baseParent.parentNode.childNodes[index].setAttribute("sequence", index)
            }
        }
        element.previousElementSibling.addEventListener('change', event => {
            self.pushChecklist(element, params, baseParent, true)
            if (element.previousElementSibling.checked && self.env.checklistData.excludeDone){
                baseParent.remove()
            }
        })
        element.addEventListener('click', (event) => {
            if (element != window.selectedElement
                && (element.innerText !== "" && element.innerHTML.trim() !== element.nextElementSibling.innerHTML.trim())
            ) {
                let clickedElement = self.acContainerRef.el.querySelector('.editing');
                clickedElement?.classList.remove('editing');
                element.classList.add('editing');
                if (window.selectedElement) {
                    let basePushElement = window.selectedElement;
                    while (!basePushElement.classList.contains('ac-container')) basePushElement = basePushElement.parentNode;
                    self.pushChecklist(window.selectedElement, params, basePushElement)
                }
                window.selectedElement = element;
            }
            event.stopPropagation();
        })
        element.addEventListener('keydown', (event) => {
            if ((event.keyCode === 8 && window.event.ctrlKey) && !baseParent.classList.contains('initial')) {
                (baseParent.previousElementSibling || baseParent.nextElementSibling).querySelector('.tm-form-check-label').focus();
                let el = (baseParent.previousElementSibling || baseParent.nextElementSibling).querySelector('.tm-form-check-label')
                el.focus();
                window.selectedElement = el;
                baseParent.remove();
                if (parseInt(element.previousElementSibling.value)) {
                    self.do_invisible_request('POST', `${self.env.serverURL}/management/ac/delete`, { acID: parseInt(element.previousElementSibling.value), jwt: self.env.jwt })
                }
            }
            else if (event.keyCode === 13 && !window.event.shiftKey) {
                element.classList.remove('editing');
                let data = {
                    'is_header': (baseParent.getAttribute('header') === "true")
                }
                let fromInitial = baseParent.classList.contains('initial');
                let sequencePivot = (fromInitial ? baseParent.previousElementSibling : baseParent)
                data.sequence = (parseInt(sequencePivot?.getAttribute("sequence")) + 1) || 0;
                let newChecklist = new DOMParser().parseFromString(self.makeChecklistComponent('', data, ''), 'text/html').body.firstChild;
                newChecklist.classList.add("unsaved");
                let content = ""
                if (fromInitial) {
                    baseParent.parentNode.insertBefore(newChecklist, baseParent);
                    content = element.innerHTML;
                    setTimeout(() => {
                        element.innerHTML = ""
                    }, 1)
                    element.focus();
                    element.classList.add('editing');
                    let HandlingElement = baseParent.previousElementSibling;
                    self.pushChecklist(element, params, HandlingElement);
                    resetSequence();
                } else {
                    if (!window.event.ctrlKey) {
                        baseParent.parentNode.insertBefore(newChecklist, baseParent.nextSibling);
                        newChecklist.querySelector('.tm-form-check-label').focus();
                        newChecklist.querySelector('.tm-form-check-label').classList.add('editing');
                        window.selectedElement = newChecklist.querySelector('.tm-form-check-label');
                    }
                    self.pushChecklist(element, params, baseParent);
                    resetSequence();
                }
                if (!window.event.ctrlKey || baseParent.classList.contains('initial')) {
                    self.initEditChecklistEvent(newChecklist.querySelector('.tm-form-check-label'), params);
                    setTimeout(() => {
                        newChecklist.querySelector('.tm-form-check-label').innerHTML = content;
                        while (newChecklist.nextElementSibling) {
                            newChecklist = newChecklist.nextElementSibling;
                            newChecklist.setAttribute("sequence", parseInt(newChecklist.getAttribute("sequence")) + 1)
                        }
                    }, 1)
                }
                event.stopPropagation();
            }
            else if (window.event.ctrlKey && event.keyCode === 191) {
                let isHeader = !(baseParent.getAttribute("header", false) == "true");
                baseParent.setAttribute("header", isHeader);
                baseParent.classList.remove('header');
                baseParent.setAttribute('force', 'true');
                isHeader && baseParent.classList.add(isHeader ? 'header' : 'base');
            }
            else if (event.keyCode === 38) {
                let el = baseParent.previousElementSibling?.querySelector('.tm-form-check-label');
                window.selectedElement = el;
                if (!parseInt(element.previousElementSibling.value)) {
                    self.pushChecklist(element, params, baseParent);
                }
                if (el) {
                    el.click();
                    el.focus();
                }
                event.stopPropagation();
            }
            else if (event.keyCode === 40) {
                let el = baseParent.nextElementSibling?.querySelector('.tm-form-check-label');
                window.selectedElement = el;
                if (!parseInt(element.previousElementSibling.value)) {
                    self.pushChecklist(element, params, baseParent);
                }
                if (el) {
                    el.click();
                    el.focus();
                }
                event.stopPropagation();
            }
            // else if (event.ctrlKey && [66,73,85].includes(event.keyCode)){
            //     element.innerHTML = element.innerHTML.replaceAll('')
            // }
            event.stopImmediatePropagation();
        })
        element.addEventListener('keyup', (event) => {
            if ((element.innerHTML.trim() != element.nextElementSibling.innerHTML.trim()) || baseParent.getAttribute('force') === 'true') {
                baseParent.classList.add("unsaved");
            } else {
                baseParent.classList.remove("unsaved");
            }
            event.stopImmediatePropagation();
        })
        function recursiveRemoveAttribute(element, isRoot = false) {
            if (!isRoot) {
                let isBold = element.style.fontWeight;
                if (isBold == "bold" || parseInt(isBold) > 600) {
                    let p = document.createElement('p');
                    p.innerHTML = element.innerHTML;
                    element.parentNode.insertBefore(p, element);
                    element.remove()
                    element = p;
                }
                while (element.attributes?.length > 0) {
                    element.removeAttribute(element.attributes[0].name)
                };
            }
            for (let node of element.children) {
                recursiveRemoveAttribute(node)
            }
        }
        element.addEventListener("paste", event => {
            setTimeout(() => {
                recursiveRemoveAttribute(element, true)
            }, 1);
            event.stopImmediatePropagation();
        })
    }

    initDragEvent(parentElement, element, event) {
        let acElement = element, self = this;
        while (!acElement.classList.contains('ac-container')) acElement = acElement.parentNode;
        let clonedElement = acElement.cloneNode();
        // Get boundary
        var rect = acElement.getBoundingClientRect();
        // Set drag element object
        acElement.classList.add('dragging')
        // acElement.style.top = rect.top.toFixed(2) + "px";
        // acElement.style.left = rect.left.toFixed(2) + "px";
        // acElement.style.height = rect.height.toFixed(2) + "px";
        acElement.style.maxWidth = rect.width + "px";
        // Clone the object and set it to base parent
        clonedElement.style.height = (rect.height - 12) + "px";
        clonedElement.style.width = (rect.width - 12) + "px";
        clonedElement.classList.add('clone-drag')
        parentElement.insertBefore(clonedElement, acElement);
        // Move element with the position of mouse
        let mouseX = event.pageX, mouseY = event.pageY;
        // Fetch all visible tags
        function getBoundary(element, res) {
            let boundary = element.getBoundingClientRect();
            res.center = boundary.top + boundary.height / 2;
            res.top = boundary.top;
            res.bottom = boundary.bottom;
            res.height = boundary.height;
        }
        let clientTags = [], currentPosition = -1, index = 0;
        for (let el of acElement.parentNode.childNodes) {
            if (el != acElement) {
                let res = { el: el }
                clientTags.push(res);
                getBoundary(el, res);
                if (el == clonedElement) {
                    currentPosition = index;
                }
            }
            index++
        }
        clientTags.pop();
        let startScroll = window.scrollY;
        function swap(i, j) {
            let res1 = clientTags[i], res2 = clientTags[j], t = res1.el;
            if (i > j) {
                res2.el.parentNode.insertBefore(res1.el, res2.el);
            } else {
                res2.el.parentNode.insertBefore(res1.el, res2.el.nextElementSibling);
            }
            let padding = res2.height - res1.height;
            clientTags[j].top += padding;
            clientTags[j].center += padding;
            clientTags[j].bottom += padding;
            clientTags[i].el = res2.el;
            clientTags[j].el = t;
        }
        let areaRect = {
            'top': clientTags[0].top,
            'bottom': clientTags[clientTags.length - 1].bottom,
        }
        function mouseMoveEvent(event) {
            if (event.pageY >= areaRect.top) {
                let position = (rect.top + event.pageY - mouseY)
                acElement.style.top = (position + startScroll - window.scrollY).toFixed(2) + "px";
                acElement.style.left = (rect.left + event.pageX - mouseX).toFixed(2) + "px";
                if (currentPosition > 0 && position < clientTags[currentPosition - 1].center && (position < clientTags[currentPosition].center)) {
                    swap(currentPosition, currentPosition - 1)
                    currentPosition--;
                } else
                    if (currentPosition < clientTags.length - 1 && position > clientTags[currentPosition + 1].top && position > clientTags[currentPosition].top) {
                        swap(currentPosition, currentPosition + 1)
                        currentPosition++;
                    }
            }
        }
        function mouseUpEvent(event) {
            window.removeEventListener("mousemove", mouseMoveEvent);
            window.removeEventListener("mouseup", mouseUpEvent);
            acElement.classList.remove("dragging");
            acElement.parentNode.insertBefore(acElement, clientTags[currentPosition].el);
            clientTags[currentPosition].el.remove();
            clientTags[currentPosition].el = acElement;
            let params = {
                "id": self.env.taskData.id,
                "jwt": self.env.jwt
            }
            let payload = {};
            payload.sequence = parseInt(clientTags[currentPosition - 1]?.el.getAttribute("sequence")) || -1;
            payload.float_sequence = 1;
            params.id = parseInt(acElement.querySelector('.tm-form-check-input').value) || 0
            params.payload = payload
            self.do_invisible_request('POST', `${self.env.serverURL}/management/ac?`, params);
            for (let index = 0; index < clientTags.length; index++) {
                clientTags[index].el.setAttribute("sequence", index)
            }
        }
        window.addEventListener("mousemove", mouseMoveEvent)
        window.addEventListener("mouseup", mouseUpEvent)
    }
    initDragEventRoot(element, event) {
        element.removeEventListener("mousedown", self.initDragEventRoot);
        this.initDragEvent(element, event.srcElement, event)
    }
    async getChecklistData(params){
        let result = [];
        if (this.env.taskData.broardcast && this.env.taskData.acs) {
            result = this.env.taskData.acs;
        } else {
            if (this.env.contentState.showLog) {
                result = (await this.do_invisible_request('GET', `${this.env.serverURL}/management/task/ac?${new URLSearchParams(params)}`));
            } else {
                result = (await this.do_invisible_request('GET', `${this.env.serverURL}/management/task/ac?${new URLSearchParams(params)}`));
            }
            result = (await result.json())
            this.env.taskData.acs = result;
        }
        let default_data = {
            'id': false,
            'content': '',
            'is_header': true,
            'initial': true,
        }
        result.push(default_data)
        this.result = result;
        return result
    }
    excludeDoneFilter(result){
        let res = [];
        for (let record of result){
            if (record.initial){
                res.push(record)
            } else
            if (!record.checked){
                res.push(record)
            } else 
            if (record.is_header){
                res.push(record)
            }
        }
        return res
    }
    renderCheclistData(result, params){
        if (this.env.checklistData.excludeDone){
            result = this.excludeDoneFilter(result)
        }
        let element = this.acContainerRef.el, self = this;
        element.innerHTML = "";
        let string = ""
        for (let ac of result) {
            let _id = util.uniqueID(ac.id)
            let parsedData = util.parseChecklist(ac.content)
            string += this.makeChecklistComponent(_id, ac, parsedData)
        }
        element.innerHTML = string
        for (let ac of element.querySelectorAll('.tm-form-check-label')) {
            this.initEditChecklistEvent(ac, params)
        }
        window.addEventListener('click', event => {
            let selectedElement = element.querySelector('.editing')
            if (selectedElement) {
                selectedElement.classList.remove('editing');
                let baseParent = selectedElement
                while (!baseParent.classList.contains('ac-container')) baseParent = baseParent.parentNode;
                self.pushChecklist(selectedElement, params, baseParent)
            }
        })
        element.addEventListener('mousedown', event => {
            if (event.srcElement.classList.contains('drag-object') ||
                event.srcElement.classList.contains('drag-icon') ||
                event.srcElement.nodeName === "path") {
                this.initDragEventRoot(element, event)
                event.stopImmediatePropagation();
            }
        })
    }
    async initChecklists() {
        if (this.env.taskData) {
            let payload = {
                'source': 'Extension'
            }
            let params = {
                "id": this.env.taskData.id,
                "jwt": this.env.jwt,
                "payload": payload
            }
            this.params = params;
            let result = await this.getChecklistData(params);
            this.renderCheclistData(result, params);
        }
    }
    toggleDone(){
        this.env.checklistData.excludeDone = !this.env.checklistData.excludeDone;
        this.update('checklistData', this.env.checklistData);
        this.initChecklists()
    }
    mounted() {
        let self = this;
        let res = super.mounted();
        if (this.env.checklistData?.excludeDone){
            this.toggleDoneRef.el.setAttribute("checked", "checked");
        }
        this.toggleDoneRef.el.addEventListener('click', self.toggleDone.bind(self))
        return new Promise(async (resolve, reject) => {
            await this.initChecklists();
            resolve(true)
        });
        return res
    }
    getTemplate() {
        return `
        <div class="acceptance-criteria" l-ref="tm-ac-section">
            <div class="space-segment">
                    <div class="checklist-segment">
                    <div class="ac-tools">
                        <div class="toggle-done">
                            <span>Done</span>
                            <input type="checkbox" class="tm-form-check-input" l-ref="toggle-done"/>
                        </div>
                    </div>
                    <div l-ref="ac-content" class="ac-content">
                        
                    </div>
                </div>
            </div>
        </div>
    `
    }
}