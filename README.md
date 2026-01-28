# Selenium Test Recorder - Chrome Extension

A powerful Chrome extension for recording browser interactions and generating Selenium test scripts, similar to TestCase Studio.

## Features

- 🎬 **Record Browser Actions**: Automatically capture clicks, typing, form submissions, navigation, and more
- 🔍 **Smart Element Selection**: Uses ID, name, CSS selectors, and XPath for reliable element identification
- � **Excel/CSV Export**: Generate professional test case documentation with multiple worksheets
- �📝 **Export Test Scripts**: Generate test code in Python (Selenium) or Java (WebDriver)
- 💾 **JSON Export**: Save test steps as JSON for custom processing
- ⚙️ **Customizable Options**: Configure recording preferences and export settings
- 🎯 **Real-time Recording**: See test steps as they're recorded
- 🧹 **Clean UI**: Modern, intuitive interface

## Installation

1. **Download or Clone** this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer Mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `seleniumide` folder containing the extension files
6. The extension icon should appear in your Chrome toolbar

## Usage

### Recording a Test

1. Click the extension icon in your Chrome toolbar
2. Enter a **Test Case Name** (e.g., "Login Test") - important for exports!
3. Optionally add a **Test Description**
4. Click **Start Recording** button
5. Navigate to the website you want to test
6. Perform actions on the page (click, type, submit forms, etc.)
7. All your actions will be recorded automatically
8. Click **Stop Recording** when finished

### Exporting Tests

After recording, you can export your test in multiple formats:

- **📊 Excel (.xlsx)** - Professional test case documentation with 4 worksheets:
  - Test Summary (metadata and overview)
  - Test Steps (detailed step-by-step documentation)
  - Detailed Steps (technical information)
  - Execution Log (ready-to-use manual testing template)
  
- **📋 CSV** - Simple spreadsheet format compatible with Excel and Google Sheets

- **Selenium (Python)** - Click "Export as Selenium (Python)" to generate Python code

- **WebDriver (Java)** - Click "Export as WebDriver (Java)" to generate Java code

- **JSON** - Click "Export as JSON" to save raw test steps

📖 **For detailed Excel export features, see [EXCEL_EXPORT_GUIDE.md](EXCEL_EXPORT_GUIDE.md)**

### Configuring Options

1. Right-click the extension icon
2. Select **Options**
3. Configure your preferences:
   - Base URL for your tests
   - Recording options (hover events, key presses, context menu)
   - Selector preferences
   - Export settings

## Supported Actions

The recorder captures the following interactions:

- **Navigation**: Page loads and URL changes
- **Clicks**: Left-click, double-click, right-click
- **Form Input**: Text input, textarea, checkboxes, radio buttons
- **Dropdowns**: Select element interactions
- **Form Submission**: Form submit events
- **Keyboard**: Enter key and special keys

## File Structure

```
seleniumide/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # Content script for recording
├── popup.html            # Main popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── options.html          # Options page UI
├── options.js            # Options page logic
├── icons/                # Extension icons (16x16, 48x48, 128x128)
└── README.md             # This file
```

## Creating Icons

You need to create icons for the extension. Place them in an `icons` folder:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

You can use any icon design tool or create simple colored circles with a record symbol.

## Example Output

### Python (Selenium)
```python
from selenium import webdriver
from selenium.webdriver.common.by import By

driver = webdriver.Chrome()
driver.get("https://example.com")
driver.find_element(By.CSS_SELECTOR, "#username").send_keys("testuser")
driver.find_element(By.CSS_SELECTOR, "#submit").click()
driver.quit()
```

### Java (WebDriver)
```java
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

WebDriver driver = new ChromeDriver();
driver.get("https://example.com");
driver.findElement(By.cssSelector("#username")).sendKeys("testuser");
driver.findElement(By.cssSelector("#submit")).click();
driver.quit();
```

## Requirements

- Chrome browser (version 88 or higher)
- Developer mode enabled for loading unpacked extensions

## Troubleshooting

**Extension not recording:**
- Make sure you clicked "Start Recording"
- Check that the page has fully loaded
- Ensure the content script has permission on the page

**Export not working:**
- Check Chrome's download permissions
- Make sure there are recorded steps to export

**Selectors not working in exported code:**
- Page structure may have changed
- Try using different selector preferences in Options
- Use data-testid or data-test attributes on your elements

## Future Enhancements

- [ ] Add assertions and validations
- [ ] Support for screenshots
- [ ] Wait conditions and timeouts
- [ ] Support for iframes
- [ ] Test playback functionality
- [ ] More export formats (JavaScript, C#, Ruby)
- [ ] Test suite organization

## License

MIT License - Feel free to use and modify as needed.

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.
