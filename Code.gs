function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var reportSheet = ss.getSheetByName("BaoCaoTongHop") || ss.insertSheet("BaoCaoTongHop");
  var detailSheet = ss.getSheetByName("ChiTietChamCom") || ss.insertSheet("ChiTietChamCom");
  var settingsSheet = ss.getSheetByName("Settings") || ss.insertSheet("Settings");

  if (reportSheet.getLastRow() === 0) {
    reportSheet.appendRow(["Ngày", "Giá Trưa", "Giá Tối", "Tổng Trưa", "Tổng Tối", "Tiền Cơm", "Chi Phí Khác (Ngày)", "Tổng Cộng"]);
    reportSheet.getRange(1, 1, 1, 8).setBackground("#495B43").setFontColor("white").setFontWeight("bold");
  }
  if (detailSheet.getLastRow() === 0) {
    detailSheet.appendRow(["Ngày", "Mã", "Họ Tên", "Trưa", "Tối", "Ghi chú"]);
    detailSheet.getRange(1, 1, 1, 6).setBackground("#2E7D32").setFontColor("white").setFontWeight("bold");
  }

  try {
    var params = JSON.parse(e.postData.contents);
    var dateStr = String(params.date).trim();
    
    if (params.data) {
      var data = params.data;
      var pTrua = params.priceTrua || "29.500";
      var pToi = params.priceToi || "29.500";
      var otherCosts = params.otherCosts || [];

      var totalTrua = 0, totalToi = 0;
      data.forEach(function(p) {
        if (p.trua) totalTrua++;
        if (p.toi) totalToi++;
      });

      var valPriceTrua = parseInt(pTrua.replace(/\./g, '')) || 0;
      var valPriceToi = parseInt(pToi.replace(/\./g, '')) || 0;
      var mealTotal = (totalTrua * valPriceTrua) + (totalToi * valPriceToi);
      
      var totalOther = 0;
      otherCosts.forEach(function(c) { totalOther += (parseInt(String(c.val).replace(/\./g, '')) || 0); });
      var daysInMonth = new Date(new Date(dateStr).getFullYear(), new Date(dateStr).getMonth() + 1, 0).getDate();
      var dailyOther = Math.round(totalOther / daysInMonth);

      // Xóa cũ Báo Cáo
      var rRows = reportSheet.getDataRange().getValues();
      for (var i = rRows.length - 1; i >= 1; i--) {
        if (formatDateString(rRows[i][0]) === dateStr) reportSheet.deleteRow(i + 1);
      }
      // Lưu dưới dạng Text tuyệt đối bằng cách thêm dấu nháy đơn
      reportSheet.appendRow(["'" + dateStr, pTrua, pToi, totalTrua, totalToi, mealTotal, dailyOther, mealTotal + dailyOther]);

      // Xóa cũ Chi Tiết
      var dRows = detailSheet.getDataRange().getValues();
      for (var j = dRows.length - 1; j >= 1; j--) {
        if (formatDateString(dRows[j][0]) === dateStr) detailSheet.deleteRow(j + 1);
      }
      var detailRecords = [];
      data.forEach(function(p) {
        detailRecords.push(["'" + dateStr, p.id, p.name, p.trua ? "Ăn" : "Cắt", p.toi ? "Ăn" : "Cắt", ""]);
      });
      detailSheet.getRange(detailSheet.getLastRow() + 1, 1, detailRecords.length, 6).setValues(detailRecords);
    }

    if (params.otherCosts) {
      settingsSheet.clearContents();
      settingsSheet.appendRow(["Key", "Value"]);
      settingsSheet.appendRow(["otherCosts", JSON.stringify(params.otherCosts)]);
      settingsSheet.getRange(1, 1, 1, 2).setBackground("#1565C0").setFontColor("white").setFontWeight("bold");
    }

    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch(error) {
    return ContentService.createTextOutput("Error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var reportSheet = ss.getSheetByName("BaoCaoTongHop");
  var detailSheet = ss.getSheetByName("ChiTietChamCom");
  var settingsSheet = ss.getSheetByName("Settings");
  
  var response = { mealData: [], priceTrua: "29.500", priceToi: "29.500", otherCosts: [] };
  var targetDate = String(e.parameter.date).trim();

  if (detailSheet) {
    var rows = detailSheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (formatDateString(rows[i][0]) === targetDate) {
        response.mealData.push({ id: rows[i][1], name: rows[i][2], trua: rows[i][3] === "Ăn", toi: rows[i][4] === "Ăn" });
      }
    }
  }
  
  if (reportSheet) {
    var rRows = reportSheet.getDataRange().getValues();
    for (var k = 1; k < rRows.length; k++) {
      if (formatDateString(rRows[k][0]) === targetDate) {
        response.priceTrua = String(rRows[k][1] || "29.500");
        response.priceToi = String(rRows[k][2] || "29.500");
      }
    }
  }

  if (settingsSheet) {
    var sRows = settingsSheet.getDataRange().getValues();
    for (var j = 1; j < sRows.length; j++) {
      if (sRows[j][0] == "otherCosts") {
        try { response.otherCosts = JSON.parse(sRows[j][1]); } catch(err) {}
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function formatDateString(dateVal) {
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), "yyyy-MM-dd");
  }
  // Loại bỏ khoảng trắng và nháy đơn (nếu có)
  return String(dateVal).replace(/^'/, '').trim();
}
