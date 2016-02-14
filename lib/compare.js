"use strict"

var cfg        = require('config'),
    log4js     = require('log4js'),
    dateformat = require('dateformat')

// logs

log4js.configure(cfg.get('log.log4jsConfigs'));

var log = log4js.getLogger(cfg.get('log.appName'));
log.setLevel(cfg.get('log.level'));


// Hourly callout rate for OOH shifts
var calloutHourlyRate = 50;


function GetDiffs (params, callback) {

  var emails = params.email
     ,cals   = params.calendar
     ,oohs   = params.timesheet;


  var notSynced = [];

  // Split out the OOH shifts first
  var total = emails.length
  for (var i = 0; i < total; i++) {

    var email        = emails[i]
       ,emailDate    = email.date
       ,emailPayType = email.payType;

    log.debug('Comparison event: %s (%s)', emailPayType, emailDate)

    var synced = false;

    // Treat the various pay categories
    switch (emailPayType) {

      case "OOH" : {

        log.debug('Payment is for OOH')

        for (var j = 0; j < oohs.length; j++) {

          var ooh        = oohs[j]
             ,oohDate    = ooh.date
             ,oohHours   = ooh.hours
             ,emailHours = (email.amount/calloutHourlyRate)

          log.trace('+--> Comparing with OOH on %s for %s hours', oohDate, oohHours);

          if (emailDate == oohDate
            && emailHours == oohHours
          ) {
            log.debug('Match found for OOH shift on %s for %s hours', oohDate, oohHours)
            emails.splice(i,1)
            i--
            total--
            oohs.splice(j,1)
            synced = true
            break
          }

        }

        break;
      }

      case "L1" :
      case "L2" : {

        log.debug('Payment is for Calendar')

        // Look for an entry in the calendar array with
        // the same details
        for (var j = 0; j < cals.length; j++) {

          var cal        = cals[j]
             ,calDate    = cal.date
             ,calPayType = cal.payType;

          log.trace('+--> Comparing with Cal on %s for %s shift', calPayType, calDate)

          if (emailDate == calDate && emailPayType == calPayType) {
            log.debug('Match found for Calendar %s shift on %s', calPayType, calDate)
            emails.splice(i,1)
            i--
            total--
            cals.splice(j,1)
            synced = true
            break
          }
        }

        break;
      }

      default : {

        // Unrecognized entry
        var errMsg = 'Comparison error: Unrecognized entry type: ' + emailPayType;
        log.error(errMsg);
        callback(new Error(errMsg))
        return null
      }
    }

    if (!synced) {
      var d = new Date(email.date);
      notSynced.push({
        source:  "Email",
        payType: email.payType,
        date:    d.toDateString(),
      })
    }

  }


  /*
   * Finally, go through the ooh and cal objects.
   * Any leftovers here are ones that didn't match.
   */

  for (var i = 0; i < oohs.length; i++) {

    var d = new Date(oohs[i].date);
    notSynced.push({
      source:  "Timesheet",
      payType: oohs[i].payType,
      date:    d.toDateString(),
    })

  }

  for (var i = 0; i < cals.length; i++) {

    var d = new Date(cals[i].date);
    notSynced.push({
      source:  "Calendar",
      payType: cals[i].payType,
      date:    d.toDateString(),
    })

  }

  if (notSynced.length == 0) {
    log.info('All in sync')
  } else {
    log.info('Not synced:\n%s', JSON.stringify(notSynced))
  }

  callback(null,notSynced);
}



// export the class
exports.getDiffs = GetDiffs;
