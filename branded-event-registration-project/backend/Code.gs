// Sheet names matching tabs in your Google Spreadsheet
const ATTENDEE_SHEET = 'Sheet1';
const CONFIG_SHEET = 'FormConfig';
const EVENT_SHEET = 'EventConfig';

function doGet(e) {
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Fetch Dynamic Form Fields
    let fields = [];
    const configSheet = doc.getSheetByName(CONFIG_SHEET);
    if (configSheet && configSheet.getLastRow() > 1) {
      const data = configSheet.getDataRange().getValues();
      const headers = data[0];
      for (let i = 1; i < data.length; i++) {
        let field = {};
        for (let j = 0; j < headers.length; j++) {
          field[headers[j]] = data[i][j];
        }
        fields.push(field);
      }
    } else {
      // Safe defaults
      fields = [
        { id: 'firstName', label: 'First Name', type: 'text', required: true, width: 'half' },
        { id: 'lastName', label: 'Last Name', type: 'text', required: true, width: 'half' },
        { id: 'email', label: 'Work Email', type: 'email', required: true, width: 'full' }
      ];
    }
    
    // 2. Fetch Live Event CMS Details (Text & Images)
    let eventDetails = {};
    const eventSheet = doc.getSheetByName(EVENT_SHEET);
    if (eventSheet && eventSheet.getLastRow() > 1) {
      const rows = eventSheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        const id = rows[i][0];
        const val = rows[i][1];
        if (id) {
          eventDetails[id] = val;
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      fields: fields, 
      eventDetails: eventDetails 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    
    // Path A: Admin Live Editor Save Request
    if (e.parameter && e.parameter.action === 'saveEventDetails') {
      let eventSheet = doc.getSheetByName(EVENT_SHEET);
      if (!eventSheet) {
        eventSheet = doc.insertSheet(EVENT_SHEET);
      }
      
      const payload = JSON.parse(e.parameter.data || '{}');
      eventSheet.clear();
      eventSheet.appendRow(['elementId', 'contentValue']);
      
      const rows = [];
      for (const key in payload) {
        if (payload.hasOwnProperty(key)) {
          rows.push([key, payload[key]]);
        }
      }
      
      if (rows.length > 0) {
        eventSheet.getRange(2, 1, rows.length, 2).setValues(rows);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ result: 'success', savedKeys: rows.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Path B: Attendee Form Registration
    const sheet = doc.getSheetByName(ATTENDEE_SHEET);
    if (!sheet) {
      throw new Error("Target attendee sheet '" + ATTENDEE_SHEET + "' not found.");
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const nextRow = sheet.getLastRow() + 1;
    
    const newRow = headers.map(function(header) {
      return header === 'timestamp' ? new Date() : (e.parameter[header] || '');
    });
    
    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
    
    return ContentService.createTextOutput(JSON.stringify({ result: 'success', row: nextRow }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}