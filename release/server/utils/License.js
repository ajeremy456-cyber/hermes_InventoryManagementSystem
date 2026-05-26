const { execSync } = require('child_process')
const db = require('../utils/database')

class LicenseManager {
  constructor() {
    this.LICENSE_KEY = 'system_license'
    this.LICENSE_BOARD_SERIAL = 'board_serial'
  }

  async getBoardSerial() {
    try {
      const result = execSync(
        'powershell -Command "(Get-WmiObject win32_baseboard).SerialNumber"',
        { encoding: 'utf8', timeout: 5000 }
      )
      return result.trim().replace(/\s+/g, '').toUpperCase()
    } catch (error) {
      console.error('讀取主機板序號失敗:', error.message)
      return null
    }
  }

  async getStoredLicense() {
    try {
      const row = db.getDb().prepare(
        "SELECT value FROM settings WHERE key_name = ?"
      ).get(this.LICENSE_BOARD_SERIAL)
      return row ? row.value : null
    } catch (error) {
      return null
    }
  }

  async saveLicense(boardSerial) {
    try {
      const existing = db.getDb().prepare(
        "SELECT id FROM settings WHERE key_name = ?"
      ).get(this.LICENSE_BOARD_SERIAL)

      if (existing) {
        db.getDb().prepare(
          "UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key_name = ?"
        ).run(boardSerial, this.LICENSE_BOARD_SERIAL)
      } else {
        db.getDb().prepare(
          "INSERT INTO settings (key_name, value) VALUES (?, ?)"
        ).run(this.LICENSE_BOARD_SERIAL, boardSerial)
      }
      return true
    } catch (error) {
      console.error('儲存授權失敗:', error.message)
      return false
    }
  }

  async verify() {
    const currentBoardSerial = await this.getBoardSerial()
    
    if (!currentBoardSerial) {
      return { valid: false, error: '無法讀取主機板序號' }
    }

    const storedSerial = await this.getStoredLicense()

    if (!storedSerial) {
      const saved = await this.saveLicense(currentBoardSerial)
      if (saved) {
        console.log(`✅ 系統已綁定主機板序號: ${currentBoardSerial}`)
        return { valid: true, message: '首次啟動，已綁定授權', isNew: true }
      } else {
        return { valid: false, error: '授權綁定失敗' }
      }
    }

    if (currentBoardSerial !== storedSerial) {
      console.error(`❌ 授權驗證失敗！`)
      console.error(`   預期: ${storedSerial}`)
      console.error(`   實際: ${currentBoardSerial}`)
      return { valid: false, error: '主機板序號不符，授權無效' }
    }

    return { valid: true, message: '授權驗證通過' }
  }
}

module.exports = new LicenseManager()