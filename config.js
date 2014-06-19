 var config = {

  development: {
    server: {
      host: process.env.IP || '127.0.0.1',
      port: process.env.PORT || 3000
    }
  }
  
}

module.exports = config;