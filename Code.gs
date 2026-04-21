function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("BaoCom");
  if (!sheet) {
    sheet = ss.insertSheet("BaoCom");
    sheet.appendRow(["Timestamp", "Ngày", "Mã", "Họ Tên", "Bữa Trưa", "Bữa Tối", "Giá Trưa", "Giá Tối"]);
    sheet.getRange(1, 1, 1, 8).setBackground("#495B43").setFontColor("white").setFontWeight("bold");
  }

  var settingsSheet = ss.getSheetByName("Settings");
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet("Settings");
    settingsSheet.appendRow(["Key", "Value"]);
    settingsSheet.getRange(1, 1, 1, 2).setBackground("#495B43").setFontColor("white").setFontWeight("bold");
  }

  try {
    var params = JSON.parse(e.postData.contents);
    var dateStr = params.date; // Định dạng YYYY-MM-DD từ App gửi sang
    
    // 1. Lưu Meal Data và Giá Tiền
    if (params.data) {
      var data = params.data;
      var priceTrua = params.priceTrua || "29.500";
      var priceToi = params.priceToi || "29.500";
      
      var rows = sheet.getDataRange().getValues();
      // Xóa dữ liệu cũ của ngày này (Duyệt ngược để xóa không bị lệch index)
      for (var i = rows.length - 1; i >= 1; i--) {
        var rowDate = rows[i][1];
        // Chuẩn hóa ngày trong sheet về YYYY-MM-DD để so sánh
        var formattedRowDate = (rowDate instanceof Date) ? Utilities.formatDate(rowDate, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd") : rowDate;
        if (formattedRowDate == dateStr) { 
          sheet.deleteRow(i + 1); 
        }
      }
      
      var timestamp = new Date();
      var recordsToAppend = [];
      for (var i = 0; i < data.length; i++) {
          var info = data[i];
          recordsToAppend.push([timestamp, dateStr, info.id, info.name, info.trua ? "Ăn" : "Cắt", info.toi ? "Ăn" : "Cắt", priceTrua, priceToi]);
      }
      
      if (recordsToAppend.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, recordsToAppend.length, 8).setValues(recordsToAppend);
      }
    }

    // 2. Lưu Other Costs (Chi phí khác)
    if (params.otherCosts) {
      settingsSheet.clearContents();
      settingsSheet.appendRow(["Key", "Value"]);
      settingsSheet.appendRow(["otherCosts", JSON.stringify(params.otherCosts)]);
      settingsSheet.getRange(1, 1, 1, 2).setBackground("#495B43").setFontColor("white").setFontWeight("bold");
    }

    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch(error) {
    return ContentService.createTextOutput("Error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("BaoCom");
  var settingsSheet = ss.getSheetByName("Settings");
  
  var response = {
    mealData: [],
    priceTrua: "29.500",
    priceToi: "29.500",
    otherCosts: []
  };

  var targetDate = e.parameter.date;

  // 1. Lấy Meal Data và Giá Tiền
  if (sheet) {
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      var rowDate = rows[i][1];
      var formattedRowDate = (rowDate instanceof Date) ? Utilities.formatDate(rowDate, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd") : rowDate;
      
      if (formattedRowDate == targetDate) {
        response.mealData.push({
          id: rows[i][2],
          name: rows[i][3],
          trua: rows[i][4] === "Ăn",
          toi: rows[i][5] === "Ăn"
        });
        response.priceTrua = rows[i][6] || "29.500";
        response.priceToi = rows[i][7] || "29.500";
      }
    }
  }

  // 2. Lấy Other Costs
  if (settingsSheet) {
    var sRows = settingsSheet.getDataRange().getValues();
    for (var j = 1; j < sRows.length; j++) {
      if (sRows[j][0] == "otherCosts") {
        try {
          response.otherCosts = JSON.parse(sRows[j][1]);
        } catch(err) {}
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}
