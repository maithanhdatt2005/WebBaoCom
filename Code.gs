function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("BaoCom");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("BaoCom");
    sheet.appendRow(["Timestamp", "Ngày", "Mã", "Họ Tên", "Bữa Trưa", "Bữa Tối"]);
    sheet.getRange(1, 1, 1, 6).setBackground("#495B43").setFontColor("white").setFontWeight("bold");
  }

  try {
    var params;
    if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (parseEx) {
        return createResponse({"status": "error", "message": "Invalid JSON"});
      }
    } else {
      params = e.parameter;
    }
    
    // Mặc định lấy ngày hôm nay do App mới chưa có Datepicker truyền sang
    var dateObj = new Date();
    var dateStr = [dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate()].join('-');
    
    var rawData = params.data; 
    var data = (typeof rawData === 'string') ? JSON.parse(rawData) : rawData;
    
    if (!data) return createResponse({"status": "error", "message": "Missing data"});

    var rows = sheet.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 1; i--) {
      // Cột B (index 1) là Cột Ngày
      if (rows[i][1] == dateStr) {
        sheet.deleteRow(i + 1);
      }
    }
    
    var timestamp = new Date();
    var recordsToAppend = [];
    
    // data la array object: { id: 1, name: "...", trua: true, toi: true }
    for (var i = 0; i < data.length; i++) {
        var info = data[i];
        recordsToAppend.push([
            timestamp,
            dateStr,
            info.id,
            info.name,
            info.trua ? "Ăn" : "Cắt",
            info.toi ? "Ăn" : "Cắt"
        ]);
    }
    
    if (recordsToAppend.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, recordsToAppend.length, 6).setValues(recordsToAppend);
    }

    return createResponse({"status": "success", "message": "Đã lưu bản ghi."});

  } catch(error) {
    return createResponse({"status": "error", "message": error.toString()});
  }
}

function doGet(e) {
  return createResponse({"status": "ok", "message": "Backend API is Running. Use POST to update data."});
}

function createResponse(responseObj) {
  return ContentService.createTextOutput(JSON.stringify(responseObj))
                       .setMimeType(ContentService.MimeType.JSON);
}
