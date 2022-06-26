
class PinPopup extends Component {
    mainPopupRef = this.useRef("main-popup")
    dragElRef = this.useRef("drag-drop")
    removeRef = this.useRef("remove")
    pinHTML = this.useRef("pin-html")
    constructor() {
        super(...arguments);
        this.subEnv.pinToHTML = true;
    }
    loadUI() {
        this.component = new Home(this);
        this.component.mode = 'pinned';
        this.component.mount(this.mainPopupRef.el);
    }
    loadEvent() {
        let self = this;
        function onMounseDown(event) {
            let maxHeight = self.mainPopupRef.el.getBoundingClientRect().height;
            var rect = self.el.getBoundingClientRect();
            let startScroll = window.scrollY;
            let mouseX = event.pageX, mouseY = event.pageY;
            function mouseMoveEvent(event) {
                let margin = event.pageY - mouseY;
                let position = (rect.top + margin)
                if (position > -10) {
                    self.el.style.top = (position + startScroll - window.scrollY).toFixed(2) + "px";
                    self.el.style.left = (rect.left + event.pageX - mouseX).toFixed(2) + "px";
                } 
                let windowMarginHeight = window.innerHeight - position - 40;
                let height = (windowMarginHeight > maxHeight? maxHeight : windowMarginHeight)
                self.mainPopupRef.el.style.height = height + "px";
            }
            function mouseUpEvent(event) {
                window.removeEventListener("mousemove", mouseMoveEvent);
                window.removeEventListener("mouseup", mouseUpEvent);
            }
            window.addEventListener("mousemove", mouseMoveEvent)
            window.addEventListener("mouseup", mouseUpEvent)
        }
        this.dragElRef.el.addEventListener('mousedown', onMounseDown)
        this.removeRef.el.addEventListener('click', async event => {
            self.el.remove();
            self.instance = null;
            event.stopPropagation();
            if (chrome.runtime) {
                chrome.runtime.sendMessage({ closeAll: true });
            }
        })
        window.addEventListener('keydown', async event => {
            if (event.keycode === 68 && window.event.ctrlKey && window.event.altKey) {
                self.el.remove();
                self.instance = null;
                event.stopPropagation();
                if (chrome.runtime) {
                    chrome.runtime.sendMessage({ closeAll: true });
                }
            }
        })
        if (this.subEnv.pinHTML) {
            this.pinHTML.el.classList.add('pinned');
        }
        this.pinHTML.el.addEventListener('click', async event => {
            self.subEnv.pinHTML = true;
            if (chrome.runtime) {
                chrome.runtime.sendMessage({ pinHTML: true });
            }
            self.pinHTML.el.classList.add('pinned')
        })
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                if (request.ticketUpdate){
                    self.component.ticketUpdate(request.ticketUpdate);
                }
                if (request.relativeUpdate){
                    self.component.relativeActiveUpdate(request.relativeUpdate);
                }
                sendResponse({farewell: "done"});
            }
        );
    }
    mounted() {
        let res = super.mounted();
        this.loadUI();
        this.loadEvent();
        return res
    }
    template = `
        <div class="popup-container">
            <div >
                <div l-ref="drag-drop" class="drag-drop-header d-flex justify-content-between">
                    <div class="drag-drop-icon">
                        <span class="tm-icon-svg">
                            <svg class="svg-inline--fa fa-up-down-left-right" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="up-down-left-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M512 256c0 6.797-2.891 13.28-7.938 17.84l-80 72C419.6 349.9 413.8 352 408 352c-3.312 0-6.625-.6875-9.766-2.078C389.6 346.1 384 337.5 384 328V288h-96v96l40-.0013c9.484 0 18.06 5.578 21.92 14.23s2.25 18.78-4.078 25.83l-72 80C269.3 509.1 262.8 512 255.1 512s-13.28-2.89-17.84-7.937l-71.1-80c-6.328-7.047-7.938-17.17-4.078-25.83s12.44-14.23 21.92-14.23l39.1 .0013V288H128v40c0 9.484-5.578 18.06-14.23 21.92C110.6 351.3 107.3 352 104 352c-5.812 0-11.56-2.109-16.06-6.156l-80-72C2.891 269.3 0 262.8 0 256s2.891-13.28 7.938-17.84l80-72C95 159.8 105.1 158.3 113.8 162.1C122.4 165.9 128 174.5 128 184V224h95.1V128l-39.1-.0013c-9.484 0-18.06-5.578-21.92-14.23S159.8 94.99 166.2 87.94l71.1-80c9.125-10.09 26.56-10.09 35.69 0l72 80c6.328 7.047 7.938 17.17 4.078 25.83s-12.44 14.23-21.92 14.23l-40 .0013V224H384V184c0-9.484 5.578-18.06 14.23-21.92c8.656-3.812 18.77-2.266 25.83 4.078l80 72C509.1 242.7 512 249.2 512 256z"></path></svg>
                        </span>
                    </div>
                    <div class="drag-drop-icon pin-html" l-ref="pin-html">
                        <span class="tm-icon-svg">
                            <span class="tm-icon-svg">
                                <svg class="svg-inline--fa fa-arrows-rotate" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrows-rotate" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M464 16c-17.67 0-32 14.31-32 32v74.09C392.1 66.52 327.4 32 256 32C161.5 32 78.59 92.34 49.58 182.2c-5.438 16.81 3.797 34.88 20.61 40.28c16.89 5.5 34.88-3.812 40.3-20.59C130.9 138.5 189.4 96 256 96c50.5 0 96.26 24.55 124.4 64H336c-17.67 0-32 14.31-32 32s14.33 32 32 32h128c17.67 0 32-14.31 32-32V48C496 30.31 481.7 16 464 16zM441.8 289.6c-16.92-5.438-34.88 3.812-40.3 20.59C381.1 373.5 322.6 416 256 416c-50.5 0-96.25-24.55-124.4-64H176c17.67 0 32-14.31 32-32s-14.33-32-32-32h-128c-17.67 0-32 14.31-32 32v144c0 17.69 14.33 32 32 32s32-14.31 32-32v-74.09C119.9 445.5 184.6 480 255.1 480c94.45 0 177.4-60.34 206.4-150.2C467.9 313 458.6 294.1 441.8 289.6z"></path></svg>
                            </span>
                        </span>
                    </div>
                    <div class="tm-close" l-ref="remove">
                        <span class="tm-icon-svg">
                        <svg class="svg-inline--fa fa-circle-xmark" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle-xmark" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM175 208.1L222.1 255.1L175 303C165.7 312.4 165.7 327.6 175 336.1C184.4 346.3 199.6 346.3 208.1 336.1L255.1 289.9L303 336.1C312.4 346.3 327.6 346.3 336.1 336.1C346.3 327.6 346.3 312.4 336.1 303L289.9 255.1L336.1 208.1C346.3 199.6 346.3 184.4 336.1 175C327.6 165.7 312.4 165.7 303 175L255.1 222.1L208.1 175C199.6 165.7 184.4 165.7 175 175C165.7 184.4 165.7 199.6 175 208.1V208.1z"></path></svg>
                        </span>
                    </div>
                </div>
                <div class="t-popup-content" l-ref="main-popup">
                </div>
            </div>
        </div>
    `
}