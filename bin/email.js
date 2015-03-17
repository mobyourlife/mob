var nodemailer = require('nodemailer');

module.exports = function() {
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
            if(error){
                console.log(error);
                if (callbackError) {
                    callbackError(error);
                }
            }else{
                console.log('Message sent: ' + info.response);
                if (callbackSuccess) {
                    callbackSuccess();
                }
            }
        });
    }
    
    return {
        enviarEmail: enviarEmail
    }
}
