/**
 * Created by antonhorl on 05.05.17.
 */
var express = require('express');
var router = express.Router();

/* Get Form */
router.get('/checkout', function(req, res, next) {
    res.render('form', { title: 'Jetzt buchen'});
});

module.exports = router;