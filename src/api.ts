import { json } from './lib'

// returns data by url
function doGet(
  e: GoogleAppsScript.Events.DoGet
): GoogleAppsScript.Content.TextOutput {
  // const csv = db.getCSV()
  // const content = db.getContent(e.queryString)
  return json({ name: 'get' })
}

// adds content to the content table
// update permission state
// mark as used
function doPost(
  e: GoogleAppsScript.Events.DoPost
): GoogleAppsScript.Content.TextOutput {
  // const newdata = db.insertContent(e.parameters)
  // const upd = db.confirmContent(e.postData)
  return json({ name: 'post' })
}
