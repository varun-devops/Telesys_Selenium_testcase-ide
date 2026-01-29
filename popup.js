// Popup script for controlling the recorder
let isRecording = false;
let testSteps = [];

// DOM elements
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const statusText = document.getElementById('statusText');
const stepCount = document.getElementById('stepCount');
const stepsList = document.getElementById('stepsList');
const testNameInput = document.getElementById('testName');
const testDescriptionInput = document.getElementById('testDescription');
const exportExcel = document.getElementById('exportExcel');
const exportCSV = document.getElementById('exportCSV');
const exportSelenium = document.getElementById('exportSelenium');
const exportWebDriver = document.getElementById('exportWebDriver');
const exportJSON = document.getElementById('exportJSON');

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadRecordingState();
  
  recordBtn.addEventListener('click', startRecording);
  stopBtn.addEventListener('click', stopRecording);
  clearBtn.addEventListener('click', clearSteps);
  exportExcel.addEventListener('click', () => exportToExcel());
  exportCSV.addEventListener('click', () => exportToCSV());
  exportSelenium.addEventListener('click', () => exportTest('selenium'));
  exportWebDriver.addEventListener('click', () => exportTest('webdriver'));
  exportJSON.addEventListener('click', () => exportTest('json'));
});

// Listen for step updates from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'stepRecorded') {
    testSteps.push(request.step);
    updateUI();
  }
});

async function loadRecordingState() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getRecordingState' });
    isRecording = response.isRecording;
    testSteps = response.testSteps || [];
    updateUI();
  } catch (error) {
    console.error('Error loading recording state:', error);
  }
}

async function startRecording() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      alert('No active tab found');
      return;
    }
    
    await chrome.runtime.sendMessage({ 
      action: 'startRecording',
      tabId: tab.id
    });
    
    isRecording = true;
    updateUI();
  } catch (error) {
    console.error('Error starting recording:', error);
    alert('Failed to start recording: ' + error.message);
  }
}

async function stopRecording() {
  try {
    await chrome.runtime.sendMessage({ action: 'stopRecording' });
    isRecording = false;
    updateUI();
  } catch (error) {
    console.error('Error stopping recording:', error);
  }
}

async function clearSteps() {
  if (testSteps.length > 0) {
    if (!confirm('Are you sure you want to clear all recorded steps?')) {
      return;
    }
  }
  
  try {
    await chrome.runtime.sendMessage({ action: 'clearSteps' });
    testSteps = [];
    updateUI();
  } catch (error) {
    console.error('Error clearing steps:', error);
  }
}

function updateUI() {
  // Update buttons
  recordBtn.disabled = isRecording;
  stopBtn.disabled = !isRecording;
  
  // Update status
  if (isRecording) {
    statusText.textContent = '🔴 Recording...';
    statusText.classList.add('recording-indicator');
  } else {
    statusText.textContent = 'Ready to record';
    statusText.classList.remove('recording-indicator');
  }
  
  // Update step count
  stepCount.textContent = `${testSteps.length} step${testSteps.length !== 1 ? 's' : ''}`;
  
  // Update steps list
  renderSteps();
}

function renderSteps() {
  if (testSteps.length === 0) {
    stepsList.innerHTML = '<p class="empty-message">No steps recorded yet. Click "Start Recording" to begin.</p>';
    return;
  }
  
  stepsList.innerHTML = testSteps.map((step, index) => `
    <div class="step-item">
      <div>
        <span class="step-number">${index + 1}</span>
        <span class="step-command">${step.command}</span>
      </div>
      ${step.target ? `<div class="step-target">Target: ${escapeHtml(step.target)}</div>` : ''}
      ${step.value ? `<div class="step-value">Value: ${escapeHtml(step.value)}</div>` : ''}
    </div>
  `).join('');
  
  // Auto-scroll to bottom
  stepsList.scrollTop = stepsList.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function exportTest(format) {
  if (testSteps.length === 0) {
    alert('No test steps to export');
    return;
  }
  
  let content = '';
  let filename = '';
  
  switch (format) {
    case 'selenium':
      content = generateSeleniumPython();
      filename = 'test_selenium.py';
      break;
    case 'webdriver':
      content = generateWebDriverJava();
      filename = 'TestWebDriver.java';
      break;
    case 'json':
      const testName = testNameInput.value || 'Selenium Test';
      const testDescription = testDescriptionInput.value || '';
      content = JSON.stringify({
        testName: testName,
        description: testDescription,
        steps: testSteps,
        createdAt: new Date().toISOString()
      }, null, 2);
      filename = 'test_steps.json';
      break;
  }
  
  downloadFile(content, filename);
}

function exportToExcel() {
  if (testSteps.length === 0) {
    alert('No test steps to export');
    return;
  }
  
  const testName = testNameInput.value || 'Selenium Test Case';
  const testDescription = testDescriptionInput.value || 'Automated test case recorded using Selenium Test Recorder';
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Test Case Summary Sheet
  const summaryData = [
    ['TEST CASE SPECIFICATION'],
    [''],
    ['Test Case ID:', 'TC_' + Date.now()],
    ['Test Case Name:', testName],
    ['Description:', testDescription],
    ['Created Date:', new Date().toLocaleDateString()],
    ['Created By:', 'Selenium Test Recorder'],
    ['Priority:', 'Medium'],
    ['Status:', 'Draft'],
    [''],
    ['Total Steps:', testSteps.length],
    ['Execution Time:', 'N/A'],
    ['Last Updated:', new Date().toLocaleString()]
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Test Summary');
  
  // Test Steps Sheet
  const stepsData = [
    ['Step No.', 'Action/Command', 'Element/Target', 'Input Data/Value', 'Expected Result', 'Status', 'Comments']
  ];
  
  testSteps.forEach((step, index) => {
    const expectedResult = getExpectedResult(step);
    stepsData.push([
      index + 1,
      step.command.toUpperCase(),
      step.target || 'N/A',
      step.value || 'N/A',
      expectedResult,
      'Not Executed',
      ''
    ]);
  });
  
  const stepsSheet = XLSX.utils.aoa_to_sheet(stepsData);
  stepsSheet['!cols'] = [
    { wch: 10 },  // Step No
    { wch: 15 },  // Action
    { wch: 40 },  // Target
    { wch: 30 },  // Value
    { wch: 35 },  // Expected Result
    { wch: 15 },  // Status
    { wch: 25 }   // Comments
  ];
  XLSX.utils.book_append_sheet(wb, stepsSheet, 'Test Steps');
  
  // Detailed Test Data Sheet
  const detailedData = [
    ['Step No.', 'Timestamp', 'Command', 'Locator Strategy', 'Element Identifier', 'Input Value', 'Description']
  ];
  
  testSteps.forEach((step, index) => {
    const locatorStrategy = getLocatorStrategy(step.target);
    detailedData.push([
      index + 1,
      step.timestamp || new Date().toISOString(),
      step.command,
      locatorStrategy,
      step.target || '',
      step.value || '',
      step.description || ''
    ]);
  });
  
  const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
  detailedSheet['!cols'] = [
    { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 30 }, { wch: 35 }
  ];
  XLSX.utils.book_append_sheet(wb, detailedSheet, 'Detailed Steps');
  
  // Test Execution Log Sheet (Template)
  const executionData = [
    ['TEST EXECUTION LOG'],
    [''],
    ['Test Case ID:', 'TC_' + Date.now()],
    ['Test Case Name:', testName],
    ['Executed By:', ''],
    ['Execution Date:', ''],
    ['Environment:', ''],
    ['Browser:', 'Chrome'],
    [''],
    ['Step No.', 'Action', 'Expected Result', 'Actual Result', 'Status', 'Screenshot', 'Remarks']
  ];
  
  testSteps.forEach((step, index) => {
    executionData.push([
      index + 1,
      step.command,
      getExpectedResult(step),
      '',
      '',
      '',
      ''
    ]);
  });
  
  const executionSheet = XLSX.utils.aoa_to_sheet(executionData);
  executionSheet['!cols'] = [
    { wch: 10 }, { wch: 20 }, { wch: 35 }, { wch: 35 }, { wch: 12 }, { wch: 15 }, { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, executionSheet, 'Execution Log');
  
  // Generate Excel file
  const fileName = `${testName.replace(/[^a-z0-9]/gi, '_')}_TestCase_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
  
  console.log('Excel test case exported successfully');
}

function exportToCSV() {
  if (testSteps.length === 0) {
    alert('No test steps to export');
    return;
  }
  
  const testName = testNameInput.value || 'Selenium Test Case';
  
  // Create CSV content
  const headers = ['Step No.', 'Command', 'Target/Element', 'Value/Input Data', 'Expected Result', 'Status'];
  const rows = [headers];
  
  testSteps.forEach((step, index) => {
    rows.push([
      index + 1,
      step.command,
      step.target || 'N/A',
      step.value || 'N/A',
      getExpectedResult(step),
      'Not Executed'
    ]);
  });
  
  const csvContent = rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  // Add BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const fileName = `${testName.replace(/[^a-z0-9]/gi, '_')}_TestCase.csv`;
  
  chrome.downloads.download({
    url: url,
    filename: fileName,
    saveAs: true
  });
}

function getExpectedResult(step) {
  switch (step.command) {
    case 'navigate':
      return `Page should navigate to ${step.target}`;
    case 'click':
    case 'clickLink':
      return `Element should be clicked successfully`;
    case 'type':
      return `Text "${step.value}" should be entered in the field`;
    case 'select':
      return `Option "${step.value}" should be selected`;
    case 'submit':
      return `Form should be submitted successfully`;
    case 'check':
      return `Checkbox should be checked`;
    case 'uncheck':
      return `Checkbox should be unchecked`;
    case 'doubleClick':
      return `Element should be double-clicked`;
    default:
      return `Action should complete successfully`;
  }
}

function getLocatorStrategy(target) {
  if (!target) return 'N/A';
  if (target.startsWith('#')) return 'ID';
  if (target.startsWith('[name=')) return 'Name';
  if (target.startsWith('link=')) return 'Link Text';
  if (target.startsWith('[data-testid=')) return 'Data Attribute';
  if (target.startsWith('/') || target.startsWith('//')) return 'XPath';
  return 'CSS Selector';
}

function generateSeleniumPython() {
  const testName = testNameInput.value || 'selenium_test';
  const functionName = testName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  const lines = [
    '"""',
    `Test Case: ${testNameInput.value || 'Selenium Test'}`,
    `Description: ${testDescriptionInput.value || 'Automated test case'}`,
    `Generated: ${new Date().toLocaleString()}`,
    '"""',
    '',
    'from selenium import webdriver',
    'from selenium.webdriver.common.by import By',
    'from selenium.webdriver.support.ui import WebDriverWait',
    'from selenium.webdriver.support import expected_conditions as EC',
    'from selenium.webdriver.support.ui import Select',
    'from selenium.webdriver.common.keys import Keys',
    'import time',
    '',
    `def ${functionName}():`,
    '    """Execute the automated test"""',
    '    # Initialize the Chrome driver',
    '    driver = webdriver.Chrome()',
    '    driver.maximize_window()',
    '    wait = WebDriverWait(driver, 10)',
    '    ',
    '    try:'
  ];
  
  testSteps.forEach((step, index) => {
    lines.push(`        # Step ${index + 1}: ${step.description || step.command}`);
    lines.push(`        print("Executing Step ${index + 1}: ${step.description || step.command}")`);
    
    const locatorType = getSeleniumLocator(step.target);
    
    switch (step.command) {
      case 'navigate':
        lines.push(`        driver.get("${step.target}")`);
        break;
      case 'click':
      case 'clickLink':
        lines.push(`        element = wait.until(EC.element_to_be_clickable((${locatorType})))`);
        lines.push(`        element.click()`);
        break;
      case 'type':
        lines.push(`        element = wait.until(EC.presence_of_element_located((${locatorType})))`);
        lines.push(`        element.clear()`);
        lines.push(`        element.send_keys("${step.value}")`);
        break;
      case 'select':
        lines.push(`        element = driver.find_element(${locatorType})`);
        lines.push(`        Select(element).select_by_visible_text("${step.value}")`);
        break;
      case 'submit':
        lines.push(`        driver.find_element(${locatorType}).submit()`);
        break;
      case 'doubleClick':
        lines.push(`        from selenium.webdriver.common.action_chains import ActionChains`);
        lines.push(`        element = driver.find_element(${locatorType})`);
        lines.push(`        ActionChains(driver).double_click(element).perform()`);
        break;
      default:
        lines.push(`        # TODO: Implement ${step.command}`);
    }
    lines.push(`        print("✓ Step ${index + 1} completed successfully")`);
    lines.push('');
  });
  
  lines.push('        print("Test completed successfully!")');
  lines.push('        ');
  lines.push('    except Exception as e:');
  lines.push('        print(f"Test failed: {str(e)}")');
  lines.push('        raise');
  lines.push('    finally:');
  lines.push('        driver.quit()');
  lines.push('');
  lines.push('');
  lines.push('if __name__ == "__main__":');
  lines.push(`    ${functionName}()`);
  
  return lines.join('\n');
}

function getSeleniumLocator(target) {
  if (!target) return 'By.TAG_NAME, "body"';
  
  if (target.startsWith('#')) {
    return `By.ID, "${target.substring(1)}"`;
  } else if (target.startsWith('[name=')) {
    const name = target.match(/\[name="([^"]+)"\]/)[1];
    return `By.NAME, "${name}"`;
  } else if (target.startsWith('link=')) {
    return `By.LINK_TEXT, "${target.substring(5)}"`;
  } else if (target.startsWith('/') || target.startsWith('//')) {
    return `By.XPATH, "${target}"`;
  } else {
    return `By.CSS_SELECTOR, "${target}"`;
  }
}

function generateWebDriverJava() {
  const className = (testNameInput.value || 'SeleniumTest').replace(/[^a-zA-Z0-9]/g, '');
  
  const lines = [
    '/**',
    ` * Test Case: ${testNameInput.value || 'Selenium Test'}`,
    ` * Description: ${testDescriptionInput.value || 'Automated test case'}`,
    ` * Generated: ${new Date().toLocaleString()}`,
    ' */',
    '',
    'import org.openqa.selenium.By;',
    'import org.openqa.selenium.WebDriver;',
    'import org.openqa.selenium.WebElement;',
    'import org.openqa.selenium.chrome.ChromeDriver;',
    'import org.openqa.selenium.support.ui.WebDriverWait;',
    'import org.openqa.selenium.support.ui.ExpectedConditions;',
    'import org.openqa.selenium.support.ui.Select;',
    'import org.openqa.selenium.interactions.Actions;',
    'import java.time.Duration;',
    '',
    `public class ${className} {`,
    '    public static void main(String[] args) {',
    '        WebDriver driver = new ChromeDriver();',
    '        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));',
    '        driver.manage().window().maximize();',
    '        ',
    '        try {'
  ];
  
  testSteps.forEach((step, index) => {
    lines.push(`            // Step ${index + 1}: ${step.description || step.command}`);
    lines.push(`            System.out.println("Executing Step ${index + 1}: ${step.description || step.command}");`);
    
    const locator = getJavaLocator(step.target);
    
    switch (step.command) {
      case 'navigate':
        lines.push(`            driver.get("${step.target}");`);
        break;
      case 'click':
      case 'clickLink':
        lines.push(`            WebElement element${index} = wait.until(ExpectedConditions.elementToBeClickable(${locator}));`);
        lines.push(`            element${index}.click();`);
        break;
      case 'type':
        lines.push(`            WebElement element${index} = wait.until(ExpectedConditions.presenceOfElementLocated(${locator}));`);
        lines.push(`            element${index}.clear();`);
        lines.push(`            element${index}.sendKeys("${step.value}");`);
        break;
      case 'select':
        lines.push(`            Select dropdown${index} = new Select(driver.findElement(${locator}));`);
        lines.push(`            dropdown${index}.selectByVisibleText("${step.value}");`);
        break;
      case 'submit':
        lines.push(`            driver.findElement(${locator}).submit();`);
        break;
      case 'doubleClick':
        lines.push(`            Actions actions${index} = new Actions(driver);`);
        lines.push(`            WebElement element${index} = driver.findElement(${locator});`);
        lines.push(`            actions${index}.doubleClick(element${index}).perform();`);
        break;
      default:
        lines.push(`            // TODO: Implement ${step.command}`);
    }
    lines.push(`            System.out.println("✓ Step ${index + 1} completed successfully");`);
    lines.push('');
  });
  
  lines.push('            System.out.println("Test completed successfully!");');
  lines.push('            ');
  lines.push('        } catch (Exception e) {');
  lines.push('            System.err.println("Test failed: " + e.getMessage());');
  lines.push('            e.printStackTrace();');
  lines.push('        } finally {');
  lines.push('            driver.quit();');
  lines.push('        }');
  lines.push('    }');
  lines.push('}');
  
  return lines.join('\n');
}

function getJavaLocator(target) {
  if (!target) return 'By.tagName("body")';
  
  if (target.startsWith('#')) {
    return `By.id("${target.substring(1)}")`;
  } else if (target.startsWith('[name=')) {
    const name = target.match(/\[name="([^"]+)"\]/)[1];
    return `By.name("${name}")`;
  } else if (target.startsWith('link=')) {
    return `By.linkText("${target.substring(5)}")`;
  } else if (target.startsWith('/') || target.startsWith('//')) {
    return `By.xpath("${target}")`;
  } else {
    return `By.cssSelector("${target}")`;
  }
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('Download failed:', chrome.runtime.lastError);
      alert('Export failed: ' + chrome.runtime.lastError.message);
    } else {
      console.log('Export successful, download ID:', downloadId);
    }
  });
}
