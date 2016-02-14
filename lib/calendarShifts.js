"use strict"

var cfg        = require('config');
var log4js     = require('log4js');
var calendarModel = require('calendar-model');

// logs

log4js.configure(cfg.get('log.log4jsConfigs'));

var log = log4js.getLogger(cfg.get('log.appName'));
log.setLevel(cfg.get('log.level'));


/*
 * Setup calendar
 */

var calendarParams = {
  name:             "Work Primary",
  calendarId:       cfg.get('calendars.workPrimary.calendarId'),
  googleScopes:     cfg.get('auth.scopes'),
  tokenFile:        cfg.get('auth.tokenFile'),
  tokenDir:         cfg.get('auth.tokenFileDir'),
  clientSecretFile: cfg.get('auth.clientSecretFile'),
  log4js:           log4js,
  logLevel:         cfg.get('log.level')
}
var workPrimary = new calendarModel(calendarParams);
var username    = cfg.get('calendars.workPrimary.usernameSearch');


function Get (params, callback) {

  // Look for shifts during the specified period

  var params = {
    timeMin: params.timeMin,
    timeMax: params.timeMax,
    textSearch: username,
    orderBy: "startTime"
  }

  workPrimary.loadEventsFromGoogle(params, function (wpEvs) {

    log.trace('Work Primary events found:');
    log.trace(wpEvs);

    convertToInterface(wpEvs, callback)

  })
}


/*
 * We want to convert it to the following JSON output:
 *
 * [{
 *   date: (the date),
 *   payType: (shift type)
 * }]
 */
function convertToInterface (wpEvs,callback) {

  var output = [];

  for (var i in wpEvs) {

    var wpEv = wpEvs[i];

    var d = new Date(wpEv.start.dateTime)
    var shiftDate = new Date (d.getFullYear(), d.getMonth(), d.getDate())
    var outputPart = {
      date    : shiftDate.getTime(),
      payType : wpEv.summary.replace(username+" ","")
    }

    output.push(outputPart)
  }

  callback(output)
}



// export the class
exports.get = Get;
