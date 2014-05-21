module.exports = function() {

    var config = {
        production: {
            server: {
                host: process.env.OPENSHIFT_NODEJS_IP,
                port: process.env.OPENSHIFT_NODEJS_PORT,
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
                host: '127.0.0.1',
                port: 1200
            },
            mongo: {
                host: 'localhost',
                port: 27017,
                user: '',
                pass: '',
                name: 'chat',
            }
        }
    };





    var env = process.env.NODE_ENV || 'development';



    var aC = null;
    switch (env) {
        case 'production':
            aC = config.production;
            break;
        default:
            aC = config.development;
            break;
    }

    config.getSettings = function() {
        return aC;
    }

    config.connectionString = function() {
        var DB = aC.mongo;
        var string = 'mongodb://' + DB.user + ':' +
            DB.pass + '@' + DB.host + ':' +
            DB.port + '/' + DB.name;
        return string;
    };

    return config;
}