// app/routes.js
module.exports = function(app, passport) {
    
    // raiz
    app.get('/', function(req, res) {
        res.redirect('/inicio');
    });

    // início
    app.get('/inicio', function(req, res) {
      res.render('index', { link: 'inicio', title: 'Bem-vindo à facilidade!' });
    });
    
    // como funciona
    app.get('/como-funciona', function(req, res) {
      res.render('como-funciona', { link: 'como-funciona', title: 'Como Funciona' });
    });
               
    // dúvdas frequentes
    app.get('/duvidas-frequentes', function(req, res) {
        res.render('duvidas-frequentes', { link: 'duvidas-frequentes', title: 'Dúvidas Frequentes' });
    });
    
    // contato
    app.get('/contato', function(req, res) {
        res.render('contato', { link: 'contato', title: 'Contato' });
    });
    
    // entrar
    app.get('/entrar', function(req, res) {
        res.render('entrar', { message: req.flash('loginMessage') });
    });
    
    // processa o formulário de login
    //router.post('/entrar', ...
    
    // registro
    app.get('/registrar', function(req, res) {
        res.render('registrar', { message: req.flash('signupMessage') });
    });
    
    // processa o formulário de registro
    //router.post('/registrar', ...
    
    // perfil, página protegida
    app.get('/perfil', isLoggedIn, function(req, res) {
        res.render('perfil', { user: req.user });
    });
    
    // sair
    app.get('/sair', function(req, res) {
        req.logout();
        res.redirect('/');
    });
    
    // middleware de autenticação
    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated())
        {
            next();
        }
        
        res.redirect('/');
    }
};