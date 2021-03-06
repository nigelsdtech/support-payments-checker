/*
* Check that the monthly payments data matches both
* my google calendar and shifts in tenrox.
*
*/


var cfg           = require('config'),
    log4js        = require('log4js'),
    calendarModel = require('calendar-model'),
    pd            = require('./lib/paymentData.js'),
    compare       = require('./lib/compare.js'),
    cs            = require('./lib/calendarShifts.js'),
    mailer        = require('./lib/emailNotification.js');
    timesheet     = require('./lib/tenrox.js');


/*
* Initialize
*/


// logs

log4js.configure(cfg.get('log.log4jsConfigs'));

var log = log4js.getLogger(cfg.get('log.appName'));
log.setLevel(cfg.get('log.level'));




/*
* Main program
*/


log.info('Begin script');
log.info('============');



function handleError (errMsg) {

  var emailContent = "Error running support payment check on " + emailMonth.toDateString();
     emailContent += '<p>'+errMsg;

  mailer.sendEmail({
    content: emailContent
  }, function(err) {

    if (err) {
      var errMsg = 'handleError: Error sending email: ' + err;
      log.error(errMsg)
      return null;
    }
  });


}


/*
 * Set up search times and go for it
 */

// Expect the email this month
var emailMonth = new Date()


try {

  // Get the payment data sent by email
  pd.get({
    emailMonth: emailMonth
  },function (err,paymentsData,isProcessingRequired) {

    if (err) {
      var errMsg = 'index.js Error getting payment data: ' + err;
      log.error(errMsg)
      handleError(errMsg)
      return null;
    }


    // No messages found? No need to go on
    if (!isProcessingRequired) {
      log.info("Processing not required. Ending program.")
      return null;
    }

    log.info("Retrieved data from payments email:\n%s", JSON.stringify(paymentsData))
    // Get the calendar shifts
    var timeMin = new Date(emailMonth.getFullYear(), emailMonth.getMonth()-1);
    var timeMax = new Date(emailMonth.getFullYear(), emailMonth.getMonth(), 0, 23, 59, 59);

    cs.get({
      timeMin: timeMin,
      timeMax: timeMax
    },function (calendarData) {

      log.info("Retrieved data from calendar:\n%s", JSON.stringify(calendarData))

      timesheet.get({
        timeMin: timeMin,
        timeMax: timeMax
      }, function (err, oohShifts) {

        if (err) {
          var errMsg = 'index.js Error getting timesheet ooh shifts: ' + err;
          log.error(errMsg)
          handleError(errMsg)
          return null;
        }

        log.info("Retrieved data from timesheet:\n%s", JSON.stringify(oohShifts))

        compare.getDiffs({
         email: paymentsData,
         calendar: calendarData,
         timesheet: oohShifts
        }, function(err, syncChart, unSyncedCount) {


          if (err) {
            var errMsg = 'Error while comparing: ' + err;
            log.error(errMsg)
            handleError(errMsg)
            return null;
          }

          var emailContent = "Support payment check complete on " + emailMonth.toDateString();

          if (unSyncedCount == 0) {
            emailContent += '<p>All in sync.';
          } else {
            emailContent += '<p>'+unSyncedCount+' items not synced:'
          }

          emailContent += '<p>';

          emailContent += compare.formatSyncChartInTable({syncChart : syncChart});

          // Send out the email with the sync report
          mailer.sendEmail({
            content: emailContent
          }, function(err) {

            if (err) {
              var errMsg = 'Error sending email: ' + err;
              log.error(errMsg)
              handleError(errMsg)
              return null;
            }
          });

	  pd.updateLabels (function (err,message) {
            if (err) {
              var errMsg = 'Error updating labels: ' + err;
              log.error(errMsg)
              handleError(errMsg)
              return null;
            }
          });
        });
      });
    });

  });

} catch (err) {

  var errMsg = 'Error in main body:\n ' + err;
  log.error(errMsg)
  handleError(errMsg)
  return null;
}

return;



