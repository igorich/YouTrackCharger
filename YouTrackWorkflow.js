const APP_URL = 'https://chat.raftds.com';
const APP_URN = 'api/apps/public/8a883794-f8f5-4e8d-86fe-310a5a150fb7/webhook';

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