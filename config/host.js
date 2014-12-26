var Config = {
    production: {
        server: {
            host: process.env.OPENSHIFT_NODEJS_IP,
            port: process.env.OPENSHIFT_NODEJS_PORT
        },
        mongo: {
            host: process.env.OPENSHIFT_MONGODB_DB_HOST,
            port: process.env.OPENSHIFT_MONGODB_DB_PORT,
            user: process.env.OPENSHIFT_MONGODB_DB_USERNAME,
            pass: process.env.OPENSHIFT_MONGODB_DB_PASSWORD,
            name: 'chat'
        }
    },
    development: {
        server: {
            host: '10.0.33.34',
            port: 1200
        },
        mongo: {
            host: 'localhost',
            port: 27017,
            user: '',
            pass: '',
            name: 'chat'
        }
    },
    env: function () {
        return process.env.NODE_ENV || 'development';
    },
    settings: function () {
        var settings = null;
        switch (this.env()) {
            case 'production':
                settings = this.production;
                break;
            default:
                settings = this.development;
                break;
        }
        return settings;
    },
    connectionString: function(){
        var DB = this.settings().mongo;
        return 'mongodb://' + DB.user + ':' + DB.pass + '@' + DB.host + ':' + DB.port + '/' + DB.name;
    }
};

module.exports = Config;