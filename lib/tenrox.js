"use strict"

var cfg       = require('config')
   ,log4js    = require('log4js')
   ,JSONprint = require('json-print');

var Tenrox;

if (cfg.get('stubTenrox')) {
  Tenrox = require('./TenroxUtilsStub')
} else {
  Tenrox = require('tenrox-utils')
}


// logs

log4js.configure(cfg.get('log.log4jsConfigs'));

var log = log4js.getLogger(cfg.get('log.appName'));
log.setLevel(cfg.get('log.level'));

var tenrox = new Tenrox ({
  org:      cfg.get('tenrox.org'),
  username: cfg.get('tenrox.username'),
  password: cfg.get('tenrox.password')
})



function GetShifts (params, callback) {

  var timeMin = params.timeMin
     ,timeMax = params.timeMax;

  tenrox.getTimesheetEntries({
    startDate: timeMin,
    endDate:   timeMax,
    taskNameFilter: "OOH"
  }, function (err,matchedEntries) {

    if (err) {
      log.error('Error getting tenrox shifts: ' + err)
      callback(new Error(err))
      return null
    }

    convertToInterface(matchedEntries, function (err, output) {

      if (err) {
        log.error('Error converting tenrox shifts to interface: ' + err)
        callback(new Error(err))
        return null;
      }

      log.debug('Retrieved OOH shifts:\n%s', JSONprint(JSON.stringify(matchedEntries)))
      callback(null,output)
    })

  })
}


/*
 * We want to convert it to the following JSON output:
 *
 * [{
 *   date: (the date),
 *   payType: (shift type)
 *   task: (entry name)
 *   hours: hours booked to this task
 * }]
 */
function convertToInterface (entries,callback) {

  var output = [];

  for (var i in entries) {

    var entry = entries[i];

    var entryDate = new Date(entry.EntryDate)

    var outputPart = {
      date:  entryDate.getTime(),
      payType: "OOH",
      task: entry.TaskName,
      hours: (entry.RegularTime/3600)
    }

    output.push(outputPart)
  }

  callback(null,output)
}

// export the class
exports.get = GetShifts;
