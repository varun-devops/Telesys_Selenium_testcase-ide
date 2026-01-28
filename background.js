// Background script for managing recording state and test cases
let isRecording = false;
let testSteps = [];
let currentTabId = null;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Selenium Test Recorder installed');
  chrome.storage.local.set({ 
    isRecording: false, 
    testSteps: [],
    baseUrl: ''
  });
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'startRecording':
      startRecording(request.tabId);
      sendResponse({ success: true });
      break;
    
    case 'stopRecording':
      stopRecording();
      sendResponse({ success: true });
      break;
    
    case 'getRecordingState':
      sendResponse({ 
        isRecording: isRecording,
        testSteps: testSteps,
        tabId: currentTabId
      });
      break;
    
    case 'clearSteps':
      testSteps = [];
      chrome.storage.local.set({ testSteps: [] });
      sendResponse({ success: true });
      break;
    
    case 'recordStep':
      if (isRecording && sender.tab && sender.tab.id === currentTabId) {
        recordStep(request.step);
        sendResponse({ success: true });
      }
      break;
    
    case 'getTestSteps':
      sendResponse({ testSteps: testSteps });
      break;
    
    default:
      sendResponse({ error: 'Unknown action' });
  }
  return true;
});

function startRecording(tabId) {
  isRecording = true;
  currentTabId = tabId;
  testSteps = [];
  
  chrome.storage.local.set({ 
    isRecording: true, 
    testSteps: [],
    currentTabId: tabId
  });
  
  // Inject content script to start listening
  chrome.tabs.sendMessage(tabId, { action: 'startRecording' });
  
  console.log('Recording started on tab:', tabId);
}

function stopRecording() {
  isRecording = false;
  
  if (currentTabId) {
    chrome.tabs.sendMessage(currentTabId, { action: 'stopRecording' })
      .catch(err => console.log('Tab may be closed:', err));
  }
  
  chrome.storage.local.set({ 
    isRecording: false,
    testSteps: testSteps
  });
  
  console.log('Recording stopped. Total steps:', testSteps.length);
}

function recordStep(step) {
  const timestamp = new Date().toISOString();
  const stepWithTime = { ...step, timestamp };
  
  testSteps.push(stepWithTime);
  
  // Save to storage
  chrome.storage.local.set({ testSteps: testSteps });
  
  // Notify popup if it's open
  chrome.runtime.sendMessage({ 
    action: 'stepRecorded', 
    step: stepWithTime 
  }).catch(() => {
    // Popup might not be open, that's okay
  });
  
  console.log('Step recorded:', stepWithTime);
}

// Listen for tab updates to record navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (isRecording && tabId === currentTabId && changeInfo.url) {
    recordStep({
      command: 'navigate',
      target: changeInfo.url,
      value: '',
      description: `Navigate to ${changeInfo.url}`
    });
  }
});
