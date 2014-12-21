var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/contato', function(req, res) {
  res.render('contato', { link: 'contato', title: 'Contato' });
});

module.exports = router;
