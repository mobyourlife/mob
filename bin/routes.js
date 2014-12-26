// app/routes.js
module.exports = function(app, passport) {
    
    // raiz
    app.get('/', function(req, res) {
        res.redirect('/inicio');
    });

    // início
    app.get('/inicio', function(req, res) {
      res.render('index', { link: 'inicio', title: 'Bem-vindo à facilidade!', auth: req.isAuthenticated(), user: req.user });
    });
    
    // como funciona
    app.get('/como-funciona', function(req, res) {
      res.render('como-funciona', { link: 'como-funciona', title: 'Como Funciona', auth: req.isAuthenticated(), user: req.user });
    });
               
    // dúvdas frequentes
    app.get('/duvidas-frequentes', function(req, res) {
        res.render('duvidas-frequentes', { link: 'duvidas-frequentes', title: 'Dúvidas Frequentes', auth: req.isAuthenticated(), user: req.user });
    });
    
    // contato
    app.get('/contato', function(req, res) {
        res.render('contato', { link: 'contato', title: 'Contato', auth: req.isAuthenticated(), user: req.user });
    });
    
    // entrar
    app.get('/entrar', function(req, res) {
        res.render('entrar', { title: 'Entrar', auth: req.isAuthenticated(), user: req.user, message: req.flash('loginMessage') });
    });
    
    // processa o formulário de login
    app.post('/entrar', passport.authenticate('local-login', {
        successRedirect : '/perfil', // redirect to the secure profile section
        failureRedirect : '/entrar', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    
    // registro
    app.get('/registrar', function(req, res) {
        res.render('registrar', { title: 'Registrar', auth: req.isAuthenticated(), user: req.user, message: req.flash('signupMessage') });
    });
    
    // processa o formulário de registro
    app.post('/registrar', passport.authenticate('local-signup', {
        successRedirect : '/perfil', // redirect to the secure profile section
        failureRedirect : '/registrar', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    
    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope : 'email,manage_pages'
    }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect : '/perfil',
        failureRedirect : '/'
    }));
    
    // perfil, página protegida
    app.get('/perfil', isLoggedIn, function(req, res) {
        res.render('perfil', { title: 'Perfil', auth: req.isAuthenticated(), user: req.user });
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
            res.redirect('/entrar');
        }
    }
};