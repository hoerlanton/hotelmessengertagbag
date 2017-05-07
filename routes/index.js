/**
 * Created by antonhorl on 05.05.17.
 */
var express = require('express');
var router = express.Router();

var errMsg = "";
var successMsg = "";

/* Get Form */
router.get('/checkout', function(req, res, next) {
    res.render('form', { title: 'Jetzt buchen', errMsg: errMsg, noError: !errMsg});
});

router.get('/bookingsuccess', function(req, res, next) {
    res.render('success', { title: 'Jetzt buchen', successMsg: successMsg, noMessage: !successMsg});
});

router.post('/checkout', function(req, res, next){
    console.log(req.body);

// creating a charge - req.body.stripeToken not available
    var stripe = require("stripe")(
        "sk_test_lt0sXEAzs52AA4Nh3PBc3fec"
    );

    stripe.charges.create({
        amount: req.app.locals.totalPrice * 100,
        currency: "eur",
        source: req.body.stripeToken, // obtained with Stripe.js
        description: "Test charge"
    }, function(err, charge) {
        if (err) {
            errMsg = 'error';
            console.log("Charge failed!");
            console.log(app.locals.totalPrice);
            return res.redirect('/checkout');
        }
        successMsg = 'Sie haben erfolgreich die Buchung abgeschlossen';
        res.redirect('/bookingsuccess');
        // asynchronously called
    });
});

module.exports = router;