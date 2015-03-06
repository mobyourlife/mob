var numeral = require('numeral');

var Fanpage = require('../models/fanpage');
var Ticket = require('../models/ticket');

module.exports = function(user, fanpage, preco, sucesso, falha) {
    var pagseguro = require('pagseguro')
    var pag = new pagseguro('financeiro@fmobstudio.com.br', '74A281ED12C24647AA703090E25819BA');
    
    // registra a tentativa de pagamento
    var ticket = new Ticket();
    ticket.ref = fanpage;
    ticket.time = Date.now();
    ticket.time.validity = { months: 12, days: 0 };
    ticket.payment.value = preco;
    
    ticket.save(function(err) {
        if (err) {
            falha();
            throw err;
            return;
        }
        
        // moeda e referência
        pag.currency('BRL');
        pag.reference(ticket.id);
        
        // adicionando item
        pag.addItem({
            id: 1,
            description: 'Site sincronizado com Facebook',
            amount: numeral(ticket.payment.value).format('0.00').toString(),
            quantity: 1,
            weight: 0
        });
        
        // dados do comprador
        pag.buyer({
            name: user.facebook.name,
            email: user.facebook.email
        });
        
        // urls de retorno
        pag.setRedirectURL('https://www.mobyourlife.com.br/pagseguro/callback');
        pag.setNotificationURL('https://www.mobyourlife.com.br/pagseguro/notification');
        
        // envia os dados ao pagseguro
        pag.send(function(err, ret) {
            if (err) {
                falha();
                throw err;
                return;
            }
            
            var regex = /<code>([a-zA-Z0-9]{32})<\/code>.*<date>(.*)<\/date>/;
            var result = ret.match(regex);
            
            if (result) {
                ticket.payment.code = result[1];
                ticket.payment.time = result[2];
                
                ticket.save(function(err) {
                    if (err) {
                        falha();
                        throw err;
                        return;
                    }
                    
                    var uri = 'https://pagseguro.uol.com.br/v2/checkout/payment.html?code=' + ticket.payment.code;
                    sucesso(uri);
                });
            } else {
                falha();
                return;
            }
        });
    });
}
