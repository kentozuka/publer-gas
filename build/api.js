const json = function (data) {
  const str = JSON.stringify(data)
  const res = ContentService.createTextOutput()
    .setContent(str)
    .setMimeType(ContentService.MimeType.JSON)
  return res
}

/* = = = = = = = = = = = = = = = = = = = */
class Table {
  constructor(ss, name, label) {
    this.ss = ss
    this.name = name
    this.label = label
    this.sheet = this.cine()
  }

  get lastRow() {
    return this.sheet.getLastRow()
  } // cine = create if not exist

  cine() {
    let cand = this.ss.getSheetByName(this.name)

    if (cand == null) {
      cand = this.ss.insertSheet()
      cand.setName(this.name)
      cand.appendRow([this.label])
    }

    return cand
  }

  arr2obj(row) {
    return row.reduce((pr, cr, ix) => ({ ...pr, [this.label[ix]]: cr }), {})
  }

  obj2arr(obj) {
    return Object.values(obj)
  }

  getRow(rowNum) {
    return this.sheet.getRange(1, 1, rowNum, this.label.length)
  }

  wipe(tableName) {
    const sht = this.ss.getSheetByName(tableName)
    if (sht == null) return
    sht.clear()
  }

  clearDataRange() {
    this.sheet.getRange(2, 1, this.lastRow, this.label.length).clear()
  }

  create(data) {
    const row = this.obj2arr(data)
    this.sheet.appendRow(row)
  }

  read(rowNum) {
    const row = this.getRow(rowNum).getValue()
    return this.arr2obj(row)
  }

  update(rowNum, data) {
    const row = this.getRow(rowNum)
    row.setValue(this.obj2arr(data))
  }

  delete(rowNum) {
    this.sheet.deleteRow(rowNum)
  }

  rowOf(col, val) {
    const boxes = this.sheet.getRange(2, col, this.lastRow, col).getValues()
    const vals = boxes.flat()
    const ix = vals.indexOf(val)
    return ix
  }

  colOf(col, val) {
    const boxes = this.sheet.getRange(2, col, this.lastRow, 1).getValues()
    const vals = boxes.flat()
    const ix = vals.indexOf(val)
    return ix
  }
}

class Csv extends Table {
  getCurrentIds() {
    const data = this.sheet.getDataRange().getValues()
    data.shift()
    const ids = data.map((x) => x[4]).flat()
    return ids
  }

  clearData() {
    this.clearDataRange()
  }

  createMessage(obj) {
    return `

    ${obj.username} (${obj.service}) さんの投稿をご紹介！🐶
    素敵な投稿をありがとうございます✨

    ————————————

    ${obj.caption}

    ————————————

    🐕 @inu.tomodachiをフォローして　　🐕
    🐕 わんちゃんコンテンツをもっと楽しむ 🐕

    ————————————

    かわいい!と思ったら😍😍😍
    おもしろい!と思ったら🤣🤣🤣
    タメになる!と思ったら🧐🧐🧐
    とコメントしてください✨

    ————————————

    @inu.tomodachiをタグ付けするか
    DMを送ると掲載されるかも🔥

    ————————————

    #いぬいぬぐらむ #わんこ #いぬ

    ————————————

    📸 dm for credit/removal
    ⚠️ note
    we don’t own this video/picture, all rights go to their respective owners. If owner is not provided, tagged (meaning we couldn’t find who is the owner), pls dm us with title credit issue, pic/video, owner account.

    ————————————
    `
  }

  nextNine(prev) {
    const now = new Date()
    const next = now.getTime() > prev.getTime() ? now : new Date(prev)
    next.setDate(next.getDate() + 7)
    return `${next.getFullYear()}/${
      next.getMonth() + 1
    }/${next.getDate()} 21:00`
  }

  createDate() {
    // avoiding label
    if (this.lastRow == 1) return this.nextNine(new Date())
    const lastDate = this.sheet.getRange(this.lastRow, 1).getValue()
    return this.nextNine(new Date(lastDate))
  }

  addContent(row) {
    const obj = {
      Date: this.createDate(),
      Message: this.createMessage(row),
      Link: '',
      'Media URLs': row.source,
      Title: row.id,
      Labels: `${row.service}, ${row.id}`
    }
    this.create(obj)
  }

  removeContent(id) {
    // ['Date','Message','Link','Media URLs','Title','Labels'] 4th has the id => 5th col 1based index
    const row = this.colOf(5, id)
    if (row == -1) return
    this.sheet.deleteRow(row)
  }
}

class Contents extends Table {
  findRow(col, val) {
    const ix = this.rowOf(col, val)
    if (ix == -1) return null // index +1, label +1

    const data = this.sheet
      .getRange(ix + 2, 1, 1, this.label.length)
      .getValues()
    return this.arr2obj(data[0])
  }

  findRowById(id) {
    return this.findRow(1, id)
  }

  findRowByUrl(url) {
    return this.findRow(3, url)
  }

  insert(data) {
    this.create(data)
  }

  toggleBoolean(type, num, val) {
    const col = this.label.indexOf(type)
    if (col === -1) return
    this.sheet.getRange(num, col + 1).setValue(val)
  }

  allowPermission(id) {
    // index +1, label +1
    const num = this.rowOf(1, id) + 2
    this.toggleBoolean('permission', num, true)
  }

  undoPermission(id) {
    // index +1, label +1
    const num = this.rowOf(1, id) + 2
    this.toggleBoolean('permission', num, false)
  }

  markAsDone(id) {
    const num = this.rowOf(1, id) + 2
    this.toggleBoolean('scheduled', num, true)
  }
}

class Database {
  constructor(spreadSheetId) {
    this.sprd = SpreadsheetApp.openById(spreadSheetId)
    this.csv = new Csv(this.sprd, 'csv', [
      'Date',
      'Message',
      'Link',
      'Media URLs',
      'Title',
      'Labels'
    ])
    this.content = new Contents(this.sprd, 'content', [
      'id',
      'asker',
      'service',
      'url',
      'username',
      'caption',
      'source',
      'embed',
      'permission',
      'scheduled'
    ])
  }

  getContent(id) {
    const data = this.content.findRowById(id)
    const response = {
      error: data == null && new Error(`Id ${id} is not on the table`),
      data
    }
    return response
  }

  insertContent(data) {
    const alr = this.content.findRowByUrl(data.url)
    const response = {
      error: alr !== null && new Error('Eerror adding an entry'),
      data: 'This url is alredy in the table'
    }
    if (alr !== null) return response
    const uuid = Utilities.getUuid()
    this.content.insert({
      id: uuid,
      ...data,
      permission: false,
      scheduled: false
    })
    response.data = uuid
    return response
  }

  confirmContent(id, type) {
    const data = this.content.findRowById(id)
    const response = {
      error: data == null && new Error('Cannot confirm request'),
      data: `${id} not found on the table`
    }
    if (data == null) return response
    const row = this.content.findRowById(id)

    if (row == null) {
      response.data = `Cannot find row of ${id}`
      return response
    }

    if (type == 'confirm') {
      this.content.allowPermission(id)
      this.csv.addContent(row)
      response.data = `Updated ${id} and added to the csv table!`
      return response
    }

    this.content.undoPermission(id)
    this.csv.removeContent(id)
    response.data = `${id} reverted changes`
    return response
  }

  markAsScheduled() {
    const ids = this.csv.getCurrentIds()

    for (const id of ids) {
      this.content.markAsDone(id)
    }

    this.csv.clearData()
    return {
      error: false,
      data: 'Done'
    }
  }

  addMenu() {
    this.sprd.addMenu('Publer Menu', [
      {
        name: '現在のCSVを登録済みにする',
        functionName: 'csvConversion'
      }
    ])
  }
}

var db = new Database('1SoX49SBBw2xqrF4I71zQlKIYj5XP1dMSePt11cd3UR8')

const recepient = 'kento@intd.jp'
function sendNotification(type) {
  GmailApp.sendEmail(
    recepient,
    `[${type}]新たなリクエストが送信されました。`,
    'Open Publer to see what happened'
  )
}

function onOpen() {
  db.addMenu()
}

function csvConversion() {
  db.markAsScheduled()
}

function doGet(e) {
  try {
    const { id } = e.parameter
    const data = db.getContent(id)
    return json(data)
  } catch (e) {
    return json({
      error: e.message
    })
  }
}

function doPost(e) {
  try {
    const { type } = e.parameter
    const jsdt = JSON.parse(e.postData.contents)

    if (type == 'insert') {
      const res = db.insertContent(jsdt)
      return json(res)
    }

    if (type == 'update') {
      const res = db.confirmContent(jsdt.id, 'confirm')
      sendNotification(type)
      return json(res)
    }

    if (type == 'undo') {
      const res = db.confirmContent(jsdt.id, 'undo')
      sendNotification(type)
      return json(res)
    }

    return json({
      message: 'Nothing happened!'
    })
  } catch (e) {
    return json({
      error: e.message
    })
  }
}
/**
 * ToDo
 * - create csv update script
 * - look for a service that can take data from ig/tk (including src)
 * - create frontend
 * - integrate everything
 */
