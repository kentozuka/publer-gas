type contentName = 'content'
interface Content {
  id: string
  service: string
  url: string
  username: string
  caption: string
  source: string
  permission: string
  scheduled: string
  added: string
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

/* = = = = = = = = = = = = = = = = = = = */

abstract class Table<NAME extends TableName, OBJ extends TableObject> {
  public sheet: GoogleAppsScript.Spreadsheet.Sheet
  private queryTableName = 'query' as const

  constructor(
    private ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    private name: NAME,
    private label: (keyof OBJ)[]
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

  private arr2obj(row: any[]) {
    return row.reduce((pr, cr, ix) => ({ ...pr, [this.label[ix]]: cr }), {})
  }

  private obj2arr(obj: OBJ) {
    return Object.values(obj)
  }

  private getRow(rowNum: number) {
    return this.sheet.getRange(rowNum, 1, 1, this.label.length)
  }

  private clear(tableName: NAME | typeof this.queryTableName) {
    const sht = this.ss.getSheetByName(tableName)
    if (sht == null) return
    sht.clear()
  }

  private createQueryTable() {
    const tmp = this.ss.insertSheet()
    tmp.setName(this.queryTableName)
    return tmp
  }

  private getQueryTable() {
    let cand = this.ss.getSheetByName(this.queryTableName)
    if (cand == null) {
      cand = this.createQueryTable()
    }
    return cand
  }

  private resetQueryTable() {
    this.clear(this.queryTableName)
  }

  protected query(query: string): OBJ[][] {
    const tmp = this.getQueryTable()
    tmp.getRange(1, 1).setValue(query)
    const data = tmp.getDataRange().getValues()
    this.resetQueryTable()
    return data.map((row) => this.arr2obj(row))
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

class Csv extends Table<csvName, CSV> {}

class Contents extends Table<contentName, Content> {}

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
      'permission',
      'scheduled',
      'added'
    ])
  }

  getCSV(): string[][] {
    return [['test']]
  }

  getContent(url: string): Content {
    return {
      id: 'id',
      service: 'service',
      url: 'url',
      username: 'username',
      caption: 'caption',
      source: 'source',
      permission: 'permission',
      scheduled: 'scheduled',
      added: 'added'
    }
  }

  insertContent(data: any) {}

  confirmContent(url: string) {}
}

export default new Database('1SoX49SBBw2xqrF4I71zQlKIYj5XP1dMSePt11cd3UR8')
