// load up libraries
var moment = require('moment');
var URL = require('url-parse');
var numeral = require('numeral');
var pagamento = require('../bin/pagamento');
var defaults = require('../config/defaults');
var sensitive = require('../config/sensitive');
var sync = require('../sync')();

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
var TextPage           = require('../models/textpage');

var topMenu = [
            { path: 'inicio', text: 'Início' },
            { path: 'como-funciona', text: 'Como Funciona' },
            { path: 'precos', text: 'Preços' },
            { path: 'duvidas-frequentes', text: 'Dúvidas Frequentes' },
            { path: 'contato', text: 'Contato' }
        ];

// check if it's top domain or any subdomain
validateSubdomain = function(uri, res, callbackTop, callbackSubdomain) {
    var parsed = new URL(uri);
    var hostname = parsed.hostname;
    var subdomain = hostname.split('.')[0];
    
    if (hostname == 'www.mobyourlife.com.br') {
        callbackTop(topMenu);
    } else {
        Domain.findOne({'_id': hostname }, function(err, found) {
            if (found) {
                Fanpage.findOne({'_id': found.ref}, function(err, found) {
                    if (found) {
                        var fanpage = found;
                        TextPage.find({ ref: fanpage._id }, function(err, found) {
                            if (err)
                                throw err;
                            
                            var menu = Array();
                            menu.push({ path: 'inicio', text: 'Início' });
                            menu.push({ path: 'sobre', text: 'Sobre' });
                            
                            for (i = 0; i < found.length; i++) {
                                menu.push({ path: found[0].path, text: found[0].title });
                            }
                            
                            menu.push({ path: 'fotos', text: 'Fotos' });
                            menu.push({ path: 'contato', text: 'Contato' });
                            
                            callbackSubdomain(fanpage, menu);
                        });
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
module.exports = function(app, passport, FB, SignedRequest, csrfProtection, parseForm) {
    
    // raiz
    app.get('/', function(req, res) {
        res.redirect('/inicio');
    });

    // início
    app.get('/inicio', function(req, res) {
        validateSubdomain(req.headers.host, res, function(menu) {
            res.render('index', { link: 'inicio', auth: req.isAuthenticated(), user: req.user, menu: menu });
        }, function(userFanpage, menu) {
            res.render('user-index', { link: 'inicio', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage, menu: menu });
        });
    });
    
    // botões de compartilhamento social
    app.get('/share', function(req, res) {
        console.log('link: ' + req.query.link);
        console.log('label: ' + req.query.label);
        res.render('share', { link: req.query.link, label: req.query.label });
    });

    // sobre
    app.get('/sobre', function(req, res) {
        validateSubdomain(req.headers.host, res, function(menu) {
            res.render('404', { link: 'sobre', auth: req.isAuthenticated(), user: req.user, menu: menu });
        }, function(userFanpage, menu) {
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
            
            res.render('user-sobre', { link: 'sobre', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage, info: fanpageInfo, menu: menu });
        });
    });

    // fotos
    app.get('/fotos', function(req, res) {
        validateSubdomain(req.headers.host, res, function(menu) {
            res.render('404', { link: 'sobre', auth: req.isAuthenticated(), user: req.user, menu: menu });
        }, function(userFanpage, menu) {
            res.render('user-fotos', { link: 'fotos', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage, menu: menu });
        });
    });
    
    // como funciona
    app.get('/como-funciona', function(req, res) {
      res.render('como-funciona', { link: 'como-funciona', auth: req.isAuthenticated(), user: req.user, menu: topMenu });
    });
    
    // preços
    app.get('/precos', function(req, res) {
      res.render('precos', { link: 'precos', auth: req.isAuthenticated(), user: req.user, price: sensitive.price.formatMoney(), menu: topMenu });
    });
               
    // dúvdas frequentes
    app.get('/duvidas-frequentes', function(req, res) {
        res.render('duvidas-frequentes', { link: 'duvidas-frequentes', auth: req.isAuthenticated(), user: req.user, menu: topMenu });
    });
    
    // contato
    app.get('/contato', function(req, res) {
        validateSubdomain(req.headers.host, res, function(menu) {
            res.render('contato', { link: 'contato', auth: req.isAuthenticated(), user: req.user, menu: menu });
        }, function(userFanpage, menu) {
            res.render('user-contato', { link: 'contato', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage, menu: menu });
        });
    });
    
    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    app.get('/login', function(req, res) {
        validateSubdomain(req.headers.referer ? req.headers.referer : req.headers.host, res, function(menu) {
            res.redirect('/auth/facebook');
        }, function(userFanpage, menu) {
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
    
    // administração, página protegida a administradores da fanpage do Mob Your Life
    app.get('/admin', isLoggedIn, isAdmin, function(req, res) {
        Fanpage.find({}, function(err, records) {
            res.render('admin', { auth: req.isAuthenticated(), user: req.user, isAdmin: validateAdmin(req.user), customers: records, menu: topMenu });
        });
    });
    
    app.get('/admin/:id(\\d+)', isLoggedIn, isAdmin, function(req, res) {
        Fanpage.find({ _id: req.params.id }, function(err, records) {
            if (records && records.length == 1) {
                var customer = records[0];
                res.render('admin-customer', { auth: req.isAuthenticated(), user: req.user, isAdmin: validateAdmin(req.user), customer: customer, menu: topMenu });
            } else {
                res.redirect('/admin');
            }
        });
    });
    
    app.get('/admin/:id(\\d+)/textos', isLoggedIn, isAdmin, function(req, res) {
        Fanpage.find({ _id: req.params.id }, function(err, records) {
            if (records && records.length == 1) {
                var customer = records[0];
                TextPage.find({ ref: customer.id }, function(err, records) {
                    res.render('admin-textos', { auth: req.isAuthenticated(), user: req.user, isAdmin: validateAdmin(req.user), customer: customer, textpages: records, menu: topMenu });
                });
            } else {
                res.redirect('/admin');
            }
        });
    });
    
    var adminTextosNova = function (req, res, formdata) {
        Fanpage.find({ _id: req.params.id }, function(err, records) {
            if (records && records.length == 1) {
                var customer = records[0];
                res.render('admin-textos-nova', { auth: req.isAuthenticated(), user: req.user, isAdmin: validateAdmin(req.user), customer: customer, csrfToken: req.csrfToken(), formdata: formdata, menu: topMenu });
            } else {
                res.redirect('/admin');
            }
        });
    }
    
    app.get('/admin/:id(\\d+)/textos/nova', isLoggedIn, isAdmin, csrfProtection, function(req, res) {
        adminTextosNova(req, res);
    });
    
    app.post('/admin/:id(\\d+)/textos/nova', isLoggedIn, isAdmin, parseForm, csrfProtection, function(req, res) {
        if (req.params.id == req.body.fbid) {
            req.checkBody('path', 'Digite um caminho para esta página!').notEmpty();
            req.checkBody('title', 'Digite um título para esta página!').notEmpty();
            req.checkBody('body', 'Digite o conteúdo desta página!').notEmpty();
            
            var errors = req.validationErrors();
            
            if (errors) {
                adminTextosNova(req, res, {
                    path: req.body.path,
                    title: req.body.title,
                    body: req.body.body,
                    errors: errors
                });
            } else {
                Fanpage.find({ _id: req.params.id }, function(err, records) {
                    if (records && records.length == 1) {
                        var customer = records[0];
                        var textpage = new TextPage();
                        textpage.ref = customer;
                        textpage.path = req.body.path;
                        textpage.title = req.body.title;
                        textpage.body = req.body.body;

                        textpage.save(function(err, data) {
                            if (err)
                                throw err;
                        });
                    }
                    res.redirect('/admin/' + req.params.id + '/textos');
                });
            }
        }
    });
    
    var adminTextosEditar = function (req, res, formdata) {
        Fanpage.find({ _id: req.params.id }, function(err, records) {
            if (records && records.length == 1) {
                var customer = records[0];
                TextPage.find({ _id: req.params.textpageid }, function(err, records) {
                    if (records && records.length == 1) {
                        var formdata = records[0];
                        res.render('admin-textos-editar', { auth: req.isAuthenticated(), user: req.user, isAdmin: validateAdmin(req.user), customer: customer, csrfToken: req.csrfToken(), formdata: formdata, menu: topMenu });
                    } else {
                        res.redirect('/admin/' + req.params.id + '/textos');
                    }
                });
            } else {
                res.redirect('/admin');
            }
        });
    }
    
    app.get('/admin/:id(\\d+)/textos/editar/:textpageid', isLoggedIn, isAdmin, csrfProtection, function(req, res) {
        adminTextosEditar(req, res);
    });
    
    app.post('/admin/:id(\\d+)/textos/editar/:textpageid', isLoggedIn, isAdmin, parseForm, csrfProtection, function(req, res) {
        if (req.params.id == req.body.fbid) {
            req.checkBody('path', 'Digite um caminho para esta página!').notEmpty();
            req.checkBody('title', 'Digite um título para esta página!').notEmpty();
            req.checkBody('body', 'Digite o conteúdo desta página!').notEmpty();
            
            var errors = req.validationErrors();
            
            if (errors) {
                adminTextosEditar(req, res, {
                    path: req.body.path,
                    title: req.body.title,
                    body: req.body.body,
                    errors: errors
                });
            } else {
                Fanpage.find({ _id: req.params.id }, function(err, records) {
                    if (records && records.length == 1) {
                        var customer = records[0];
                        TextPage.find({ _id: req.params.textpageid }, function(err, records) {
                            if (records && records.length == 1) {
                                var textpage = records[0];
                                textpage.ref = customer;
                                textpage.path = req.body.path;
                                textpage.title = req.body.title;
                                textpage.body = req.body.body;

                                textpage.save(function(err, data) {
                                    if (err)
                                        throw err;
                                });
                            }
                        });
                    }
                    res.redirect('/admin/' + req.params.id + '/textos');
                });
            }
        }
    });
    
    app.get('/admin/:id(\\d+)/avancado', isLoggedIn, isAdmin, function(req, res) {
        Fanpage.find({ _id: req.params.id }, function(err, records) {
            if (records && records.length == 1) {
                res.render('admin-avancado', { auth: req.isAuthenticated(), user: req.user, isAdmin: validateAdmin(req.user), customer: records[0], menu: topMenu });
            } else {
                res.redirect('/admin');
            }
        });
    });
    
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

            res.render('gerenciamento', { auth: req.isAuthenticated(), user: req.user, fanpages: ownedFanpages, isAdmin: validateAdmin(req.user), menu: topMenu });
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
                            
                            sync.syncFanpage(newFanpage);
                            
                            // if successful, return a success message
                            res.render('novo-site-sucesso', { auth: req.isAuthenticated(), user: req.user, newFanpage: newFanpage, menu: topMenu });
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
                
                for (r = 0; r < records.data.length; r++) {
                    var item = {
                        id: records.data[r].id,
                        name: records.data[r].name,
                        about: records.data[r].about,
                        link: records.data[r].link,
                        picture: records.data[r].picture.data.url
                    };
                    pages_list.push(item);
                    ids_list.push(records.data[r].id);
                }
                
                pages_list.sort(function(a, b) {
                    var x = a.name.toLowerCase(), y = b.name.toLowerCase();
                    if (x < y) return -1;
                    if (x > y) return 1;
                    return 0;
                });
                
                Fanpage.find({ _id: { $in: ids_list } }, function(err, records) {
                    var built_list = Array();
                    
                    if (records) {
                        for (i = 0; i < pages_list.length; i++) {
                            var existe = false;
                            
                            for (j = 0; j < records.length; j++) {
                                if (pages_list[i].id == records[j]._id) {
                                    existe = true;
                                }
                            }
                            
                            if (existe === false) {
                                built_list.push(pages_list[i]);
                            }
                        }
                    } else {
                        built_list = pages_list;
                    }
                    
                    res.render('novo-site', { title: 'Criar novo site', auth: req.isAuthenticated(), user: req.user, pages: built_list, menu: topMenu });
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
            
            var parsed = new URL(req.headers.referer);
            Domain.findOne({ '_id': parsed.hostname }, function(err, found) {
                if (found) {
                    Fanpage.findOne({ '_id': found.ref }, function(err, found) {
                        if (found) {
                            for (i = 0; i < req.user.fanpages.length; i++) {
                                if (req.user.fanpages[i].id == found._id) {
                                    res.send({ auth: true, name: req.user.facebook.name, isowner: true });
                                    return;
                                }
                            }
                        } else {
                            res.send({ auth: true, name: req.user.facebook.name, isowner: false });
                        }
                    });
                } else {
                    res.send({ auth: true, name: req.user.facebook.name, isowner: false });
                }
            });
            
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
        validateSubdomain(req.headers.host, res, function(menu) {
            res.render('404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user, menu: menu });
        }, function(userFanpage, menu) {
            var filter = { ref: userFanpage._id };
            
            if (req.params.before) {
                filter.time = { $lte: moment.unix(req.params.before).format() };
            }
            
            Feed.find(filter).limit(5).sort('-time').exec(function(err, found) {
                for (i = 0; i < found.length; i++) {
                    found[i].unix = moment(found[i].time).unix();
                    found[i].fromNow = moment(found[i].time).fromNow();
                }
                res.render('api-feeds', { feeds: found });
            });
        });
    });
    
    // api para consulta das fotos
    app.get('/api/fotos/:before?', function(req, res) {
        validateSubdomain(req.headers.host, res, function(menu) {
            res.render('404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user, menu: menu });
        }, function(userFanpage, menu) {
            var filter = { ref: userFanpage._id };
            
            if (req.params.before) {
                filter.time = { $lte: moment.unix(req.params.before).format() };
            }
            
            Photo.find(filter).limit(15).sort('-time').exec(function(err, found) {
                res.send({ fotos: found });
            });
        });
    });
    
    // opções do domínio
    app.get('/opcoes/dominio/:id', function(req, res) {
        validateSubdomain(req.headers.host, res, function(menu) {
            res.render('404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user, menu: menu });
        }, function(userFanpage, menu) {
            Domain.find({ '_id': req.params.id }, function(err, found) {
                if (found) {
                    res.render('user-opcoes-dominio', { link: 'opcoes-dominio', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage, menu: menu });
                } else {
                    res.render('user-404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage, menu: menu });
                }
            });
        });
    });
    
    // pagamento
    app.get('/opcoes/pagamento', function(req, res) {
        validateSubdomain(req.headers.host, res, function(menu) {
            res.render('404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user, menu: menu });
        }, function(userFanpage, menu) {
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
                },
                menu: menu
            });
        });
    });
    
    // realizar pagamento
    app.post('/pagseguro/pay', function(req, res) {
        validateSubdomain(req.headers.referer, res, function(menu) {
            res.render('404', { link: 'pagseguro-pay', auth: req.isAuthenticated(), user: req.user, menu: topMenu });
        }, function(userFanpage, menu) {
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
        validateSubdomain(req.headers.host, res, function(menu) {
            res.render('404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user, menu: menu });
        }, function(userFanpage, menu) {
            Domain.find({ 'ref': userFanpage._id }, function(err, found) {
                
                var domains = found.sort(function(a, b) {
                    if (a < b)
                        return -1;
                    if (a > b)
                        return 1;
                    return 0;
                });
                
                res.render('user-opcoes', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage, domains: found, moment: moment, menu: menu });
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
    
    /* abas do Facebook */
    app.get('/fbtab/', function(req, res) {
        res.render('fbtab');
    });
    
    app.post('/fbtab/', function(req, res) {
        if (req.body.signed_request) {
            var request = req.body.signed_request;
            var signedRequest = new SignedRequest(request);

            signedRequest.parse(function(errors, request) {
                // check if request was valid
                console.log(request.isValid());

                // access errors
                console.log(errors);

                // this is your data object
                console.log(request.data);
                
                // render tab page
                res.render('fbtab');
                return;
            });
        }
        res.status(400).send();
    });
    
    /* atualizações em tempo real do Facebook */
    app.get('/realtime', function(req, res) {
        console.log('Realtime updates verification request received.');
        if (req.query['hub.mode'] === 'subscribe') {
            if (req.query['hub.verify_token'] === '123456') {
                console.log('Challenge answered.');
                res.send(req.query['hub.challenge']);
                return;
            }
        }
        res.status(500).send();
    });
    
    app.post('/realtime', function(req, res) {
        console.log('Receiving realtime updates:');
        console.log(req.body);
        console.log('---');
    });
    
    /* erro 404 */
    
    app.use(function(req, res){
        validateSubdomain(req.headers.host, res, function(menu) {
            res.render('404', { link: '404', auth: req.isAuthenticated(), user: req.user, menu: menu });
        }, function(userFanpage, menu) {
            var custompage = req.url.substr(1);
            TextPage.find({ ref: userFanpage._id, path: custompage }, function(err, found) {
                if (err)
                    throw err;
                
                if (found && found.length == 1) {
                    res.render('user-textpage', { link: custompage, auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage, menu: menu, title: found[0].title, body: found[0].body });
                } else {
                    res.render('404', { link: '404', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage, menu: menu });
                }
            });
        });
    });
    
    // middleware de autenticação
    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.redirect('/');
        }
    }
    
    // middleware de administração
    function isAdmin(req, res, next) {
        if (req.isAuthenticated()) {
            if (validateAdmin(req.user)) {
                next();
            } else {
                res.redirect('/gerenciamento');
            }
        } else {
            res.redirect('/');
        }
    }
};