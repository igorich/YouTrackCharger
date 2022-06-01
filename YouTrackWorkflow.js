const APP_URL = 'https://<rocket chat server URL>';
const APP_URN = '<webhook path from app admin panel>';

const entities = require('@jetbrains/youtrack-scripting-api/entities');
const http = require('@jetbrains/youtrack-scripting-api/http');

exports.rule = entities.Issue.onChange({
  title: 'Send notification to Rocket.Chat when an issue is reported, resolved, or reopened',
  action: (ctx) => {
    const issue = ctx.issue;

    const payload = {
      "username": issue.reporter.visibleName,
      "link": issue.url
    };

    const connection = new http.Connection(APP_URL, null, 2000);
    connection.addHeader('Content-Type', 'application/json');
    const response = connection.postSync(
      APP_URN,
      null,
      JSON.stringify(payload)
    );
    console.warn(JSON.stringify(payload));
    if (!response.isSuccess) {
      console.warn('Failed to post notification to Rocket.Chat. Details: ' + response.toString());
    }
  },
});