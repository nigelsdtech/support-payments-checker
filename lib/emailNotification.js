"use strict"

var cfg    = require('config'),
    log4js = require('log4js'),
    email  = require("emailjs");


// logs

log4js.configure(cfg.get('log.log4jsConfigs'));

var log = log4js.getLogger(cfg.get('log.appName'));
log.setLevel(cfg.get('log.level'));


function SendEmail (params, callback) {

  log.info("Sending mail")

  var content = params.content;

  var server = email.server.connect({
    user:     cfg.get('email.user'),
    password: cfg.get('email.password'),
    host:     cfg.get('email.host'),
    ssl:      cfg.get('email.ssl')
  });

  var from    = cfg.get('email.from'),
      to      = cfg.get('email.to'),
      subject = cfg.get('email.subject');

  var d = new Date();
  subject = subject.replace(/%s/g, d.getFullYear() + '-' + (d.getMonth()+1));


  var retErr = null;

  log.info("From: %s", from)
  log.info("To: %s", to)
  log.info("Subject: %s", subject)
  log.info("Content:\n%s",content)

  if (cfg.get('email.stubEmail')) {
    log.info("Email stubbed")
  } else {

    server.send({
      from:    from,
      to:      to,
      subject: subject,
      attachment: [{
        data: content,
        alternative: true
      }]
    }, function(err, message) {

      if (err) {
        log.error("Failed to send email: %s, %s", JSON.stringify(err), JSON.stringify(message));
        retErr = new Error(err)
      } else {
        log.info("Email sent");
      }
    });
  }

  callback(retErr);

}

// export the class
exports.sendEmail = SendEmail;
