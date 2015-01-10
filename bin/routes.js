// load up the models
var Fanpage            = require('../models/fanpage');
var Owner              = require('../models/owner');

// app/routes.js
module.exports = function(app, passport, FB) {
    
    // raiz
    app.get('/', function(req, res) {
        res.redirect('/inicio');
    });

    // início
    app.get('/inicio', function(req, res) {
      res.render('index', { link: 'inicio', auth: req.isAuthenticated(), user: req.user });
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
        res.render('contato', { link: 'contato', auth: req.isAuthenticated(), user: req.user });
    });
    
    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope : 'email,manage_pages'
    }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect : '/gerenciamento',
        failureRedirect : '/'
    }));
    
    // gerenciamento, página protegida
    app.get('/gerenciamento', isLoggedIn, function(req, res) {
        res.render('gerenciamento', { auth: req.isAuthenticated(), user: req.user });
    });
    
    // criação do novo site, página protegida
    app.get('/novo-site/:id(\\d+)', isLoggedIn, function(req, res) {
        
        FB.setAccessToken(req.user.facebook.token);
        FB.api('/' + req.params.id, { fields: ['id', 'name', 'about', 'link', 'picture'] }, function(records) {
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
                            console.log('Already owns ' + newOwnership.fanpages.length + ' pages.');
                            for (i = 0; i < newOwnership.fanpages.length; i++) {
                                console.log('Owns: "' + newOwnership.fanpages[i] + '" - Want: "' + newFanpage._id + '"');
                                if (newOwnership.fanpages[i].equals(newFanpage._id)) {
                                    console.log('Found!');
                                    found = true;
                                }
                            }
                            
                            if (found === false) {
                                console.log('Not found!');
                                newOwnership.fanpages.push(newFanpage);
                            }
                                
                            // save the ownership to the database
                            newOwnership.save(function(err) {
                                if (err)
                                    throw err;

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
        FB.api('/me/accounts', { fields: ['id', 'name', 'about', 'link', 'picture'] }, function(records) {
            if (records.data) {
                var pages_list = Array();
                
                records.data.forEach(function(p) {
                    var item = {
                        id: p.id,
                        name: p.name,
                        about: p.about,
                        link: p.link,
                        picture: p.picture.data.url
                    };
                    pages_list.push(item);
                });
                
                pages_list.sort(function(a, b) {
                    var x = a.name.toLowerCase(), y = b.name.toLowerCase();
                    if (x < y) return -1;
                    if (x > y) return 1;
                    return 0;
                });
                
                res.render('novo-site', { title: 'Criar novo site', auth: req.isAuthenticated(), user: req.user, pages: pages_list });
            }
        });
    });
    
    // sair
    app.get('/sair', function(req, res) {
        req.logout();
        res.redirect('/');
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