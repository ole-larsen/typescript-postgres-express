import * as XLSX from 'xlsx/xlsx.mjs'
import config from '../../config'
const backend = {
  data: function () {
    const serverUri = location.host !== 'localhost:8080' ? location.host : 'localhost'
    const serverPort = config.env.SERVER_PORT ? config.env.SERVER_PORT : 3010
    const wsPort = config.env.WS_PORT ? config.env.WS_PORT : 2053
    return {
      // "(.*?)"
      url: location.host !== 'localhost:8080' ? `//${serverUri}` : `http://localhost:${serverPort}`,
      socketUrl: location.host !== 'localhost:8080' ? `wss://${serverUri}:${wsPort}` : `wss://localhost:${wsPort}`,
    }
  },
  watch: {

  },
  methods: {
    exportTable (table, fields, filename, format) {
      setTimeout(() => {
        const wb = XLSX.utils.book_new()
        let ws1 = null
        const mapped = table.map(rec => {
          const conv = {}
          fields.forEach(field => conv[field.key] = rec[field.key])
          return conv
        })

        ws1 = XLSX.utils.json_to_sheet(mapped, {
          header: fields.map(field => field.key)
        })
        const labels = fields.map(field => field.key)
        XLSX.utils.sheet_add_aoa(ws1, [labels], {origin: 0})
        ws1['!cols'] = fields.map((t) => {
          if (t) {
            return {
              width: 80 / 6.5
            }
          }
        })
        // console.log(ws1['!cols'])
        XLSX.utils.book_append_sheet(wb, ws1, 'Sheet1')
        filename = filename || 'export'
        switch (format) {
          case 'csv':
            if (!filename.endsWith('.csv')) filename = filename + '.csv'
            break
          case 'xls':
            if (!filename.endsWith('.xls')) filename = filename + '.xls'
            break
          case 'xlsx':
          case 'excel':
          default:
            if (!filename.endsWith('.xlsx')) filename = filename + '.xlsx'
            break
        }
        if (filename.endsWith('.xlsx'))
          XLSX.writeFile(wb, filename, {
            compression: 'DEFLATE',
            compressionOptions: {
              level: 6
            }
          })
        else
          XLSX.writeFile(wb, filename)
      }, 500)
    }
  }
}
export default backend
