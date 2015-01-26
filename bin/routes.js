// load up the models
var Fanpage            = require('../models/fanpage');
var Owner              = require('../models/owner');

// check if it's top domain or any subdomain
validateSubdomain = function(req, callbackTop, callbackSubdomain) {
    var hostname = req.headers.host.split(':')[0];
    var subdomain = hostname.split('.')[0];
    
    if (hostname == 'www.mobyourlife.com.br' || subdomain == 'debug') {
        callbackTop();
    } else {
        Fanpage.findOne({'_id': subdomain}, function(err, found) {
            if (found) {
                callbackSubdomain(found);
            } else {
                callbackTop();
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
        console.log('User: ' + req.user);
        validateSubdomain(req, function() {
            res.render('index', { link: 'inicio', auth: req.isAuthenticated(), user: req.user });
        }, function(userFanpage) {
            res.render('user-index', { link: 'inicio', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage });
        });
    });

    // sobre
    app.get('/sobre', function(req, res) {
        validateSubdomain(req, function() {
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
        validateSubdomain(req, function() {
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
        validateSubdomain(req, function() {
            res.render('contato', { link: 'contato', auth: req.isAuthenticated(), user: req.user });
        }, function(userFanpage) {
            res.render('user-contato', { link: 'contato', auth: req.isAuthenticated(), user: req.user, fanpage: userFanpage });
        });
    });
    
    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    app.get('/login', function(req, res) {
        validateSubdomain(req.headers.referer, function() {}, function(userFanpage) {
            req.session.backto = req.headers.referer;
        });
        res.redirect('/auth/facebook');
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
                        newFanpage.creation.time = Date.now();
                        newFanpage.creation.user = req.user;
                    }

                    // save the new fanpage to the database
                    newFanpage.save(function(err) {
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
    
    // middleware de autenticação
    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.redirect('/');
        }
    }
};