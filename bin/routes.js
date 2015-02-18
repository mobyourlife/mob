// load up libraries
var moment = require('moment');
var URL = require('url-parse');
var numeral = require('numeral');
var pagamento = require('../bin/pagamento');
var defaults = require('../config/defaults');
var sensitive = require('../config/sensitive');

// helpers
Number.prototype.formatMoney = function(c, d, t){
var n = this, 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "," : d, 
    t = t == undefined ? "." : t, 
    s = n < 0 ? "-" : "", 
    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };

// check if is admin
var validateAdmin = function(user) {
    for (f = 0; f < user.fanpages.length; f++) {
        if (user.fanpages[f].id == defaults.fbadmin) {
            return true;
        }
    }
    return false;
};

// setup i18n
moment.locale('pt-br');

// load up the models
var Fanpage            = require('../models/fanpage');
var Domain             = require('../models/domain');
var Photo              = require('../models/photo');
var Feed               = require('../models/feed');
var Ticket             = require('../models/ticket');

// check if it's top domain or any subdomain
validateSubdomain = function(uri, res, callbackTop, callbackSubdomain) {
    var parsed = new URL(uri);
    var hostname = parsed.hostname;
    var subdomain = hostname.split('.')[0];
    
    if (hostname == 'www.mobyourlife.com.br') {
        callbackTop();
    } else {
        Domain.findOne({'_id': hostname }, function(err, found) {
            if (found) {
                Fanpage.findOne({'_id': found.ref}, function(err, found) {
                    if (found) {
                        callbackSubdomain(found);
                    } else {
                        res.redirect('http://www.mobyourlife.com.br');
                    }
                });
            } else {
                res.redirect('http://www.mobyourlife.com.br');
            }
        });
    }
}

// app/routes.js
module.exports = function(app, passport, FB) {
    
    // raiz
    app.get('/', function(req, res) {
        res.redirect('/inicio');
    });

    // início
    app.get('/inicio', function(req, res) {
        validateSubdomain(req.headers.host, res, function() {
            res.render('index', { link: 'inicio', auth: req.isAuthenticated(), user: req.user });
        }, function(userFanpage) {
            res.render('user-index', { link: 'inicio', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage });
        });
    });

    // sobre
    app.get('/sobre', function(req, res) {
        validateSubdomain(req.headers.host, res, function() {
            res.render('404', { link: 'sobre', auth: req.isAuthenticated(), user: req.user });
        }, function(userFanpage) {
            
            var fanpageInfo = [
                { key: 'Sobre', value: userFanpage.facebook.about },
                { key: 'Descrição', value: userFanpage.facebook.description },
                { key: 'Categoria', value: userFanpage.facebook.category, list: userFanpage.facebook.category_list }, // category list
                { key: 'Curtidas', value: userFanpage.facebook.stats.likes },
                { key: 'Informações gerais', value: userFanpage.facebook.info.general_info },
                
                /* bands */
                { key: 'Membros da banda', value: userFanpage.facebook.info.band.band_members },
                { key: 'Empresário', value: userFanpage.facebook.info.band.booking_agent },
                { key: 'Contato da imprensa', value: userFanpage.facebook.info.band.press_contact },
                { key: 'Cidade de origem', value: userFanpage.facebook.info.band.hometown },
                { key: 'Gravadora', value: userFanpage.facebook.info.band.record_label },
                
                /* companies */
                { key: 'Visão geral', value: userFanpage.facebook.info.company.company_overview },
                { key: 'Fundada em', value: userFanpage.facebook.info.company.founded },
                { key: 'Missão', value: userFanpage.facebook.info.company.mission },
                
                /* films */
                { key: 'Dirigido por', value: userFanpage.facebook.info.film.directed_by },
                
                /* restaurants and night life */
                { key: 'Trajes', value: userFanpage.facebook.info.foodnight.attire },
                { key: 'Gerente geral', value: userFanpage.facebook.info.foodnight.general_manager },
                { key: 'Faixa de preço', value: userFanpage.facebook.info.foodnight.price_range },
                
                /* restaurants */
                { key: 'Serviços', value: userFanpage.facebook.info.foodnight.restaurant.services },
                { key: 'Especialidades', value: userFanpage.facebook.info.foodnight.restaurant.specialties },
                
                /* personalities */
                { key: 'Aniversário', value: userFanpage.facebook.info.personality.birthday },
                
                /* payment options */
                { key: 'Formas de pagamento', value: userFanpage.facebook.info.payment_options }
            ];
            
            res.render('user-sobre', { link: 'sobre', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage, info: fanpageInfo });
        });
    });

    // fotos
    app.get('/fotos', function(req, res) {
        validateSubdomain(req.headers.host, res, function() {
            res.render('404', { link: 'sobre', auth: req.isAuthenticated(), user: req.user });
        }, function(userFanpage) {
            res.render('user-fotos', { link: 'fotos', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage });
        });
    });
    
    // como funciona
    app.get('/como-funciona', function(req, res) {
      res.render('como-funciona', { link: 'como-funciona', auth: req.isAuthenticated(), user: req.user });
    });
    
    // preços
    app.get('/precos', function(req, res) {
      res.render('precos', { link: 'precos', auth: req.isAuthenticated(), user: req.user, price: sensitive.price.formatMoney() });
    });
               
    // dúvdas frequentes
    app.get('/duvidas-frequentes', function(req, res) {
        res.render('duvidas-frequentes', { link: 'duvidas-frequentes', auth: req.isAuthenticated(), user: req.user });
    });
    
    // contato
    app.get('/contato', function(req, res) {
        validateSubdomain(req.headers.host, res, function() {
            res.render('contato', { link: 'contato', auth: req.isAuthenticated(), user: req.user });
        }, function(userFanpage) {
            res.render('user-contato', { link: 'contato', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage });
        });
    });
    
    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    app.get('/login', function(req, res) {
        validateSubdomain(req.headers.referer ? req.headers.referer : req.headers.host, res, function() {
            res.redirect('/auth/facebook');
        }, function(userFanpage) {
            req.session.backto = req.headers.referer;
            res.redirect('/auth/facebook');
        });
    });
    
    app.get('/login/callback', function(req, res) {
        if (req.session.backto) {
            res.redirect(req.session.backto);
        } else {
            res.redirect('/gerenciamento');
        }
    });
    
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope : 'email,manage_pages'
    }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect : '/login/callback',
        failureRedirect : '/'
    }));
    
    // gerenciamento, página protegida
    app.get('/gerenciamento', isLoggedIn, function(req, res) {
        var ids = Array();
        for (i = 0; i < req.user.fanpages.length; i++) {
            ids.push(req.user.fanpages[i].id);
        }

        Fanpage.find({'_id': { $in: ids }}, function(err, records) {
            ownedFanpages = records;

            ownedFanpages.sort(function(a, b) {
                if (a.facebook.name && b.facebook.name) {
                    var x = a.facebook.name.toLowerCase(), y = b.facebook.name.toLowerCase();
                    if (x < y) return -1;
                    if (x > y) return 1;
                }
                return 0;
            });

            var isAdmin = validateAdmin(req.user);
            res.render('gerenciamento', { auth: req.isAuthenticated(), user: req.user, fanpages: ownedFanpages, isAdmin: isAdmin });
        });
    });
    
    // criação do novo site, página protegida
    app.get('/novo-site/:id(\\d+)', isLoggedIn, function(req, res) {
        FB.setAccessToken(req.user.facebook.token);
        FB.api('/' + req.params.id, { locale: 'pt_BR', fields: ['id', 'name', 'about', 'link', 'picture', 'access_token'] }, function(records) {
            if (records) {
                Fanpage.findOne({ _id : records.id }, function(err, found) {
                    var newFanpage = null;
                    
                    if (found) {
                        newFanpage = found;
                    } else {
                        newFanpage = new Fanpage();
                        newFanpage._id = records.id;
                        newFanpage.facebook.name = records.name;
                        newFanpage.facebook.about = records.about;
                        newFanpage.facebook.link = records.link;
                        newFanpage.facebook.picture = records.picture.data.url;
                        
                        /* creation info */
                        newFanpage.creation.time = Date.now();
                        newFanpage.creation.user = req.user;
                        
                        /* billing info */
                        var ticket = new Ticket();
                        ticket.time = Date.now();
                        ticket.validity.months = 0;
                        ticket.validity.days = 7;
                        ticket.coupon.reason = 'signup_freebie';
                        
                        newFanpage.billing.active = true;
                        newFanpage.billing.evaluation = true;
                        newFanpage.billing.expiration = moment()
                            .add(ticket.validity.months, 'months')
                            .add(ticket.validity.days, 'days');
                        
                        ticket.save(function(err) {
                            if (err)
                                throw err;
                        });
                    }

                    // save the new fanpage to the database
                    newFanpage.save(function(err) {
                        if (err)
                            throw err;
                        
                        // create default subdomain
                        var domain = new Domain();
                        domain._id = newFanpage._id + '.mobyourlife.com.br';
                        domain.ref = newFanpage;
                        
                        domain.save(function(err) {
                            if (err)
                                throw err;
                            
                            // if successful, return a success message
                            res.render('novo-site-sucesso', { auth: req.isAuthenticated(), user: req.user, newFanpage: newFanpage });
                        });
                    });
                });
            }
        });
        
    });
    
    // escolha do novo site, página protegida
    app.get('/novo-site', isLoggedIn, function(req, res) {
        FB.setAccessToken(req.user.facebook.token);
        FB.api('/me/accounts', { locale: 'pt_BR', fields: ['id', 'name', 'about', 'link', 'picture'] }, function(records) {
            if (records.data) {
                var pages_list = Array();
                var ids_list = Array();
                
                records.data.forEach(function(p) {
                    var item = {
                        id: p.id,
                        name: p.name,
                        about: p.about,
                        link: p.link,
                        picture: p.picture.data.url
                    };
                    pages_list.push(item);
                    ids_list.push(p.id);
                });
                
                pages_list.sort(function(a, b) {
                    var x = a.name.toLowerCase(), y = b.name.toLowerCase();
                    if (x < y) return -1;
                    if (x > y) return 1;
                    return 0;
                });
                
                Fanpage.find({'facebook.id': { $in: ids_list }}, function(err, records) {
                    var built_list = Array();
                    
                    if (records) {
                        for (i = 0; i < pages_list.length; i++) {
                            var existe = false;
                            
                            for (j = 0; j < records.length; j++) {
                                if (pages_list[i].id == records[j].facebook.id) {
                                    console.log('Já existe ' + pages_list[i].name + '.');
                                    existe = true;
                                }
                            }
                            
                            if (existe === false) {
                                console.log('Não existe ' + pages_list[i].name + '.');
                                built_list.push(pages_list[i]);
                            }
                        }
                    } else {
                        built_list = pages_list;
                    }
                    
                    res.render('novo-site', { title: 'Criar novo site', auth: req.isAuthenticated(), user: req.user, pages: built_list });
                });
            }
        });
    });
    
    // sair
    app.get('/sair', function(req, res) {
        req.logout();
        res.redirect(req.headers.referer);
    });
    
    // api para sincronização de login
    app.get('/api/login', function(req, res) {
        if (req.isAuthenticated()) {
            res.send({ auth: true, name: req.user.facebook.name });
            // res.send({auth: true, id: req.session.id, username: req.session.username, _csrf: req.session._csrf});
        } else {
            res.status(401).send({ auth: false });
            // res.send(401, {auth: false, _csrf: req.session._csrf});
        }
    });
    
    // api para inclusão de domínio
    app.post('/api/incluirdominio', function(req, res) {
        if (req.body.dominio && req.body.dominio.length != 0 && req.body.fanpageid && req.body.fanpageid.length != 0) {
            var parsed = new URL(req.body.dominio);
            if (parsed) {
                if (parsed.hostname.indexOf(' ') == -1 && parsed.hostname.split('.').length > 1) {
                    Domain.findOne({ '_id': parsed.hostname }, function(err, found) {
                        if (!found) {
                            var d = new Domain();
                            d._id = parsed.hostname;
                            d.ref = req.body.fanpageid;
                            d.status = 'expired';
                            d.creation.time = Date.now();
                            d.creation.user = req.user;

                            d.save(function(err) {
                                if (err)
                                    throw err;

                                res.send({ created: true, dominio: parsed.hostname });
                            });
                        } else {
                            res.send({ created: false, message: 'Nome de domínio já está em uso em outro site!' });
                        }
                    });
                } else {
                    res.send({ created: false, message: 'Nome de domínio inválido!' });
                }
            } else {
                res.send({ created: false, message: 'Nome de domínio inválido!' });
            }
        } else {
            res.send({ created: false, message: 'Digite nome de domínio desejado!' });
        }
    });
    
    // api para exclusão de domínio
    app.post('/api/excluirdominio', function(req, res) {
        if (req.body.dominio && req.body.dominio.length != 0) {
            Domain.remove({ _id: req.body.dominio }, function(err) {
                if (err)
                    throw err;
                
                res.send();
            });
        }
    });
    
    // api para consulta do feed
    app.get('/api/feeds/:before?', function(req, res) {
        validateSubdomain(req.headers.host, res, function() {
            res.render('404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user });
        }, function(userFanpage) {
            var filter = { ref: userFanpage._id };
            
            if (req.params.before) {
                filter.time = { $lte: moment.unix(req.params.before).format() };
            }
            
            console.log('filter: ' + req.params.before);
            
            Feed.find(filter).limit(5).sort('-time').exec(function(err, found) {
                res.send({ feeds: found });
            });
        });
    });
    
    // api para consulta das fotos
    app.get('/api/fotos/:before?', function(req, res) {
        validateSubdomain(req.headers.host, res, function() {
            res.render('404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user });
        }, function(userFanpage) {
            var filter = { ref: userFanpage._id };
            
            if (req.params.before) {
                filter.time = { $lte: moment.unix(req.params.before).format() };
            }
            
            console.log('filter: ' + req.params.before);
            
            Photo.find(filter).limit(15).sort('-time').exec(function(err, found) {
                res.send({ fotos: found });
            });
        });
    });
    
    // opções do domínio
    app.get('/opcoes/dominio/:id', function(req, res) {
        validateSubdomain(req.headers.host, res, function() {
            res.render('404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user });
        }, function(userFanpage) {
            Domain.find({ '_id': req.params.id }, function(err, found) {
                if (found) {
                    res.render('user-opcoes-dominio', { link: 'opcoes-dominio', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage });
                } else {
                    res.render('user-404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage });
                }
            });
        });
    });
    
    // pagamento
    app.get('/opcoes/pagamento', function(req, res) {
        validateSubdomain(req.headers.host, res, function() {
            res.render('404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user });
        }, function(userFanpage) {
            res.render('user-opcoes-pagamento', {
                link: 'opcoes-pagamento',
                auth: req.isAuthenticated(),
                user: req.user,
                fanpage: userFanpage,
                moment: moment,
                numeral: numeral,
                pagamento: {
                    vigencia: {
                        inicio: moment(),
                        fim: moment().add(1, 'years')
                    },
                    preco: sensitive.price
                }
            });
        });
    });
    
    // realizar pagamento
    app.post('/pagseguro/pay', function(req, res) {
        validateSubdomain(req.headers.referer, res, function() {
            res.render('404', { link: 'pagseguro-pay', auth: req.isAuthenticated(), user: req.user });
        }, function(userFanpage) {
            pagamento(req.user, userFanpage, sensitive.price,
                function(uri) {
                    res.send(uri);
                },
                function() {
                    res.status(500).send();
                });
        });
    });
    
    // realizar pagamento
    app.post('/pagseguro/callback', function(req, res) {
        console.log('##############################');
        console.log('callback:');
        console.log(req);
        console.log('##############################');
        console.log('response:');
        console.log(res);
        console.log('##############################');
    });
    
    // realizar pagamento
    app.post('/pagseguro/notification', function(req, res) {
        console.log('##############################');
        console.log('notification:');
        console.log(req);
        console.log('##############################');
        console.log('response:');
        console.log(res);
        console.log('##############################');
    });
    
    // opções do site
    app.get('/opcoes', function(req, res) {
        validateSubdomain(req.headers.host, res, function() {
            res.render('404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user });
        }, function(userFanpage) {
            Domain.find({ 'ref': userFanpage._id }, function(err, found) {
                
                var domains = found.sort(function(a, b) {
                    if (a < b)
                        return -1;
                    if (a > b)
                        return 1;
                    return 0;
                });
                
                res.render('user-opcoes', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage, domains: found, moment: moment });
            });
        });
    });
    
    // templates
    app.get('/templates/modal/save-close', function(req, res) {
        res.render('tmpl-modal-save-close');
    });
    
    app.get('/templates/modal/pay-close', function(req, res) {
        res.render('tmpl-modal-pay-close');
    });
    
    app.get('/templates/modal/delete-close', function(req, res) {
        res.render('tmpl-modal-delete-close');
    });
    
    app.get('/templates/modal/close', function(req, res) {
        res.render('tmpl-modal-close');
    });
    
    // middleware de autenticação
    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.redirect('/login');
        }
    }
};