/** Parse RFC 4180 style CSV, including quoted commas, line breaks, and escaped quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
    } else if (character === '"') {
      if (field.length) throw new Error('CSV contains a quote inside an unquoted field.')
      quoted = true
    } else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (quoted) throw new Error('CSV has an unterminated quoted field.')
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((items) => items.some((item) => item.trim().length > 0))
}

export function createCsv(rows: string[][]): string {
  return rows.map((row) => row.map((value) => {
    const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value
    return `"${safeValue.replaceAll('"', '""')}"`
  }).join(',')).join('\r\n')
}
