// app/routes.js
module.exports = function(app, passport) {
    var express = require('express');
    var router = express.Router();
    
    // raiz
    router.get('/', function(req, res) {
        res.redirect('/inicio');
    });

    // início
    router.get('/inicio', function(req, res) {
      res.render('index', { link: 'inicio', title: 'Bem-vindo à facilidade!' });
    });
    
    // como funciona
    router.get('/como-funciona', function(req, res) {
      res.render('como-funciona', { link: 'como-funciona', title: 'Como Funciona' });
    });
               
    // dúvdas frequentes
    router.get('/duvidas-frequentes', function(req, res) {
        res.render('duvidas-frequentes', { link: 'duvidas-frequentes', title: 'Dúvidas Frequentes' });
    });
    
    // contato
    router.get('/contato', function(req, res) {
        res.render('contato', { link: 'contato', title: 'Contato' });
    });
    
    // entrar
    router.get('/entrar', function(req, res) {
        res.render('entrar', { message: req.flash('loginMessage') });
    });
    
    // processa o formulário de login
    //router.post('/entrar', ...
    
    // registro
    router.get('/registrar', function(req, res) {
        res.render('registrar', { message: req.flash('signupMessage') });
    });
    
    // processa o formulário de registro
    //router.post('/registrar', ...
    
    // perfil, página protegida
    app.get('/perfil', isLoggedIn, function(req, res) {
        res.render('perfil', { usuario: req.usuario });
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