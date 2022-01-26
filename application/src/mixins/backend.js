import config from '../../config'
const backend = {
  data: function () {
    const serverUri = location.host !== 'localhost:8080' ? location.host : 'localhost'
    const serverPort = config.env.SERVER_PORT ? config.env.SERVER_PORT : 3010
    const wsPort = config.env.WS_PORT ? config.env.WS_PORT : 2053
    return {
      // "(.*?)"
      url: location.host !== 'localhost:8080' ? `//${serverUri}` : `//localhost:${serverPort}`,
      socketUrl: location.host !== 'localhost:8080' ? `wss://${serverUri}:${wsPort}` : `wss://localhost:${wsPort}`
    }
  }
}
export default backend
