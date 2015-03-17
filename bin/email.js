var fs = require('fs');
var nodemailer = require('nodemailer');

// models
var Fanpage = require('../models/fanpage');
var User = require('../models/user');

module.exports = function() {
    var montarEmail = function(page_id, callback) {
        if (callback) {
            Fanpage.findOne({ '_id': page_id }, function(err, fanpage) {
                if (err)
                    throw err;

                if (fanpage) {
                    User.findOne({ _id: fanpage.creation.user }, function(err, user) {
                        if (err)
                            throw err;

                        if (user) {
                            fs.readFile('../email/bem-vindo.html', function(err, html) {
                                if (err)
                                    throw err;

                                html = html.toString();
                                html = html.replace('#{user.facebook.name}', user.facebook.name);
                                html = html.replace('#{fanpage._id}', fanpage._id);
                                html = html.replace('#{fanpage.facebook.name}', fanpage.facebook.name);
                                
                                callback(html, user.facebook.email);
                            });
                        } else {
                            console.log('Não achou o usuário');
                        }
                    });
                } else {
                    console.log('Não achou a fanpage');
                }
            });
        }
    }
    
    var enviarEmail = function(sender_name, sender_email, subject, message, receiver_email, callbackSuccess, callbackError) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        
        // create reusable transporter object using SMTP transport 
        var transporter = nodemailer.createTransport({
            host: 'mail.mobyourlife.com.br',
            port: 587,
            auth: {
                user: 'nao-responder@mobyourlife.com.br',
                pass: '#X0ScRC%(FVN=C0'
            }
        });

        // NB! No need to recreate the transporter object. You can use 
        // the same transporter object for all e-mails 

        // setup e-mail data with unicode symbols 
        var mailOptions = {
            from: sender_name + ' <' + sender_email + '>', // sender address 
            to: receiver_email, // list of receivers 
            subject: subject, // Subject line 
            text: message, // plaintext body 
            html: message // html body 
        };

        // send mail with defined transport object 
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
                if (callbackError) {
                    callbackError(error);
                }
            } else {
                console.log('Email enviado com sucesso para ' + receiver_email + '! ' + info.response);
                if (callbackSuccess) {
                    callbackSuccess();
                }
            }
        });
    }
    
    return {
        montarEmail: montarEmail,
        enviarEmail: enviarEmail
    }
}
