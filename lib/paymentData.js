"use strict"

var cfg        = require('config');
var log4js     = require('log4js');
var gmailModel = require('gmail-model');
var Converter  = require('csvtojson').Converter;


// logs

log4js.configure(cfg.get('log.log4jsConfigs'));

var log = log4js.getLogger(cfg.get('log.appName'));
log.setLevel(cfg.get('log.level'));


// Setup the google calendar

var gmailParams = {
  name             : cfg.get('mailboxes.workPrimary.mailboxName'),
  userId           : cfg.get('mailboxes.workPrimary.userId'),
  googleScopes     : cfg.get('auth.scopes'),
  tokenFile        : cfg.get('auth.tokenFile'),
  tokenDir         : cfg.get('auth.tokenFileDir'),
  clientSecretFile : cfg.get('auth.clientSecretFile'),
  log4js           : log4js,
  logLevel         : cfg.get('log.level')
}

var gmail     = new gmailModel(gmailParams);
var converter = new Converter({toArrayString: true});

var paymentsMessageId;


var applyLabelToProcessedEmail = false
var emailProcessedLabel;
if (cfg.has('applyLabelToProcessedEmail')) {
  applyLabelToProcessedEmail = cfg.get('applyLabelToProcessedEmail')
  emailProcessedLabel        = cfg.get('appName')+'-Processed'
}


function Get(params,callback) {


  // Look for last month's shifts
  var d = params.emailMonth;
  var timeMin = new Date(d.getFullYear(), d.getMonth()-1);

  // Set up the gmail search string
  var gmailSearchCriteria = cfg.get('gmailSearchCriteria')
  // and drop in the dates
  gmailSearchCriteria = gmailSearchCriteria.replace(/EMAIL_SUBJECT_DATE/g, timeMin.getFullYear() + ' ' + timeMin.getMonth()+1);


  getPaymentsData ({
    searchStr: gmailSearchCriteria
  }, function (err,paymentsData,isEmailAlreadyProcessed) {

    if (err) {
      log.error('PaymentData.Get: Error getting payments data - ' + err)
      callback(new Error(err))
      return null
    }

    log.debug('Got payments data:')
    log.debug(paymentsData)

    if (isEmailAlreadyProcessed) {
      callback(null,null,true)
      return null
    } else {

      converter.fromString(paymentsData, function(err,result){
        if (err) {
          log.error('PaymentData: Error converting csv to json - ' + err)
          callback(new Error(err))
          return null
        } else {
          callback(null,result)
        }
      });
    }
  });
}


function getPaymentsData(params, callback) {

  // Get the support payments email
  gmail.listMessages({
    freetextSearch: params.searchStr,
    maxResults: 1
  }, function (messages) {

    if (messages.length == 0) {
      log.info('No messages')
      var emptyRet = []
      callback(null,emptyRet)
      return null
    }

    log.info('Found messages:')

    var message = messages[0];

    log.info(message)

    var messageId = message.id;
    paymentsMessageId = messageId;

    gmail.getMessage({
      messageId: messageId
    }, function (message) {

      log.trace('Message:')

      var parts = message.payload.parts
      log.trace('Message: ' + JSON.stringify(parts))


      var processAttachment = false

      // If the message has already been processed we take a quick
      // return and tell the program to go no further.
      if (applyLabelToProcessedEmail) {

        gmail.getLabelId({
          labelName: emailProcessedLabel
        }, function (err,labelId) {

          if (err) {
            log.error('PaymentData.getPaymentData: Error getting label ID - ' + err)
            callback(new Error(err))
            return null
          }

          // Check if this message has already been processed
          if (message.labelIds.indexOf(labelId) != -1) {
            log.info('PaymentData.getPaymentsData: Payments email already processed. Going no further')
            callback(null,null,true)
            return null
          } else {
            processAttachment = true
          }
        })

      }

      if (processAttachment) {
        getAttachmentContents({
          emailParts: parts,
          messageId: messageId
	}, callback);
      }
 
    });
  });
}


function getAttachmentContents (params, callback) {

  var parts     = params.emailParts
  var messageId = params.messageId

  var attachmentId;

  // Get the attachment
  for (var j = 0; j < parts.length; j ++) {

    if (parts[j].body.hasOwnProperty('attachmentId')) {

      // Got the attachment
      attachmentId = parts[j].body.attachmentId;
      log.info('Found attachment %s' + attachmentId);

      gmail.getAttachment({
        messageId: messageId,
        attachmentId: attachmentId
      }, function (response) {
        log.trace('getAttachment returned response:')
        log.trace(response)

        var data = response.data
        var b64string = data;
        var buf = new Buffer(b64string, 'base64');
        var contents = buf.toString('utf8');

        log.debug('Attachment contents:')
        log.debug(contents)

        callback(null,contents)
      });

      break;
    }
  }
}


/*
 * The input comes in this format:
 *
 * Username,Date,Weekday,Shift,Amount
 * ndsouza,07/01/2016,THU,L2,90
 * ndsouza,07/01/2016,THU,OOH,50
 * ndsouza,14/01/2016,THU,L1,95
 * ndsouza,20/01/2016,WED,L2,90
 *
 * And we want to convert it to the following JSON output:
 *
 * [{
 *   date: (the date),
 *   payType: (shift type)
 *   amount: (the amount paid)
 * }]
 */
converter.transform=function(json,row,index){
  json["rowIndex"]=index;

  // Convert the date from DD/MM/YYYY to YYYY-MM-DD
  var date = json["Date"];
  var parts = date.split("/");
  var newDateStr = parts[2]+"-"+parts[1]+"-"+parts[0];
  var d = new Date(newDateStr);

  json["date"]= d.getTime();
  json["payType"]=json["Shift"];
  json["amount"]=json["Amount"];

  // Get rid of fields we don't want
  delete json["Username"];
  delete json["Date"];
  delete json["Weekday"];
  delete json["Shift"];
  delete json["Amount"];
  delete json["rowIndex"];
};


function ApplyProcessedLabel (callback) {

  log.info('Applying label to processed email')

  // Get the ID of the processed label and apply it

  gmail.getLabelId({
    labelName: emailProcessedLabel,
    createIfNotExists: true
  }, function (err,labelId) {

    if (err) {
      log.error('PaymentData: Error getting label ID - ' + err)
      callback(new Error(err))
      return null
    }

    gmail.updateMessage({
      messageId: paymentsMessageId,
      addLabelIds: new Array(labelId)
    }, function (err, message) {

      if (err) {
        log.error('PaymentData: Error applying processed label - ' + err)
        callback(new Error(err))
        return null
      }

      log.info('Applied label %s to message %s.', labelId, paymentsMessageId)
      callback(null,message)
    });
  });
}

// export the class
exports.get = Get;
exports.applyProcessedLabel = ApplyProcessedLabel;
