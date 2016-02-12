/*
* Check that the monthly payments data matches both
* my google calendar and shifts in tenrox.
*
*/


var cfg           = require('config'),
    log4js        = require('log4js'),
    calendarModel = require('calendar-model'),
    JSONprint     = require('json-print'),
    pd            = require('./lib/paymentData.js'),
    compare       = require('./lib/compare.js'),
    cs            = require('./lib/calendarShifts.js'),
    mailer        = require('./lib/emailNotification.js');


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




/*
 * Set up search times and go for it
 */

// Expect the email this month
var emailMonth = new Date()

// Get the payment data sent by email
pd.get({emailMonth: emailMonth},function (paymentsData) {

  log.info("Retrieved data from payments email:\n%s", JSON.stringify(paymentsData))


  // And get the calendar shifts
  var timeMin = new Date(emailMonth.getFullYear(), emailMonth.getMonth()-1);
  var timeMax = new Date(emailMonth.getFullYear(), emailMonth.getMonth());

  cs.get({
    timeMin: timeMin,
    timeMax: timeMax
  },function (calendarData) {

    log.info("Retrieved data from calendar:\n%s", JSON.stringify(calendarData))

    compare.getDiffs(
      {
        email: paymentsData,
        calendar: calendarData
      },
      function(notSynced) {

        var emailContent = "Support payment check complete on " + emailMonth.toDateString();

        if (notSynced.length == 0) {
          emailContent += '<p>All in sync.';
        } else {
          emailContent += '<p>Not synced:'
          emailContent += '<p>' + JSONprint(JSON.stringify(notSynced))
        }

        mailer.sendEmail(emailContent);
      }
    );
  })

})

return;



