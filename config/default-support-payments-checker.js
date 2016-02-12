module.exports = {

  calendars: {
    workPrimary: {
      calendarId: "primary",
      usernameSearch: process.env.OB_USERNAME
    }
  },

  mailboxes: {
    workPrimary: {
      mailboxName: "Work Primary",
      userId: "me"
    }
  },


  email : {
    stubEmail : false,
    user: process.env.PERSONAL_GMAIL_USERNAME,
    password : process.env.PERSONAL_APP_SPECIFIC_PASSWORD,
    host: process.env.GMAIL_SMTP_SERVER,
    ssl:  true,
    from: "Nigel's Raspberry Pi <"+process.env.PERSONAL_EMAIL+">",
    to: process.env.OB_DISPLAY_NAME+" <"+process.env.OB_EMAIL_ADDRESS+">",
    subject: "Support Payments Checker report %s"
  },

  gmailSearchCriteria: "newer_than:1m subject:'Support Payments %s - Please Check' has:attachment"

} 
