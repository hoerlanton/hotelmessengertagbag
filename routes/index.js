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

var errMsg = "";
var successMsg = "";
var resultTransferData2 = [];
var totalPriceChargeReservation = 0;
var totalPriceChargeReservationInt = 0;
var totalPriceChargeReservationIntSliced = "";
var count = 0;
var redirect = false;


/* Get Form */
router.get('/checkout', function(req, res, next) {
    res.render('form', { title: 'Jetzt buchen', errMsg: errMsg, noError: !errMsg});
});

router.get('/DoppelzimmerDeluxeHolzleo', function(req, res, next) {
    res.render('form', { title: 'Jetzt buchen', errMsg: errMsg, noError: !errMsg});
    if (req.route.path === "/DoppelzimmerDeluxeHolzleo") {
        sourceFile.ratePlanID = '<RoomRate NumberOfUnits=\"' + sourceFile.numberOfRooms + '\" RatePlanID=\"420590\" RatePlanType=\"11\" />';
        console.log("Works" + req.route.path);
    }
});

router.get('/DoppelzimmerSuperiorSteinleo', function(req, res, next) {
    res.render('formDoppelzimmerSuperiorSteinleo', { title: 'Jetzt buchen', errMsg: errMsg, noError: !errMsg});
    if (req.route.path === "/DoppelzimmerSuperiorSteinleo") {
        sourceFile.ratePlanID = '<RoomRate NumberOfUnits=\"' + sourceFile.numberOfRooms + '\" RatePlanID=\"420592\" RatePlanType=\"11\" />';
        console.log("Works" + req.route.path);
    }
});

router.get('/DoppelzimmerClassicSteinleo', function(req, res, next) {
    res.render('formDoppelzimmerClassicSteinleo', { title: 'Jetzt buchen', errMsg: errMsg, noError: !errMsg});
    if (req.route.path === "/DoppelzimmerClassicSteinleo") {
        sourceFile.ratePlanID = '<RoomRate NumberOfUnits=\"' + sourceFile.numberOfRooms + '\" RatePlanID=\"420594\" RatePlanType=\"11\" />';
        console.log("Works" + req.route.path);
    }
});

router.get('/bookingsuccess', function(req, res, next) {
    res.render('success', { title: 'Jetzt buchen', successMsg: successMsg, noMessage: !successMsg });
});

router.get('/bookingfailure', function(req, res, next) {
    res.render('error', { title: 'Jetzt buchen', errMsg: errMsg, noError: !errMsg});
});

function sendHotelResRQ(checkoutDataName, checkoutDataAddress, checkoutDataCardName, checkoutDataCardNumber, checkoutDataCardExpiryYear, checkoutDataCardCvc, numberOfPersonsReservation, numberOfRoomsReservation, arrivalDateReservation, departureDateReservation, ratePlanIDReservation) {
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
    var body = 'otaRQ=<?xml version="1.0" encoding="UTF-8"?><OTA_HotelResRQ xmlns="http://www.opentravel.org/OTA/2003/05" TimeStamp="2012-05-10T09:30:47" Target="Production" Version="3.30" PrimaryLangID="en" ResStatus="Initiate"><POS><Source AgentSine="49082" AgentDutyCode="513f3eb9b082756f"><RequestorID Type="10" ID="50114" ID_Context="CLTZ" /><BookingChannel Type="7" /></Source></POS><HotelReservations><HotelReservation RoomStayReservation="true"><UniqueID Type="10" ID_Context="CLTZ" ID="50114" /><RoomStays><RoomStay IndexNumber="11"><RoomRates>' + ratePlanIDReservation + '</RoomRates><GuestCounts IsPerRoom="0"><GuestCount Count="' + numberOfPersonsReservation + '" AgeQualifyingCode="10" /></GuestCounts><TimeSpan Start="' + arrivalDateReservation + '" End="' + departureDateReservation + '" /><Comments><Comment GuestViewable="1" Name="GuestMessage"><Text Formatted="1" Language="en"><![CDATA[Test Booking]]></Text></Comment></Comments></RoomStay></RoomStays><ResGuests><ResGuest ResGuestRPH="1"><Profiles><ProfileInfo><Profile><Customer Gender="Male"><PersonName><NameTitle>mr</NameTitle><GivenName>' + checkoutDataName + '</GivenName><Surname>' + checkoutDataName + '</Surname></PersonName><Telephone PhoneNumber="06649219838"/><Email>anton.hoerl@gmx.at</Email><Address FormattedInd="false"><StreetNmbr>' + checkoutDataAddress + '</StreetNmbr><CityName>' + checkoutDataAddress + '</CityName><PostalCode>' + checkoutDataAddress + '</PostalCode><CountryName Code="AU">' + checkoutDataAddress + '</CountryName><StateProv StateCode="2">' + checkoutDataAddress + '</StateProv><CompanyName CompanyShortName="Bon">HotelSalzburgerhofLeogang</CompanyName></Address></Customer></Profile></ProfileInfo></Profiles></ResGuest></ResGuests><ResGlobalInfo><Guarantee GuaranteeCode="3" GuaranteeType="CC/DC/Voucher"><GuaranteesAccepted><GuaranteeAccepted><PaymentCard CardCode="MA" CardNumber="' + checkoutDataCardNumber + '" CardType="1" ExpireDate="' + checkoutDataCardExpiryYear + '" SeriesCode="' + checkoutDataCardCvc + '"><CardHolderName>' + checkoutDataCardName + '</CardHolderName></PaymentCard></GuaranteeAccepted></GuaranteesAccepted></Guarantee><HotelReservationIDs><HotelReservationID ResID_SourceContext="TransactionNumber" ResID_Source="AntonHoerlResID" ResID_Value="12587424885" /><HotelReservationID ResID_SourceContext="eBayItemID" ResID_Source="eBay" ResID_Value="12547895" /></HotelReservationIDs></ResGlobalInfo></HotelReservation></HotelReservations></OTA_HotelResRQ>';

    var req = http.request(postRequest, function (res) {
        console.log(res.statusCode);
        res.on("data", function (data) {
            buffer += data;
            console.log("BUFFER" + buffer);
        });
        res.on("end", function () {
            parseString(buffer, function (err, result) {
                console.log("RESULT:" + result);
                (JSON.stringify(result));
                console.log("RESULT STRINGIFIED:" + result);
                resultTransferData2.push(result);
                //console.log("RESULTTRANSFERDATA2" + resultTransferData2);
                //console.log("ERRORERROR" + resultTransferData2[0].OTA_HotelResRS.Errors[0]);
                //console.log("ERRORERROR" + resultTransferData2[0].OTA_HotelResRS.$.ResResponseType);
                if(resultTransferData2[0].OTA_HotelResRS.$.ResResponseType === 'Unsuccessful') {
                    console.log(resultTransferData2[0].OTA_HotelResRS.Errors[0].Error[0]._);
                    //displayError(req, res);
                    redirect = true;
                }
                //console.log(resultTransferData2[0].OTA_HotelResRS.HotelReservations[0].HotelReservation[0].RoomStays[0].RoomStay[0].Total[0].$.AmountAfterTax);
            });
        });
    });
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    req.write(body);
    req.end();
}

function assignTotalPriceReservation(){
            totalPriceChargeReservation = JSON.stringify(resultTransferData2[0].OTA_HotelResRS.HotelReservations[0].HotelReservation[0].RoomStays[0].RoomStay[0].Total[0].$.AmountAfterTax);
            console.log(totalPriceChargeReservation);
            totalPriceChargeReservationIntSliced = totalPriceChargeReservation.slice(1, -1);
            totalPriceChargeReservationInt = parseInt(totalPriceChargeReservationIntSliced);
            console.log(totalPriceChargeReservationInt);
}

function resetData() {
    count++;
    if (count >= 1) {
        resultTransferData2 = [];
        totalPriceChargeReservation = 0;
        totalPriceChargeReservationInt = 0;
        ratePlanIDReservation = "";
        redirect = false;
    }
}

router.post('/checkout', function(req, res, next){
    //console.log(req.body.stripeToken);
    //console.log(req.body);

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
    var numberOfPersonsReservation = sourceFile.numberOfPersons - 1;
    if (numberOfPersonsReservation < 1) {
        numberOfPersonsReservation = 1
        }
        else if (numberOfPersonsReservation > 2) {
            numberOfPersonsReservation = 2
        }
    var numberOfRoomsReservation = sourceFile.numberOfRooms;
    var arrivalDateReservation = sourceFile.arrivalDate;
    var departureDateReservation = sourceFile.departureDate;
    var ratePlanIDReservation = sourceFile.ratePlanID;
    var senderID = sourceFile.senderID;
    //console.log("1:" + checkoutDataName + "2:" + checkoutDataAddress + "3:" + checkoutDataCardName + "4:" + checkoutDataCardNumber +"5:" + checkoutDataCardExpiryYear + "6:" + checkoutDataCardCvc + "7:" + numberOfPersonsReservation + "8:" + numberOfRoomsReservation + "9:" + arrivalDateReservation + "10:" + departureDateReservation + "11:" + ratePlanIDReservation);
    resetData();
    sendHotelResRQ(checkoutDataName, checkoutDataAddress, checkoutDataCardName, checkoutDataCardNumber, checkoutDataCardExpiryYear, checkoutDataCardCvc, numberOfPersonsReservation, numberOfRoomsReservation, arrivalDateReservation, departureDateReservation, ratePlanIDReservation);
    setTimeout(function () {
        if (redirect) {
            console.log("bookingfailure");
            return res.redirect('/bookingfailure');
        } else {
            assignTotalPriceReservation();
            var stripe = require("stripe")(
                "sk_test_lt0sXEAzs52AA4Nh3PBc3fec"
            );
            stripe.charges.create({
                amount: totalPriceChargeReservationInt * 100,
                currency: "eur",
                source: req.body.stripeToken, // obtained with Stripe.js
                description: "Test charge"
            }, function (err, charge) {
                if (err) {
                    errMsg = "Error";
                    console.log("Charge failed!");
                    return res.redirect('/checkout');
                }
                if (charge) {
                    successMsg = 'Sie haben erfolgreich die Buchung abgeschlossen';
                    res.redirect('/bookingsuccess');
                    console.log(sourceFile.senderID);
                    extractDataForBookingConfirmation();
                    sendBookingConfirmation(sourceFile.senderID, checkoutDataName, checkoutDataAddress, numberOfPersonsReservation, numberOfRoomsReservation, arrivalDateReservation, departureDateReservation, totalPriceChargeReservationInt);
                    sendPDF(sourceFile.senderID);
                }
            });
        }
    }, 20000);
});

function extractDataForBookingConfirmation(){

}

function sendBookingConfirmation(recipientId, a, b, c, d, e, f, g) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: "Sehr geehrte/r Frau Herr " + a + "\n Vielen Dank für Ihre Buchung im Hotel Salzburger Hof Leogang. Hiermit senden wir Ihnen die Buchungsbestätigung und freuen und bis bald im Hotel Salzburger Hof Leogang. \n \n Mit Freundlichen Grüßen \n Familie Hörl samt Team \n BeispielBuchungsbestätigung: \n Adresse: " + b + "\nPersonenanzahl: " + c + "\nZimmeranzahl: " + d + "\nAnreisedatum: " + e + "\nAbreisedatum: " + f + "\nAbgebuchter Betrag: " + g",00 EUR",
            metadata: "DEVELOPER_DEFINED_METADATA"
        }
};
    sourceFile.callSendAPI(messageData);
}


function sendPDF(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "file",
                payload: {
                    url: "http://servicio.io/wp-content/uploads/2017/05/Buchungsbestätigung-1.pdf"
                }
            }
        }
    };
    sourceFile.callSendAPI(messageData);
}



module.exports = router;