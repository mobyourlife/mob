// https://www.npmjs.com/package/mysql

var mysql = require('mysql');
var database = require('../config/database');
var connection = mysql.creationConnection({
    host: database.dns.hostname,
    database: database.dns.database,
    user: database.dns.user,
    password: database.dns.password
});

module.exports = function() {
    var getDomainId = function(connection, domain_name, callback) {
        connection.query('SELECT id FROM `domains` WHERE `name` = \'' + domain_name + '\';', function(err, rows, fields) {
            if (err)
                throw err;
            
            if (callback) {
                if (rows && rows.length != 0) {
                    callback(rows[0].id);
                } else {
                    //
                }
            }
        });
    }
    
    var insertDomain(domain_name) {
        domain_name = domain_name.toLowerCase().replace('www.', '');
        
        connection.connect();
        
        getDomainId(connection, domain_name, function(id) {
            if (!id) {
                connection.query('INSERT INTO `domains` (`name`, `master`, `type`) VALUES (\'' + domain_name + '\', \'54.94.142.253\', \'MASTER\');', function(err, rows, fields) {
                    if (err)
                        throw err;
                });
            }
        });
        
        connection.end();
    }
    
    var removeDomain(domain_name) {
    }
    
    return {
        insertDomain: insertDomain,
        removeDomain: removeDomain
    }
}
