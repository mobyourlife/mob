// load up libraries
var moment = require('moment');
var URL = require('url-parse');

// setup i18n
moment.locale('pt-br');

// load up the models
var Fanpage            = require('../models/fanpage');
var Owner              = require('../models/owner');
var Domain             = require('../models/domain');

// check if it's top domain or any subdomain
validateSubdomain = function(uri, res, callbackTop, callbackSubdomain) {
    var parsed = new URL(uri);
    var hostname = parsed.hostname;
    var subdomain = hostname.split('.')[0];
    
    if (subdomain == 'www') {
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
        validateSubdomain(req.headers.referer, res, function() {
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
        Owner.findOne({ 'owner.$' : req.user.$ }, function(err, found) {
            var ownedFanpages = Array();
            
            console.log('found:');
            if (found) {
                var ids = Array();
                for (i = 0; i < found.fanpages.length; i++) {
                    ids.push(found.fanpages[i].ref);
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
                    
                    res.render('gerenciamento', { auth: req.isAuthenticated(), user: req.user, fanpages: ownedFanpages });
                });
            } else {
                res.render('gerenciamento', { auth: req.isAuthenticated(), user: req.user, fanpages: ownedFanpages });
            }
        });
    });
    
    // criação do novo site, página protegida
    app.get('/novo-site/:id(\\d+)', isLoggedIn, function(req, res) {
        FB.setAccessToken(req.user.facebook.token);
        FB.api('/' + req.params.id, { locale: 'pt_BR', fields: ['id', 'name', 'about', 'link', 'picture', 'access_token'] }, function(records) {
            if (records) {
                Fanpage.findOne({ 'facebook.id' : records.id }, function(err, found) {
                    var newFanpage = null;
                    
                    if (found) {
                        newFanpage = found;
                    } else {
                        newFanpage = new Fanpage();
                        newFanpage.facebook.id = records.id;
                        newFanpage.facebook.name = records.name;
                        newFanpage.facebook.about = records.about;
                        newFanpage.facebook.link = records.link;
                        newFanpage.facebook.picture = records.picture.data.url;
                        
                        /* creation info */
                        newFanpage.creation.time = Date.now();
                        newFanpage.creation.user = req.user;
                        
                        /* billing info */
                        newFanpage.billing.active = true;
                        newFanpage.billing.evaluation = true;
                        var ticket = {
                            time: moment(),
                            validity: {
                                months: 0,
                                days: 7
                            },
                            payment_type: 'signup_coupon',
                            paid: true
                        };
                        newFanpage.billing.expiration = moment()
                            .add(ticket.validity.months, 'months')
                            .add(ticket.validity.days, 'days');
                        newFanpage.billing.tickets.push(ticket);
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

                            // if successful, insert the fanpage into the owners collection
                            Owner.findOne({ 'owner.$' : req.user.$ }, function(err, found) {
                                var newOwnership = null;

                                if (found) {
                                    newOwnership = found;
                                } else {
                                    newOwnership = new Owner();
                                    newOwnership.user = req.user;
                                }

                                // look if user already owns that page
                                found = false;
                                for (i = 0; i < newOwnership.fanpages.length; i++) {
                                    if (newOwnership.fanpages[i].ref.equals(newFanpage._id)) {
                                        found = true;
                                        break;
                                    }
                                }

                                if (found === false) {
                                    var inner = {
                                        ref: newFanpage,
                                        token: records.access_token
                                    };
                                    newOwnership.fanpages.push(inner);
                                }

                                // save the ownership to the database
                                newOwnership.save(function(err) {
                                    if (err)
                                        throw err;

                                    // insert the owner row in fanpages collection
                                    var found = false;
                                    for (i = 0; i < newFanpage.owners.length; i++) {
                                        if (newFanpage.owners[i].equals(newOwnership._id)) {
                                            found = true;
                                            break;
                                        }
                                    }

                                    if (found === false) {
                                        newFanpage.owners.push(newOwnership);
                                        newFanpage.save(function(err) {
                                            if (err)
                                                throw err;
                                        });
                                    }

                                    // if successful, return a success message
                                    res.render('novo-site-sucesso', { auth: req.isAuthenticated(), user: req.user, fanpage: newFanpage });
                                });
                            });
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
    
    // api para consulta das fotos
    app.get('/api/fotos', function(req, res) {
        validateSubdomain(req.headers.host, res, function() {
            res.render('404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user });
        }, function(userFanpage) {
            var filter = { _id: userFanpage._id };
            console.log('filter: ' + filter);
            
            if (req.params.before) {
                filter.photos.time = { $lte: req.params.before };
            }
            console.log('filter: ' + filter);
            
            Fanpage.find(filter).limit(15).sort('-time').exec(function(err, found) {
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
                    res.render('user-opcoes-dominio', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage });
                } else {
                    res.render('user-404', { link: 'opcoes', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage });
                }
            });
        });
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
            res.redirect('/');
        }
    }
};