"use strict"

var cfg      = require('config'),
    log4js   = require('log4js')


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


  // A chart to map out all the matches
  var syncChart = []
     ,syncIdx   = -1


  // Quickly add some test data to mimic
  // non-happy paths
  if (false) {
    var d = new Date()
    emails.push({
      date: d.getTime()-500000,
      payType: "L1"
    })
    emails.push({
      date: d.getTime()-1000000,
      payType: "OOH",
      amount: 300
    })
    cals.push({
      date: d.getTime()-2000000,
      payType: "L2"
    })
    oohs.push({
      date: d.getTime()-4000000,
      payType: "OOH",
      hours: 2
    })
  }

  var notSynced = 0;

  // Go through all items received by email and look for matches
  var total = emails.length
  for (var i = 0; i < total; i++) {

    var email        = emails[i]
       ,emailDate    = email.date
       ,emailPayType = email.payType;

    log.debug('Comparison event: %s (%s)', emailPayType, emailDate)

    // Add to the syncChart
    syncChart.push({
      itemDate: emailDate,
      shiftType: emailPayType,
      isInEmail: true
    });
    syncIdx++

    var matchFound = false

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
            matchFound = true
            emails.splice(i,1)
            i--
            total--
            oohs.splice(j,1)

            syncChart[syncIdx].isInOOH = true;
            syncChart[syncIdx].oohHours = oohHours;
            syncChart[syncIdx].emailHours = emailHours;

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
            matchFound = true
            emails.splice(i,1)
            i--
            total--
            cals.splice(j,1)

            syncChart[syncIdx].isInCalendar = true;

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

    if (!matchFound) {
      log.debug('No matched found!!')
      notSynced++
    }

  }


  /*
   * Finally, go through the ooh and cal objects.
   * Any leftovers here are ones that didn't match.
   */

  for (var i = 0; i < oohs.length; i++) {

    syncChart.push({
      itemDate  : oohs[i].date,
      shiftType : "OOH",
      isInOOH   : true,
      oohHours : oohs[i].hours
    })

    notSynced++
  }

  for (var i = 0; i < cals.length; i++) {

    syncChart.push({
      itemDate     : cals[i].date,
      shiftType    : calPayType,
      isInCalendar : true
    })

    notSynced++
  }

  if (notSynced == 0) {
    log.info('All in sync')
  } else {
    log.info('%s items not synced.', notSynced)
  }

  callback(null,syncChart,notSynced);
}


function FormatSyncChartInTable (params) {

  var syncChart = params.syncChart;

  var table  = "<table style='align:center'>"
      table += "\n  <tr>"
      table += "\n    <th>Date</th>"
      table += "\n    <th>Shift</th>"
      table += "\n    <th>Email</th>"
      table += "\n    <th>Calendar</th>"
      table += "\n    <th>Timesheet</th>"
      table += "\n  </tr>"

  for (var i = 0; i < syncChart.length; i++) {

    var map = syncChart[i];

    /* The rules are simple.
     * 1. If it isn't in the email, it isn't in sync.
     * 2. If it is in the email, it needs to be either in the cal or ooh
     *
     * The end email looks like this:
     *
     * Date, Shift, Calendar, Timesheet
     */

    var d = new Date(map.itemDate)
    var isSynced  = false
       ,date  = ""+d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()
       ,shift = map.shiftType
       ,email = ''
       ,cal   = ''
       ,timesheet = ''

    if (!map.hasOwnProperty('isInCalendar')) {
       map.isInCalendar = false
    } else if (map.isInCalendar) {
      cal = 'x'
    }

    if (!map.hasOwnProperty('isInOOH')) {
       map.isInOOH = false
    } else if (map.isInOOH) {
      timesheet = 'x'
    }

    if (!map.hasOwnProperty('isInEmail')) {
       map.isInEmail = false
    } else if (map.isInEmail) {

      email = 'x'

      if (map.isInCalendar) {
        isSynced = true
      } else if (map.isInOOH) {
        isSynced = true
        timesheet = map.oohHours+' hours'
      }
    }


    var rowColor = 'green'

    if (!isSynced) {
      rowColor = 'red'
    }

    table += "\n  <tr style='color:" + rowColor + "'>"
    table += "\n    <td>" + date + "</td>"
    table += "\n    <td>" + shift+ "</td>"
    table += "\n    <td>" + email+ "</td>"
    table += "\n    <td>" + cal  + "</td>"
    table += "\n    <td>" + timesheet + "</td>"
    table += "\n  </tr>"
  }

  table += "\n</table>"

  return table
}

// export the class
exports.getDiffs = GetDiffs;
exports.formatSyncChartInTable = FormatSyncChartInTable;
