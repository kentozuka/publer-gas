function doGet() {
  const resData = JSON.stringify({ message: 'Hello World!' })
  // ContentServiceを利用して、responseを作成
  const output = ContentService.createTextOutput()
  output.setMimeType(ContentService.MimeType.JSON)
  output.setContent(resData)
  return output
}
