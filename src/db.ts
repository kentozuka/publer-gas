abstract class Table<NAME extends TableName, LABEL extends TableLabel> {
  public sheet: GoogleAppsScript.Spreadsheet.Sheet

  constructor(
    private ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    private name: NAME,
    private label: LABEL
  ) {
    this.sheet = this.cine()
  }

  private cine() {
    //create if not exist = cine
    let cand = this.ss.getSheetByName(this.name)
    if (cand == null) {
      cand = this.ss.insertSheet()
      cand.setName(this.name)
      cand.appendRow(['uuid', this.label])
    }
    return cand
  }

  private clear(tableName: 'query' | NAME) {
    const sht = this.ss.getSheetByName(tableName)
    if (sht == null) return
    sht.clear()
  }

  private createQueryTable() {
    const tmp = this.ss.insertSheet()
    tmp.setName('query')
    return tmp
  }

  private getQueryTable() {
    let cand = this.ss.getSheetByName('query')
    if (cand == null) {
      cand = this.createQueryTable()
    }
    return cand
  }

  private resetQueryTable() {
    this.clear('query')
  }

  private validKey(key: LABEL[number]) {
    // doesn't know how to deal with this
    return this.label.includes(key as never)
  }

  private fit(data: LABEL[]) {
    const val = this.label.length == data.length
    if (!val) console.log(`Data length ${data.length} will not fit`)
    return val
  }

  query(query: string): { [key: string]: LABEL[number] }[][] {
    const tmp = this.getQueryTable()
    tmp.getRange(1, 1).setValue(query)
    const data = tmp.getDataRange().getValues()
    this.resetQueryTable()
    return data
  }

  objectify(data: string[]) {}

  index(ix: number): string[] {
    const range = this.sheet.getRange(ix + 1, 1, 1, this.label.length)
    return range.getValue()
  }

  append(data: any[]): void {
    if (!this.fit(data)) {
      console.log(`Failed to append ${data.length} data to ${this.name}.`)
      return
    }

    this.sheet.appendRow([Utilities.getUuid(), ...data])
    console.log(`Successfully appended ${data.length} data to ${this.name}.`)
  }

  update(key: LABEL[number], identifier: string, data: string): Content | null {
    if (!this.validKey(key)) {
      console.log(`Update failed on ${key}: ${identifier}`)
      return null
    }
  }

  delete(key: LABEL[number]) {}

  replaceCells(range: string, data: any) {}
}

class Csv extends Table<csvName, (keyof CSV)[]> {}

class Contents extends Table<contentName, (keyof Content)[]> {}

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

  getCSV(): string[][] {}

  getContent(url: string): Content {}

  insertContent(data: any) {}

  confirmContent(url: string) {}
}

export default new Database('1SoX49SBBw2xqrF4I71zQlKIYj5XP1dMSePt11cd3UR8')
