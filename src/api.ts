import { json } from './lib'
import db from './db'

// returns data by url
function doGet(
  e: GoogleAppsScript.Events.DoGet
): GoogleAppsScript.Content.TextOutput {
  try {
    const { id } = e.parameter
    const data = db.getContent(id)
    return json(data)
  } catch (e) {
    return json({ error: e.message })
  }
}

// adds content to the content table
// update permission state
// mark as used
function doPost(
  e: GoogleAppsScript.Events.DoPost
): GoogleAppsScript.Content.TextOutput {
  try {
    const { type } = e.parameter
    const jsdt = JSON.parse(e.postData.contents)
    if (type == 'insert') {
      const res = db.insertContent(jsdt)
      return json(res)
    }
    if (type == 'update') {
      const res = db.confirmContent(jsdt.id)
      return json(res)
    }

    return json({ message: 'Nothing happened!' })
  } catch (e) {
    return json({ error: e.message })
  }
}

/**
 * TODO
 *
 * - create api fns
 * - create menu to
 *  - update csv
 *  - mark csv as done
 */
