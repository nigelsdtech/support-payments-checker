"use strict"

var cfg       = require('config'),
    log4js    = require('log4js'),
    JSONprint = require('json-print');

// logs

log4js.configure(cfg.get('log.log4jsConfigs'));

var log = log4js.getLogger(cfg.get('log.appName'));
log.setLevel(cfg.get('log.level'));


function GetDiffs (params, callback) {

  var email = params.email;
  var cal   = params.calendar;


  var OOHshifts = [];
  var notSynced = [];

  // Split out the OOH shifts first
  var total = email.length
  for (var i = 0; i < total; i++) {

    var ed           = new Date(email[i].date),
        emailTime    = ed.getTime(),
        emailPayType = email[i].payType;

    log.debug('Comparison event: %s (%s)', emailPayType, emailTime)

    var synced = false;

    // Split out OOH payments to another array
    if (emailPayType == "OOH") {

      log.debug('Payment is for OOH')
      OOHshifts.push(email[i]);
      //email.splice(i,1)
      //i--
      //total--
      //synced = true
      //continue
    }

    // Look for an entry in the calendar array with
    // the same details
    for (var j = 0; j < cal.length; j++) {

      var cd         = new Date(cal[j].date),
          calTime    = cd.getTime(),
          calPayType = cal[j].payType;

      log.debug('+--> Comparing to: %s (%s)', calPayType, calTime)

      if (emailTime == calTime && emailPayType == calPayType) {
        log.debug('Match found')
        email.splice(i,1)
        i--
        total--
        cal.splice(j,1)
        synced = true
        break
      }
    }

    if (!synced) {
      var d = new Date(email[i].date);
      notSynced.push({
        source:  "Email",
        payType: email[i].payType,
        date:    d.toDateString(),
      })
    }

  }


  for (var i = 0; i < cal.length; i++) {

    var d = new Date(cal[i].date);
    notSynced.push({
      source:  "Calendar",
      payType: cal[i].payType,
      date:    d.toDateString(),
    })

  }

  if (notSynced.length == 0) {
    log.info('All in sync')
  } else {
    log.info('Not synced:\n%s', JSON.stringify(notSynced))
  }

  callback(notSynced);
}



// export the class
exports.getDiffs = GetDiffs;
