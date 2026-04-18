function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("BaoCom");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("BaoCom");
    sheet.appendRow(["Timestamp", "Ngày", "Mã", "Họ Tên", "Bữa Trưa", "Bữa Tối"]);
    sheet.getRange(1, 1, 1, 6).setBackground("#495B43").setFontColor("white").setFontWeight("bold");
  }

  try {
    var params = JSON.parse(e.postData.contents);
    // Ưu tiên lấy ngày từ App gửi sang, nếu không có mới lấy ngày hôm nay
    var dateStr = params.date || [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()].join('-');
    var data = params.data; 

    var rows = sheet.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 1; i--) {
      if (rows[i][1] == dateStr) { sheet.deleteRow(i + 1); }
    }
    
    var timestamp = new Date();
    var recordsToAppend = [];
    for (var i = 0; i < data.length; i++) {
        var info = data[i];
        recordsToAppend.push([timestamp, dateStr, info.id, info.name, info.trua ? "Ăn" : "Cắt", info.toi ? "Ăn" : "Cắt"]);
    }
    
    if (recordsToAppend.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, recordsToAppend.length, 6).setValues(recordsToAppend);
    }
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch(error) {
    return ContentService.createTextOutput("Error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("BaoCom");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  
  var rows = sheet.getDataRange().getValues();
  var data = [];
  var dateStr = e.parameter.date; 

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1] == dateStr) {
      data.push({
        id: rows[i][2],
        name: rows[i][3],
        trua: rows[i][4] === "Ăn",
        toi: rows[i][5] === "Ăn"
      });
    }
  }
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
