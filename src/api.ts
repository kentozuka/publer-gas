import { json } from './lib'
import db from './db'

function onOpne() {
  db.addMenu()
}

function csvConversion() {
  db.markAsScheduled()
}

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
      const res = db.confirmContent(jsdt.id, 'confirm')
      return json(res)
    }

    if (type == 'undo') {
      const res = db.confirmContent(jsdt.id, 'undo')
      return json(res)
    }

    return json({ message: 'Nothing happened!' })
  } catch (e) {
    return json({ error: e.message })
  }
}

/**
 * ToDo
 * - create csv update script
 * - look for a service that can take data from ig/tk (including src)
 * - create frontend
 * - integrate everything
 */
