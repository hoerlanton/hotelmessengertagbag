/**
 * Created by antonhorl on 05.05.17.
 */
var express = require('express');
var router = express.Router();
var https = require('https');
var request = require('request');
var http = require('http');
var parseString = require('xml2js').parseString;
var sourceFile = require('../app');

var totalPriceCharge = 0;
var errMsg = "";
var successMsg = "";

/* Get Form */
router.get('/checkout', function(req, res, next) {
    res.render('form', { title: 'Jetzt buchen', errMsg: errMsg, noError: !errMsg});
    if (req.route.path === "/checkout") {
        totalPriceCharge = sourceFile.totalPrice;
        console.log("Works" + req.route.path);
    }
});

router.get('/DoppelzimmerDeluxeHolzleo', function(req, res, next) {
    res.render('form', { title: 'Jetzt buchen', errMsg: errMsg, noError: !errMsg});
    if (req.route.path === "/DoppelzimmerDeluxeHolzleo") {
        totalPriceCharge = sourceFile.priceAllNightsDoppelzimmerDeluxeHolzleo;
        console.log("Works" + req.route.path);
    }
});

router.get('/DoppelzimmerSuperiorSteinleo', function(req, res, next) {
    res.render('form', { title: 'Jetzt buchen', errMsg: errMsg, noError: !errMsg});
    if (req.route.path === "/DoppelzimmerSuperiorSteinleo") {
        totalPriceCharge = sourceFile.priceAllNightsDoppelzimmerSuperiorSteinleo;
        console.log("Works" + req.route.path);
    }
});

router.get('/DoppelzimmerClassicSteinleo', function(req, res, next) {
    res.render('form', { title: 'Jetzt buchen', errMsg: errMsg, noError: !errMsg});
    if (req.route.path === "/DoppelzimmerClassicSteinleo") {
        totalPriceCharge = sourceFile.priceAllNightsDoppelzimmerClassicSteinleo;
        console.log("Works" + req.route.path);
    }
});

router.get('/bookingsuccess', function(req, res, next) {
    res.render('success', { title: 'Jetzt buchen', successMsg: successMsg, noMessage: !successMsg});
    console.log(req.body);
});

router.post('/checkout', function(req, res, next){
console.log(totalPriceCharge);
    console.log(req.body.stripeToken);
    console.log(req.body);
    var stripe = require("stripe")(
        "sk_test_lt0sXEAzs52AA4Nh3PBc3fec"
    );

    stripe.charges.create({
        amount: totalPriceCharge * 100,
        currency: "eur",
        source: req.body.stripeToken, // obtained with Stripe.js
        description: "Test charge"
    }, function(err, charge) {
        if (err) {
            errMsg = "Error";
            console.log("Charge failed!");
            return res.redirect('/checkout');
        } if (charge) {
            successMsg = 'Sie haben erfolgreich die Buchung abgeschlossen';
            res.redirect('/bookingsuccess');

            var checkoutData = JSON.stringify(req.body);
            var checkoutDataSplitted = checkoutData.split(",");
            var checkoutDataSplittedTwiceName = checkoutDataSplitted[0].split(":");
            var checkoutDataName = checkoutDataSplittedTwiceName[1].slice(1, -1);
            var checkoutDataSplittedTwiceAddress = checkoutDataSplitted[1].split(":");
            var checkoutDataAddress = checkoutDataSplittedTwiceAddress[1].slice(1, -1)
            var checkoutDataSplittedTwiceCardName = checkoutDataSplitted[2].split(":");
            var checkoutDataCardName = checkoutDataSplittedTwiceCardName[1].slice(1, -1);
            var checkoutDataSplittedTwiceCardNumber = checkoutDataSplitted[3].split(":");
            var checkoutDataCardNumber = checkoutDataSplittedTwiceCardNumber[1].slice(1, -1);
            var checkoutDataSplittedTwiceCardExpiryMonth = checkoutDataSplitted[4].split(":");
            var checkoutDataCardExpiryMonth = checkoutDataSplittedTwiceCardExpiryMonth[1].slice(1, -1);
            var checkoutDataSplittedTwiceCardExpiryYear = checkoutDataSplitted[5].split(":");
            var checkoutDataCardExpiryYear = checkoutDataSplittedTwiceCardExpiryYear[1].slice(1, -1);
            var checkoutDataSplittedTwiceCardCvc = checkoutDataSplitted[6].split(":");
            var checkoutDataCardCvc = checkoutDataSplittedTwiceCardCvc[1].slice(1, -1);
            var numberOfPersonsReservation = req.app.locals.numberOfPersons;
            var numberOfRoomsReservation = req.app.locals.numberOfRooms;
            var arrivalDateReservation = req.app.locals.arrivalDate;
            var departureDateReservation = req.app.locals.departureDate;
            var ratePlanIDReservation = req.app.locals.ratePlanID;

            sendHotelResRQ(checkoutDataName, checkoutDataAddress, checkoutDataCardName, checkoutDataCardNumber, checkoutDataCardExpiryYear, checkoutDataCardCvc, numberOfPersonsReservation, numberOfRoomsReservation, arrivalDateReservation, departureDateReservation, ratePlanIDReservation);
        }
    });
});

function sendHotelResRQ(checkoutDataName, checkoutDataAddress, checkoutDataCardName, checkoutDataCardNumber, checkoutDataCardExpiryYear, checkoutDataCardCvc, numberOfPersonsReservation, numberOfRoomsReservation, arrivalDateReservation, departureDateReservation, ratePlanIDReservation) {
    var resultTransferData2 = [];
    var buffer = '';
    var postRequest = {
        hostname: "cultswitch.cultuzz.de",
        path: "/cultswitch/processOTA",
        method: "POST",
        port: 8080,
        headers: {
            'Cookie': 'cookie',
            'Content-type': 'application/x-www-form-urlencoded'
        }
    };
    var body = 'otaRQ=<?xml version="1.0" encoding="UTF-8"?><OTA_HotelResRQ xmlns="http://www.opentravel.org/OTA/2003/05" TimeStamp="2012-05-10T09:30:47" Target="Production" Version="3.30" PrimaryLangID="en" ResStatus="Initiate"><POS><Source AgentSine="49082" AgentDutyCode="513f3eb9b082756f"><RequestorID Type="10" ID="50114" ID_Context="CLTZ" /><BookingChannel Type="7" /></Source></POS><HotelReservations><HotelReservation RoomStayReservation="true"><UniqueID Type="10" ID_Context="CLTZ" ID="50114" /><RoomStays><RoomStay IndexNumber="11"><RoomRates><RoomRate NumberOfUnits="' + numberOfRoomsReservation + '" RatePlanID="' + ratePlanIDReservation + '" RatePlanType="11" /></RoomRates><GuestCounts IsPerRoom="0"><GuestCount Count="' + numberOfPersonsReservation + '" AgeQualifyingCode="10" /></GuestCounts><TimeSpan Start="' + arrivalDateReservation + '" End="' + departureDateReservation + '" /><Comments><Comment GuestViewable="1" Name="GuestMessage"><Text Formatted="1" Language="en"><![CDATA[Test Booking]]></Text></Comment></Comments></RoomStay></RoomStays><ResGuests><ResGuest ResGuestRPH="1"><Profiles><ProfileInfo><Profile><Customer Gender="Male"><PersonName><NameTitle>mr</NameTitle><GivenName>' + checkoutDataName + '</GivenName><Surname>' + checkoutDataName + '</Surname></PersonName><Telephone PhoneNumber="06649219838"/><Email>anton.hoerl@gmx.at</Email><Address FormattedInd="false"><StreetNmbr>' + checkoutDataAddress + '</StreetNmbr><CityName>' + checkoutDataAddress + '</CityName><PostalCode>' + checkoutDataAddress + '</PostalCode><CountryName Code="AU">' + checkoutDataAddress + '</CountryName><StateProv StateCode="2">' + checkoutDataAddress + '</StateProv><CompanyName CompanyShortName="Bon">HotelSalzburgerhofLeogang</CompanyName></Address></Customer></Profile></ProfileInfo></Profiles></ResGuest></ResGuests><ResGlobalInfo><Guarantee GuaranteeCode="3" GuaranteeType="CC/DC/Voucher"><GuaranteesAccepted><GuaranteeAccepted><PaymentCard CardCode="MA" CardNumber="' + checkoutDataCardNumber + '" CardType="1" ExpireDate="' + checkoutDataCardExpiryYear + '" SeriesCode="' + checkoutDataCardCvc + '"><CardHolderName>' + checkoutDataCardName + '</CardHolderName></PaymentCard></GuaranteeAccepted></GuaranteesAccepted></Guarantee><HotelReservationIDs><HotelReservationID ResID_SourceContext="TransactionNumber" ResID_Source="AntonHoerlResID" ResID_Value="12587424885" /><HotelReservationID ResID_SourceContext="eBayItemID" ResID_Source="eBay" ResID_Value="12547895" /></HotelReservationIDs></ResGlobalInfo></HotelReservation></HotelReservations></OTA_HotelResRQ>';
    var req = http.request(postRequest, function (res) {
        console.log(res.statusCode);
        res.on("data", function (data) {
            buffer += data;
        });
        res.on("end", function () {
            parseString(buffer, function (err, result) {
                (JSON.stringify(result));
                resultTransferData2.push(result);
            });
        });
    });
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    req.write(body);
    req.end();
}

module.exports = router;