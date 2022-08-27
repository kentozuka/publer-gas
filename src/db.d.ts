type TableName = csvName | contentName
type TableLabel = (keyof CSV)[] | (keyof Content)[]

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
