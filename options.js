// Options page script
const baseUrlInput = document.getElementById('baseUrl');
const recordHoverCheckbox = document.getElementById('recordHover');
const recordKeyPressCheckbox = document.getElementById('recordKeyPress');
const recordContextMenuCheckbox = document.getElementById('recordContextMenu');
const selectorTypeSelect = document.getElementById('selectorType');
const exportFormatSelect = document.getElementById('exportFormat');
const includeWaitsCheckbox = document.getElementById('includeWaits');
const saveBtn = document.getElementById('saveBtn');
const saveStatus = document.getElementById('saveStatus');

// Load saved options
document.addEventListener('DOMContentLoaded', loadOptions);

// Save options
saveBtn.addEventListener('click', saveOptions);

function loadOptions() {
  chrome.storage.local.get({
    baseUrl: '',
    recordHover: false,
    recordKeyPress: false,
    recordContextMenu: true,
    selectorType: 'auto',
    exportFormat: 'selenium',
    includeWaits: true
  }, (items) => {
    baseUrlInput.value = items.baseUrl;
    recordHoverCheckbox.checked = items.recordHover;
    recordKeyPressCheckbox.checked = items.recordKeyPress;
    recordContextMenuCheckbox.checked = items.recordContextMenu;
    selectorTypeSelect.value = items.selectorType;
    exportFormatSelect.value = items.exportFormat;
    includeWaitsCheckbox.checked = items.includeWaits;
  });
}

function saveOptions() {
  const options = {
    baseUrl: baseUrlInput.value,
    recordHover: recordHoverCheckbox.checked,
    recordKeyPress: recordKeyPressCheckbox.checked,
    recordContextMenu: recordContextMenuCheckbox.checked,
    selectorType: selectorTypeSelect.value,
    exportFormat: exportFormatSelect.value,
    includeWaits: includeWaitsCheckbox.checked
  };
  
  chrome.storage.local.set(options, () => {
    // Show success message
    saveStatus.textContent = '✓ Settings saved successfully!';
    saveStatus.className = 'save-status success';
    
    setTimeout(() => {
      saveStatus.style.display = 'none';
    }, 3000);
  });
}
