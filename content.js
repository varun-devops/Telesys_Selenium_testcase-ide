// Content script for capturing user interactions
let isRecording = false;
let lastMouseOverElement = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startRecording') {
    isRecording = true;
    attachEventListeners();
    console.log('Content script: Recording started');
    sendResponse({ success: true });
  } else if (request.action === 'stopRecording') {
    isRecording = false;
    removeEventListeners();
    console.log('Content script: Recording stopped');
    sendResponse({ success: true });
  }
  return true;
});

// Event listeners
const eventListeners = {
  click: handleClick,
  change: handleChange,
  submit: handleSubmit,
  keydown: handleKeydown,
  mouseover: handleMouseOver,
  dblclick: handleDoubleClick,
  contextmenu: handleContextMenu
};

function attachEventListeners() {
  for (const [event, handler] of Object.entries(eventListeners)) {
    document.addEventListener(event, handler, true);
  }
}

function removeEventListeners() {
  for (const [event, handler] of Object.entries(eventListeners)) {
    document.removeEventListener(event, handler, true);
  }
}

function handleClick(event) {
  if (!isRecording) return;
  
  const element = event.target;
  const selector = getSelector(element);
  const tagName = element.tagName.toLowerCase();
  
  let command = 'click';
  let value = '';
  
  // Special handling for links
  if (tagName === 'a') {
    command = 'clickLink';
    value = element.href;
  }
  
  recordEvent({
    command: command,
    target: selector,
    value: value,
    description: `Click on ${getElementDescription(element)}`
  });
}

function handleDoubleClick(event) {
  if (!isRecording) return;
  
  const element = event.target;
  const selector = getSelector(element);
  
  recordEvent({
    command: 'doubleClick',
    target: selector,
    value: '',
    description: `Double click on ${getElementDescription(element)}`
  });
}

function handleChange(event) {
  if (!isRecording) return;
  
  const element = event.target;
  const selector = getSelector(element);
  const tagName = element.tagName.toLowerCase();
  
  let command = 'type';
  let value = element.value;
  
  if (tagName === 'select') {
    command = 'select';
    value = element.options[element.selectedIndex].text;
  } else if (element.type === 'checkbox' || element.type === 'radio') {
    command = element.checked ? 'check' : 'uncheck';
    value = element.value;
  }
  
  recordEvent({
    command: command,
    target: selector,
    value: value,
    description: `${command} on ${getElementDescription(element)}`
  });
}

function handleSubmit(event) {
  if (!isRecording) return;
  
  const element = event.target;
  const selector = getSelector(element);
  
  recordEvent({
    command: 'submit',
    target: selector,
    value: '',
    description: `Submit form ${getElementDescription(element)}`
  });
}

function handleKeydown(event) {
  if (!isRecording) return;
  
  // Record special keys
  if (event.key === 'Enter' && event.target.tagName.toLowerCase() === 'input') {
    const element = event.target;
    const selector = getSelector(element);
    
    recordEvent({
      command: 'sendKeys',
      target: selector,
      value: '${KEY_ENTER}',
      description: `Press Enter in ${getElementDescription(element)}`
    });
  }
}

function handleMouseOver(event) {
  if (!isRecording) return;
  lastMouseOverElement = event.target;
}

function handleContextMenu(event) {
  if (!isRecording) return;
  
  const element = event.target;
  const selector = getSelector(element);
  
  recordEvent({
    command: 'contextMenu',
    target: selector,
    value: '',
    description: `Right click on ${getElementDescription(element)}`
  });
}

// Helper function to generate CSS selector
function getSelector(element) {
  // Priority: id > name > data-testid > unique class > xpath
  
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.name) {
    return `[name="${element.name}"]`;
  }
  
  if (element.getAttribute('data-testid')) {
    return `[data-testid="${element.getAttribute('data-testid')}"]`;
  }
  
  if (element.getAttribute('data-test')) {
    return `[data-test="${element.getAttribute('data-test')}"]`;
  }
  
  // Try to build a unique class selector
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/);
    if (classes.length > 0 && classes[0]) {
      const classSelector = `${element.tagName.toLowerCase()}.${classes[0]}`;
      if (document.querySelectorAll(classSelector).length === 1) {
        return classSelector;
      }
    }
  }
  
  // Try link text for anchors
  if (element.tagName.toLowerCase() === 'a' && element.textContent.trim()) {
    return `link=${element.textContent.trim()}`;
  }
  
  // Fall back to XPath
  return getXPath(element);
}

function getXPath(element) {
  if (element.id !== '') {
    return `//*[@id="${element.id}"]`;
  }
  
  if (element === document.body) {
    return '/html/body';
  }
  
  let ix = 0;
  const siblings = element.parentNode ? element.parentNode.childNodes : [];
  
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
    }
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
}

function getElementDescription(element) {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const text = element.textContent ? element.textContent.trim().substring(0, 30) : '';
  
  if (id) return `${tag}${id}`;
  if (text) return `${tag} "${text}"`;
  return tag;
}

function recordEvent(step) {
  chrome.runtime.sendMessage({
    action: 'recordStep',
    step: step
  }).catch(err => console.error('Error recording step:', err));
}

// Initialize: check if recording is already active
chrome.storage.local.get(['isRecording'], (result) => {
  if (result.isRecording) {
    isRecording = true;
    attachEventListeners();
  }
});
