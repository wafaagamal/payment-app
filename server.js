let config = require('./config/index')
var http = require('http'),
    paypal = require('paypal-rest-sdk'),
    bodyParser = require('body-parser'),
    app = require('express')();
app.use(bodyParser.json());

//configure for sandbox environment
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': config.ClientID,
    'client_secret': config.Secret
});

app.get('/create', function(req, res){
    //build PayPal payment request
    var payReq = JSON.stringify({
        'intent':'sale',
        'redirect_urls':{
            'return_url':'http://localhost:3000/process',
            'cancel_url':'http://localhost:3000/cancel'
        },
        'payer':{
            'payment_method':'paypal'
        },
        'transactions':[{
            'amount':{
                'total':'7.47',
                'currency':'USD'
            },
            'description':'This is the payment transaction description.'
        }]
    });

    paypal.payment.create(payReq, function(error, payment){
        if(error){
            console.error(error);
        } else {
            //capture HATEOAS links
            var links = {};
            payment.links.forEach(function(linkObj){
                links[linkObj.rel] = {
                    'href': linkObj.href,
                    'method': linkObj.method
                };
            })
         
        // console.log(links,"================Links==================");
        
            //if redirect url present, redirect user
            if (links.hasOwnProperty('approval_url')){
                console.log(links['approval_url'].href,"================approval==================");
                
                res.redirect(links['approval_url'].href);
            } else {
                console.error('no redirect URI present');
            }
        }
    });
});

app.get('/home',function(req,res){
    var listPayment = {
        'count': '1',
        'start_index': '1'
    };
    
    paypal.payment.list(listPayment, function (error, payment) {
        if (error) {
            throw error;
        } else {
            console.log("List Payments Response");
            console.log(JSON.stringify(payment));
        }
    })
    res.send('<h1> Welcome to paypal app </h1>')
})
app.get('/process', function(req, res){
    // console.log(req.query,"======query=======");
    
    // console.log(req.query.paymentId,"=======payID==========");
    // console.log(req.query.PayerID,"=======PayerID======");
    
    
    var paymentId = req.query.paymentId;
    var payerId = { 'payer_id': req.query.PayerID };

    paypal.payment.execute(paymentId, payerId, function(error, payment){
        if(error){
            console.error(error);
        } else {
            if (payment.state == 'approved'){ 
                res.redirect('http://localhost:3000/home')
                // res.send('payment completed successfully');
              
            } else {
                res.send('payment not successful');
            }
        }
    });
});


app.get('/cancel',function(req,res){
     
 
    res.send(' operationhas been canceled')
})
http.createServer(app).listen(3000, function () {
    console.log('Server started: Listening on port 3000');
 });