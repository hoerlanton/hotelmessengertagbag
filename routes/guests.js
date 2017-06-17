/*

var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var db = mongojs('mongodb://anton:b2d4f6h8@ds127132.mlab.com:27132/servicio', ['gaeste']);

//Get all guests
router.get('/guests', function(req, res, next) {
    //Get guests from Mongo DB
    db.gaeste.find(function(err, gaeste){
        if (err){
            res.send(err);
        }
        res.json(gaeste);
    });
});

//Save new guests
router.post('/guests', function(req, res, next) {
    var guest = req.body;
    if(!guest.first_name || !guest.second_name){
        res.status(400);
        res.json({
            error: "Bad data"
        });
    } else {
        db.gaeste.save(guest, function (err, guest) {
            if (err) {
                res.send(err);
            }
            res.json(guest);

        });
    }
});

//Update guests
router.put('/guests', function(req, res, next) {
    var guest = req.body;
    var uptGuest = {};

    if(guest.signed_up){
        uptGuest = guest.signed_up
    }
        db.gaeste.update({senderId: messageData.recipient.id},
            {
                $set: {signed_up: false}
            }, function (err, gaeste) {
                if (err) {
                    res.send(err);
                } else {
                    res.json(guest);
                }
            });
});

module.exports = router;

    */