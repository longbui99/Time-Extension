
const CSSFILE = [
  'libs/datepicker.css',
  'css/pin.css',
  'css/index.css',
]
const JSFILE = [
  'libs/datepicker.js',
  'js/utils.js',
  'js/api.js',
  'js/base.js',
  'js/login.js',
  'js/main.js',
  'js/home.js',
  'js/embedded.js',
]

function removeExistedElement() {
  document.querySelector('.popup-container').remove();
  return true;
}

async function checkExistedElement() {
  let element = await document.querySelector('.popup-container');
  let condition = { el: element === null, func: typeof (PinPopup) === "undefined" }
  return condition
}
async function injectFile(params) {
  params.extensionID = chrome.runtime.id;
  function injectFunction(pr) {
    mount(PinPopup, document.body, pr);
    document.body.click();
  }
  let [tab] = await chrome.tabs.query({ active: !0, currentWindow: !0 });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: checkExistedElement,
  }, async res => {
    if (res) {
      if (res[0].result.func) {
        chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: CSSFILE,
        })
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: JSFILE,
        }, e => {
          if (res[0].result.el) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              function: injectFunction,
              args: [params]
            })
          }
        })
      }
      else if (res[0].result.el) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: injectFunction,
          args: [params]
        })
        let data = (await chrome.storage.local.get(["timeLogStorage"]))?.timeLogStorage
        data.statisPinned = true;
        chrome.storage.local.set({ 'timeLogStorage': data })
      }
    }
  }
  )
}

chrome.runtime.onMessage.addListener(
  async function (request, sender, sendResponse) {
    if (request.subEnv) {
      chrome.storage.local.set({ "timeLogStorage": request.subEnv })
    }
    if (request.pinHTML) {
      let data = (await chrome.storage.local.get(["timeLogStorage"]))?.timeLogStorage
      data.pinHTML = true;
      chrome.storage.local.set({ 'timeLogStorage': data })
    }
    if (request.closeAll) {
      let data = (await chrome.storage.local.get(["timeLogStorage"]))?.timeLogStorage
      data.pinHTML = false;
      chrome.storage.local.set({ 'timeLogStorage': data })
      chrome.tabs.query({ currentWindow: true }, function (tabs) {
        for (let tab of tabs) {
          if (tab.id === sender.tab.id && tab.url.startsWith('http'))
            continue;
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: removeExistedElement,
          }, function (response) {
            if (response && response[0].result === undefined) {
              setTimeout(async () => {
                chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  function: removeExistedElement,
                })
              }, 500)
            }
          })
        }
      });
    }
    if (request.ticketUpdate || request.relativeUpdate) {
      function sendMEssage(tab){
        chrome.tabs.sendMessage(tab.id, request, function (response) {
          if (response === undefined) {
            setTimeout(async () => {
              chrome.tabs.sendMessage(tab.id, request)
            }, 500)
          }
        });
      }
      chrome.tabs.query({ currentWindow: true }, async function (tabs) {
        if (tabs.length === 0){
          tabs = await chrome.tabs.query({ currentWindow: true });
        }
        for (let tab of tabs) {
          if (tab.id === sender.tab?.id && tab.url?.startsWith('http'))
            continue;
          sendMEssage(tab)
        }
      });
    }
  }
);

chrome.tabs.onActivated.addListener(async function (activeInfo) {
  let subEnv = (await chrome.storage.local.get(["timeLogStorage"]))?.timeLogStorage;
  if (subEnv.pinHTML) {
    injectFile({ subEnv: subEnv })
  }
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (tab.url.startsWith('http')) {
    let subEnv = (await chrome.storage.local.get(["timeLogStorage"]))?.timeLogStorage;
    if (changeInfo.status == 'complete') {
      if (subEnv.pinHTML) {
        injectFile({ subEnv: subEnv })
      }
    }
  }
});
