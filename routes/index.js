/**
 * Created by antonhorl on 05.05.17.
 */
var express = require('express');
var router = express.Router();
var https = require('https');
var request = require('request');
var http = require('http');
var parseString = require('xml2js').parseString;

var errMsg = "";
var successMsg = "";
var checkoutData = [];
var checkoutDataSplitted = [];
var checkoutDataSplittedTwiceName = [];
var checkoutDataName = "";
var checkoutDataSplittedTwiceAddress = [];
var checkoutDataAddress = "";
var checkoutDataSplittedTwiceCardName = [];
var checkoutDataCardName = "";
var checkoutDataSplittedTwiceCardNumber = [];
var checkoutDataCardNumber = "";
var checkoutDataSplittedTwiceCardExpiryMonth = [];
var checkoutDataCardExpiryMonth = "";
var checkoutDataSplittedTwiceCardExpiryYear = [];
var checkoutDataCardExpiryYear = "";
var checkoutDataSplittedTwiceCardCvc = [];
var checkoutDataCardCvc = "";
var resultTransferData2 = [];
var numberOfPersonsReservation = "";
var numberOfRoomsReservation = "";
var arrivalDateReservation = "";
var departureDateReservation = "";
var ratePlanIDReservation = "";

/* Get Form */
router.get('/checkout', function(req, res, next) {
    res.render('form', { title: 'Jetzt buchen', errMsg: errMsg, noError: !errMsg});
});

router.get('/bookingsuccess', function(req, res, next) {
    res.render('success', { title: 'Jetzt buchen', successMsg: successMsg, noMessage: !successMsg});
    console.log(req.body);
});

router.post('/checkout', function(req, res, next){

// creating a charge - req.body.stripeToken not available
    var stripe = require("stripe")(
        "sk_test_lt0sXEAzs52AA4Nh3PBc3fec"
    );

    stripe.charges.create({
        amount: 100, //req.app.locals.totalPrice * 100,
        currency: "eur",
        source: req.body.stripeToken, // obtained with Stripe.js
        description: "Test charge"
    }, function(err, charge) {
        if (err) {
            errMsg = 'error';
            console.log("Charge failed!");
            return res.redirect('/checkout');
        }
        successMsg = 'Sie haben erfolgreich die Buchung abgeschlossen';
        res.redirect('/bookingsuccess');
        checkoutData = JSON.stringify(req.body);
        checkoutDataSplitted = checkoutData.split(",");

        checkoutDataSplittedTwiceName = checkoutDataSplitted[0].split(":");
        checkoutDataName = checkoutDataSplittedTwiceName[1].slice(1, -1);
        console.log(checkoutDataName);

        checkoutDataSplittedTwiceAddress = checkoutDataSplitted[1].split(":");
        checkoutDataAddress = checkoutDataSplittedTwiceAddress[1].slice(1, -1);
        console.log(checkoutDataAddress);

        checkoutDataSplittedTwiceCardName = checkoutDataSplitted[2].split(":");
        checkoutDataCardName = checkoutDataSplittedTwiceCardName[1].slice(1, -1);
        console.log(checkoutDataCardName);

        checkoutDataSplittedTwiceCardNumber = checkoutDataSplitted[3].split(":");
        checkoutDataCardNumber = checkoutDataSplittedTwiceCardNumber[1].slice(1, -1);
        console.log(checkoutDataCardNumber);

        checkoutDataSplittedTwiceCardExpiryMonth = checkoutDataSplitted[4].split(":");
        checkoutDataCardExpiryMonth = checkoutDataSplittedTwiceCardExpiryMonth[1].slice(1, -1);
        console.log(checkoutDataCardExpiryMonth);

        checkoutDataSplittedTwiceCardExpiryYear = checkoutDataSplitted[5].split(":");
        checkoutDataCardExpiryYear = checkoutDataSplittedTwiceCardExpiryYear[1].slice(1, -1);
        console.log(checkoutDataCardExpiryYear);

        checkoutDataSplittedTwiceCardCvc = checkoutDataSplitted[6].split(":");
        checkoutDataCardCvc = checkoutDataSplittedTwiceCardCvc[1].slice(1, -1);
        console.log(checkoutDataCardCvc);

        console.log("number of persons transferred: " + req.app.locals.numberOfPersons);
        console.log("number of rooms transferred: " + req.app.locals.numberOfRooms);
        console.log("arrivalDate: " + req.app.locals.arrivalDate);
        console.log("departureDate: " + req.app.locals.departureDate);
        console.log("ratePlanID: " + req.app.locals.ratePlanID);

        numberOfPersonsReservation = req.app.locals.numberOfPersons;
        numberOfRoomsReservation = req.app.locals.numberOfRooms;
        arrivalDateReservation = req.app.locals.arrivalDate;
        departureDateReservation = req.app.locals.departureDate;
        ratePlanIDReservation = req.app.locals.ratePlanID;

        console.log("lastcheck: " + numberOfPersonsReservation + numberOfRoomsReservation + arrivalDateReservation + departureDateReservation + ratePlanIDReservation);



        // asynchronously called

        function sendHotelResRQ() {

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
            var body = '<?xml version="1.0" encoding="UTF-8"?><OTA_HotelResRQ xmlns="http://www.opentravel.org/OTA/2003/05" TimeStamp="2012-05-10T09:30:47" Target="Production" Version="3.30" PrimaryLangID="en" ResStatus="Initiate"><POS><Source AgentSine="49082" AgentDutyCode="513f3eb9b082756f"><RequestorID Type="10" ID="50114" ID_Context="CLTZ" /><BookingChannel Type="7" /></Source></POS><HotelReservations><HotelReservation RoomStayReservation="true"><UniqueID Type="10" ID_Context="CLTZ" ID="50114" /><RoomStays><RoomStay IndexNumber="11"><RoomRates><RoomRate NumberOfUnits="1" RatePlanID="420596" RatePlanType="11" /></RoomRates><GuestCounts IsPerRoom="0"><GuestCount Count="1" AgeQualifyingCode="10" /></GuestCounts><TimeSpan Start="2017-09-12" End="2017-09-13" /><Comments><Comment GuestViewable="1" Name="GuestMessage"><Text Formatted="1" Language="en"><![CDATA[Test Booking]]></Text></Comment></Comments></RoomStay></RoomStays><ResGuests><ResGuest ResGuestRPH="1"><Profiles><ProfileInfo><Profile><Customer Gender="Male"><PersonName><NameTitle>Anton</NameTitle><GivenName>AntonTest</GivenName><Surname>HoerlTest</Surname></PersonName><Telephone PhoneNumber="06649219838" /><Email>anton.hoerl@gmx.at</Email><Address FormattedInd="false"><StreetNmbr>Sonnberg 170</StreetNmbr><CityName>Leogang</CityName><PostalCode>5771</PostalCode><CountryName Code="AU">Austria</CountryName><StateProv StateCode="2">Leogang</StateProv><CompanyName CompanyShortName="Bon">HotelSalzburgerhofLeogang</CompanyName> </Address></Customer></Profile></ProfileInfo></Profiles></ResGuest></ResGuests><ResGlobalInfo><Guarantee GuaranteeCode="3" GuaranteeType="CC/DC/Voucher"><GuaranteesAccepted><GuaranteeAccepted><PaymentCard CardCode="MA" CardNumber="0545582292" CardType="1" ExpireDate="2020" SeriesCode="123"><CardHolderName>Anton Hoerl</CardHolderName></PaymentCard></GuaranteeAccepted></GuaranteesAccepted></Guarantee><HotelReservationIDs><HotelReservationID ResID_SourceContext="TransactionNumber" ResID_Source="AntonHoerlResID" ResID_Value="12587424885" /><HotelReservationID ResID_SourceContext="eBayItemID" ResID_Source="eBay" ResID_Value="12547895" /></HotelReservationIDs></ResGlobalInfo></HotelReservation></HotelReservations></OTA_HotelResRQ>';
            var req = http.request(postRequest, function (res) {
                console.log(res.statusCode);
                res.on("data", function (data) {
                    buffer += data;
                });
                res.on("end", function () {
                    parseString(buffer, function (err, result) {
                        (JSON.stringify(result));
                        resultTransferData2.push(result);
                        console.log(resultTransferData2);
                        console.log("function called")
                    });
                });
            });
            req.on('error', function (e) {
                console.log('problem with request: ' + e.message);
            });
            req.write(body);
            req.end();
        }

        sendHotelResRQ();

    });
});

module.exports = router;