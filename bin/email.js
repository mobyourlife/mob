var nodemailer = require('nodemailer');

module.exports = function() {
    var enviarEmail = function(sender_name, sender_email, sender_message, callbackSuccess, callbackError) {
        // create reusable transporter object using SMTP transport 
        var transporter = nodemailer.createTransport({
            host: 'mail.mobyourlife.com.br',
            port: 587,
            auth: {
                user: 'nao-responder@mobyourlife.com.br',
                pass: 'JJ6]\\2N3}78a+p\\'
            }
        });

        // NB! No need to recreate the transporter object. You can use 
        // the same transporter object for all e-mails 

        // setup e-mail data with unicode symbols 
        var mailOptions = {
            from: sender_name + ' <' + sender_email + '>', // sender address 
            to: 'suporte@mobyourlife.com.br', // list of receivers 
            subject: 'Contato pelo site', // Subject line 
            text: sender_message, // plaintext body 
            html: sender_message // html body 
        };

        // send mail with defined transport object 
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
                callbackError(error);
            }else{
                console.log('Message sent: ' + info.response);
                callbackSuccess();
            }
        });
    }
    
    return {
        enviarEmail: enviarEmail
    }
}
