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

  private clear(tableName: NAME) {
    const sht = this.ss.getSheetByName(tableName)
    if (sht == null) return
    sht.clear()
  }

  protected clearDataRange() {
    const lastRow = this.sheet.getLastRow()
    this.sheet.getRange(1, 1, lastRow, this.label.length).clear()
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
}

class Csv extends Table<csvName, CSV> {
  createCSV() {}

  markCSVasDone() {
    const data = this.sheet.getDataRange().getValues()
    const ids: string[] = data.map((x) => x[5]).flat() // title (=id) is in index 5
    // this.clearDataRange()
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
    const next = now.getTime() > prev.getTime() ? new Date(now) : new Date(prev)
    next.setDate(next.getDate() + 1)

    return `${next.getFullYear()}/${
      next.getMonth() + 1
    }/${next.getDate()} 21:00`
  }

  createDate(): string {
    const lastRow = this.sheet.getLastRow()
    // avoiding label
    if (lastRow == 1) return this.nextNine(new Date())
    const lastDate = this.sheet.getRange(lastRow, 1).getValue()
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
}

class Contents extends Table<contentName, Content> {
  private rowOf(col: number, val: string) {
    const lastRow = this.sheet.getLastRow()
    const boxes = this.sheet.getRange(2, col, lastRow, col).getValues()
    const ids = boxes.flat()
    const ix = ids.indexOf(val)
    return ix
  }

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

  allowPermission(id: string) {
    // index +1, label +1
    const num = this.rowOf(1, id) + 2
    this.sheet.getRange(num, 8).setValue(true)
  }
}

class Database {
  csv: Csv
  content: Contents
  constructor(spreadSheetId: string) {
    const sprd = SpreadsheetApp.openById(spreadSheetId)
    this.csv = new Csv(sprd, 'csv', [
      'Date',
      'Message',
      'Link',
      'Media URLs',
      'Title',
      'Labels'
    ])
    this.content = new Contents(sprd, 'content', [
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

  getCSV(): Response {
    return {
      error: new Error('no erro'),
      data: ''
    }
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
    if (alr == null) {
      this.content.insert({
        id: Utilities.getUuid(),
        ...data,
        permission: false,
        scheduled: false
      })
      response.data = `${data.url} is added to the table`
      return response
    }

    return response
  }

  confirmContent(id: string): Response {
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

    if (row.permission) {
      response.data = `${row.id} is already given permission`
      return response
    }

    this.content.allowPermission(id)
    this.csv.addContent(row)
    response.data = `Updated ${id} and added to the csv table!`
    return response
  }
}

export default new Database('1SoX49SBBw2xqrF4I71zQlKIYj5XP1dMSePt11cd3UR8')
