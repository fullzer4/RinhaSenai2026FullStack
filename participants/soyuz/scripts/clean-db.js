const { unlinkSync } = require('node:fs')
const { join } = require('node:path')

const root = join(__dirname, '..')

for (const file of ['data.db', 'data.db-wal', 'data.db-shm', 'data.db-journal']) {
  try {
    unlinkSync(join(root, file))
    console.log(`removed ${file}`)
  } catch {
    // file may not exist or be locked — stop server before cleaning
  }
}
