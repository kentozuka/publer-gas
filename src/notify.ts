const recepient = 'kento@intd.jp'

export function sendNotification(type: string) {
  GmailApp.sendEmail(
    recepient,
    `[${type}]新たなリクエストが送信されました。`,
    'Open Publer to see what happened'
  )
}
