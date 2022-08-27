export const json = function (data: any) {
  const str = JSON.stringify(data)
  const res = ContentService.createTextOutput()
    .setContent(str)
    .setMimeType(ContentService.MimeType.JSON)

  return res
}
