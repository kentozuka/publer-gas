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
  Media: string
  URLs: string
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
    private ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
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
  returnCSV() {}

  formatContentForCSV() {}

  resetCSV() {
    this.clearDataRange()
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

    const data = this.sheet
      .getRange(ix + 1, 1, 1, this.label.length)
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
      'Media',
      'URLs',
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
      error: alr !== null && new Error('This url is alredy in the table'),
      data: 'Eerror adding an entry'
    }
    if (alr == null) {
      this.content.insert({
        id: Utilities.getUuid(),
        ...data,
        permission: false,
        scheduled: false
      })
      return response
    }

    response.data = `${data.url} is added to the table`
    return response
  }

  confirmContent(id: string): Response {
    const data = this.content.findRowById(id)
    const response = {
      error: data == null && new Error(`${id} not found on the table`),
      data: 'Cannot confirm request'
    }
    if (data == null) return response

    this.content.allowPermission(id)
    response.data = `Updated ${id}!`

    return response
  }
}

export default new Database('1SoX49SBBw2xqrF4I71zQlKIYj5XP1dMSePt11cd3UR8')
