const SS = SpreadsheetApp.getActiveSpreadsheet();

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const dateStr = String(params.date).trim();
    
    const reportSheet = getSheet("BaoCaoTongHop");
    const detailSheet = getSheet("ChiTietChamCom");
    const settingsSheet = getSheet("Settings");

    // 1. Xử lý lưu Chi Tiết Chấm Cơm (Chiến sĩ nào ăn/cắt)
    if (params.data) {
      deleteRowsByDate(detailSheet, dateStr);
      let detailRecords = params.data.map(p => ["'" + dateStr, p.id, p.name, p.trua ? "Ăn" : "Cắt", p.toi ? "Ăn" : "Cắt", ""]);
      if (detailRecords.length > 0) {
        detailSheet.getRange(detailSheet.getLastRow() + 1, 1, detailRecords.length, 6).setValues(detailRecords);
      }
    }

    // 2. Xử lý lưu Báo Cáo Tổng Hợp (Giá tiền, tổng bữa)
    if (params.data) {
      deleteRowsByDate(reportSheet, dateStr);
      let tTrua = params.data.filter(p => p.trua).length;
      let tToi = params.data.filter(p => p.toi).length;
      let pTrua = params.priceTrua || "29.500";
      let pToi = params.priceToi || "29.500";
      let vTrua = parseInt(pTrua.replace(/\./g, '')) || 0;
      let vToi = parseInt(pToi.replace(/\./g, '')) || 0;
      let mealTotal = (tTrua * vTrua) + (tToi * vToi);
      
      let otherVal = 0;
      (params.otherCosts || []).forEach(c => otherVal += (parseInt(String(c.val).replace(/\./g, '')) || 0));
      let days = new Date(new Date(dateStr).getFullYear(), new Date(dateStr).getMonth() + 1, 0).getDate();
      let dailyOther = Math.round(otherVal / days);

      reportSheet.appendRow(["'" + dateStr, "'" + pTrua, "'" + pToi, tTrua, tToi, mealTotal, dailyOther, mealTotal + dailyOther]);
    }

    // 3. Lưu Cài Đặt Chi Phí Khác
    if (params.otherCosts) {
      settingsSheet.clear().appendRow(["Key", "Value"]);
      settingsSheet.appendRow(["otherCosts", JSON.stringify(params.otherCosts)]);
    }

    return response({"status": "success"});
  } catch(err) {
    return response({"status": "error", "message": err.toString()});
  }
}

function doGet(e) {
  const targetDate = e.parameter.date;
  const res = { mealData: [], priceTrua: "29.500", priceToi: "29.500", otherCosts: [] };
  
  const detailSheet = SS.getSheetByName("ChiTietChamCom");
  if (detailSheet) {
    const dData = detailSheet.getDataRange().getValues();
    for (let i = 1; i < dData.length; i++) {
      if (formatDate(dData[i][0]) === targetDate) {
        res.mealData.push({ id: dData[i][1], name: dData[i][2], trua: dData[i][3] === "Ăn", toi: dData[i][4] === "Ăn" });
      }
    }
  }

  const reportSheet = SS.getSheetByName("BaoCaoTongHop");
  if (reportSheet) {
    const rData = reportSheet.getDataRange().getValues();
    for (let i = 1; i < rData.length; i++) {
      if (formatDate(rData[i][0]) === targetDate) {
        res.priceTrua = String(rData[i][1]).replace(/'/g, '');
        res.priceToi = String(rData[i][2]).replace(/'/g, '');
        break;
      }
    }
  }

  const settingsSheet = SS.getSheetByName("Settings");
  if (settingsSheet) {
    const sData = settingsSheet.getDataRange().getValues();
    if (sData.length > 1) { try { res.otherCosts = JSON.parse(sData[1][1]); } catch(e){} }
  }

  return response(res);
}

// Helpers
function getSheet(name) { return SS.getSheetByName(name) || SS.insertSheet(name); }
function response(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function formatDate(v) { 
  if (v instanceof Date) return Utilities.formatDate(v, SS.getSpreadsheetTimeZone(), "yyyy-MM-dd");
  return String(v).replace(/'/g, '').trim();
}
function deleteRowsByDate(s, d) {
  let rows = s.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) { if (formatDate(rows[i][0]) === d) s.deleteRow(i + 1); }
}