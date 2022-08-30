type contentName = 'content'
interface Content {
  id: string
  service: string
  url: string
  username: string
  caption: string
  source: string
  embed: string
  permission: boolean
  scheduled: boolean
}

type csvName = 'csv'
interface CSV {
  Date: string
  Message: string
  Link: string
  'Media URLs': string
  Title: string
  Labels: string
}

type TableName = csvName | contentName
type TableObject = CSV | Content

interface Response {
  error: Error | false
  data: any
}

/* = = = = = = = = = = = = = = = = = = = */

abstract class Table<NAME extends TableName, OBJ extends TableObject> {
  protected sheet: GoogleAppsScript.Spreadsheet.Sheet

  constructor(
    protected ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    private name: NAME,
    protected label: (keyof OBJ)[]
  ) {
    this.sheet = this.cine()
  }

  protected get lastRow(): number {
    return this.sheet.getLastRow()
  }

  // cine = create if not exist
  private cine() {
    let cand = this.ss.getSheetByName(this.name)
    if (cand == null) {
      cand = this.ss.insertSheet()
      cand.setName(this.name)
      cand.appendRow([this.label])
    }
    return cand
  }

  protected arr2obj(row: any[]) {
    return row.reduce((pr, cr, ix) => ({ ...pr, [this.label[ix]]: cr }), {})
  }

  protected obj2arr(obj: OBJ) {
    return Object.values(obj)
  }

  private getRow(rowNum: number) {
    return this.sheet.getRange(1, 1, rowNum, this.label.length)
  }

  private wipe(tableName: NAME) {
    const sht = this.ss.getSheetByName(tableName)
    if (sht == null) return
    sht.clear()
  }

  protected clearDataRange() {
    this.sheet.getRange(2, 1, this.lastRow, this.label.length).clear()
  }

  protected create(data: OBJ) {
    const row = this.obj2arr(data)
    this.sheet.appendRow(row)
  }
  protected read(rowNum: number) {
    const row = this.getRow(rowNum).getValue()
    return this.arr2obj(row)
  }
  protected update(rowNum: number, data: OBJ) {
    const row = this.getRow(rowNum)
    row.setValue(this.obj2arr(data))
  }
  protected delete(rowNum: number) {
    this.sheet.deleteRow(rowNum)
  }

  protected rowOf(col: number, val: string) {
    const boxes = this.sheet.getRange(2, col, this.lastRow, col).getValues()
    const vals = boxes.flat()
    const ix = vals.indexOf(val)
    return ix
  }

  protected colOf(col: number, val: string) {
    const boxes = this.sheet.getRange(2, col, this.lastRow, 1).getValues()
    const vals = boxes.flat()
    const ix = vals.indexOf(val)
    return ix
  }
}

class Csv extends Table<csvName, CSV> {
  getCurrentIds() {
    const data = this.sheet.getDataRange().getValues()
    data.shift()
    const ids = data.map((x) => x[4]).flat()
    return ids
  }

  clearData() {
    this.clearDataRange()
  }

  createMessage(obj: Content) {
    return `

    @${obj.username} (${obj.service}) さんの投稿をご紹介！🐶
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

  nextNine(prev: Date) {
    const now = new Date()
    const next = now.getTime() > prev.getTime() ? now : new Date(prev)
    next.setDate(next.getDate() + 7)

    return `${next.getFullYear()}/${
      next.getMonth() + 1
    }/${next.getDate()} 21:00`
  }

  createDate(): string {
    // avoiding label
    if (this.lastRow == 1) return this.nextNine(new Date())
    const lastDate = this.sheet.getRange(this.lastRow, 1).getValue()
    return this.nextNine(new Date(lastDate))
  }

  addContent(row: Content) {
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

  removeContent(id: string) {
    // ['Date','Message','Link','Media URLs','Title','Labels'] 4th has the id => 5th col 1based index
    const row = this.colOf(5, id)
    if (row == -1) return
    this.sheet.deleteRow(row)
  }
}

class Contents extends Table<contentName, Content> {
  private findRow(col: number, val: string) {
    const ix = this.rowOf(col, val)
    if (ix == -1) return null
    // index +1, label +1
    const data = this.sheet
      .getRange(ix + 2, 1, 1, this.label.length)
      .getValues()
    return this.arr2obj(data[0])
  }

  findRowById(id: string): Content | null {
    return this.findRow(1, id)
  }

  findRowByUrl(url: string): Content | null {
    return this.findRow(3, url)
  }

  insert(data: Content) {
    this.create(data)
  }

  toggleBoolean(type: 'permission' | 'scheduled', num: number, val: boolean) {
    const col = type == 'permission' ? 8 : type == 'scheduled' ? 9 : 0
    this.sheet.getRange(num, col).setValue(val)
  }

  allowPermission(id: string) {
    // index +1, label +1
    const num = this.rowOf(1, id) + 2
    this.toggleBoolean('permission', num, true)
  }

  undoPermission(id: string) {
    // index +1, label +1
    const num = this.rowOf(1, id) + 2
    this.toggleBoolean('permission', num, false)
  }

  markAsDone(id: string) {
    const num = this.rowOf(1, id) + 2
    this.toggleBoolean('scheduled', num, true)
  }
}

class Database {
  csv: Csv
  content: Contents
  sprd: GoogleAppsScript.Spreadsheet.Spreadsheet
  constructor(spreadSheetId: string) {
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

  getContent(id: string): Response {
    const data = this.content.findRowById(id)
    const response = {
      error: data == null && new Error(`Id ${id} is not on the table`),
      data
    }
    return response
  }

  insertContent(
    data: Omit<Content, 'id' | 'permission' | 'scheduled'>
  ): Response {
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

  confirmContent(id: string, type: 'confirm' | 'undo'): Response {
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

  markAsScheduled(): Response {
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

export default new Database('1SoX49SBBw2xqrF4I71zQlKIYj5XP1dMSePt11cd3UR8')
