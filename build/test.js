/* = = = = = = = = = = = = = = = = = = = */
class Table {
  constructor(ss, name, label) {
    this.ss = ss;
    this.name = name;
    this.label = label;
    this.sheet = this.cine();
  } // cine = create if not exist


  cine() {
    let cand = this.ss.getSheetByName(this.name);

    if (cand == null) {
      cand = this.ss.insertSheet();
      cand.setName(this.name);
      cand.appendRow([this.label]);
    }

    return cand;
  }

  arr2obj(row) {
    return row.reduce((pr, cr, ix) => ({ ...pr,
      [this.label[ix]]: cr
    }), {});
  }

  obj2arr(obj) {
    return Object.values(obj);
  }

  getRow(rowNum) {
    return this.sheet.getRange(1, 1, rowNum, this.label.length);
  }

  clear(tableName) {
    const sht = this.ss.getSheetByName(tableName);
    if (sht == null) return;
    sht.clear();
  }

  clearDataRange() {
    const lastRow = this.sheet.getLastRow();
    this.sheet.getRange(1, 1, lastRow, this.label.length).clear();
  }

  create(data) {
    const row = this.obj2arr(data);
    this.sheet.appendRow(row);
  }

  read(rowNum) {
    const row = this.getRow(rowNum).getValue();
    return this.arr2obj(row);
  }

  update(rowNum, data) {
    const row = this.getRow(rowNum);
    row.setValue(this.obj2arr(data));
  }

  delete(rowNum) {
    this.sheet.deleteRow(rowNum);
  }

}

class Csv extends Table {
  returnCSV() {}

  formatContentForCSV() {}

  resetCSV() {
    this.clearDataRange();
  }

}

class Contents extends Table {
  rowOf(col, val) {
    const lastRow = this.sheet.getLastRow();
    const boxes = this.sheet.getRange(2, col, lastRow, col).getValues();
    const ids = boxes.flat();
    const ix = ids.indexOf(val);
    return ix;
  }

  findRow(col, val) {
    const ix = this.rowOf(col, val);
    if (ix == -1) return null;
    const data = this.sheet.getRange(ix + 1, 1, 1, this.label.length).getValues();
    return this.arr2obj(data[0]);
  }

  findRowById(id) {
    return this.findRow(1, id);
  }

  findRowByUrl(url) {
    return this.findRow(3, url);
  }

  createCsvCandidates() {}

  insert(data) {
    this.create(data);
  }

  allowPermission(id) {
    const num = this.rowOf(1, id) + 1;
    this.sheet.getRange(num, 8).setValue(true);
  }

  markAsDone() {}

}

class Database {
  constructor(spreadSheetId) {
    const sprd = SpreadsheetApp.openById(spreadSheetId);
    this.csv = new Csv(sprd, 'csv', ['Date', 'Message', 'Link', 'Media', 'URLs', 'Title', 'Labels']);
    this.content = new Contents(sprd, 'content', ['id', 'service', 'url', 'username', 'caption', 'source', 'embed', 'permission', 'scheduled']);
  }

  getCSV() {
    return {
      error: new Error('no erro'),
      data: ''
    };
  }

  getContent(id) {
    const data = this.content.findRowById(id);
    const response = {
      error: data == null && new Error(`Id ${id} is not on the table`),
      data
    };
    return response;
  }

  insertContent(data) {
    const alr = this.content.findRowByUrl(data.url);
    const response = {
      error: alr !== null && new Error('This url is alredy in the table'),
      data: 'Eerror adding an entry'
    };

    if (alr == null) {
      this.content.insert({
        id: Utilities.getUuid(),
        ...data,
        permission: false,
        scheduled: false
      });
      return response;
    }

    response.data = `${data.url} is added to the table`;
    return response;
  }

  confirmContent(id) {
    const data = this.content.findRowById(id);
    const response = {
      error: data == null && new Error(`${id} not found on the table`),
      data: 'Cannot confirm request'
    };
    if (data == null) return response;
    this.content.allowPermission(id);
    response.data = `Updated ${id}!`;
    return response;
  }

}

var db = new Database('1SoX49SBBw2xqrF4I71zQlKIYj5XP1dMSePt11cd3UR8');

function testConfirmation() {
  const res = db.confirmContent('kjisadf');
}

function testAppend() {
  const test = db.getContent('adsklfn');
  console.log(Object.values(test).map(x => typeof x));
}

function testInsert() {
  const res = db.insertContent({
    service: 'service',
    url: 'url',
    username: 'username',
    caption: 'caption',
    source: 'source',
    embed: 'embed'
  });
  console.log(res);
}
