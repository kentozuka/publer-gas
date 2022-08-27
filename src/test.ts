import db from './db'

function testConfirmation() {
  const res = db.confirmContent('kjisadf')
}

function testAppend() {
  const test = db.getContent('adsklfn')
  console.log(Object.values(test).map((x) => typeof x))
}

function testInsert() {
  const res = db.insertContent({
    service: 'service',
    url: 'url',
    username: 'username',
    caption: 'caption',
    source: 'source',
    embed: 'embed'
  })

  console.log(res)
}
