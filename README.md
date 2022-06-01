# YouTrackCharger
YouTrack integration

## Features
- if a message in DM/channel contains YT link -> this link will converted to pretty issue card.
- if your issue was updated in YT -> notification to DM chat \w Charger bot

## Commands
### Channels related
- `/yt-add <board url> <work item prefix> <auth token>`. Adds a board to the global list.
- `/yt-list`. Display all registered YouTrack boards.
- `/yt-remove <board url>|<work item prefix>`. Remove YouTrack board from global list.

### DM related
- `/yt-subscribe <board url>`. Subscribe to board events. You will be notified if you is a reporter of updated item. Board should be in global access list.
- `/yt-unsubscribe <board url>`. Unsubscribe from the notifications from current board.
- `/yt-my-list`. List your subscriptions

## How to 
### Create YT token for /yt-add command
Create an access token

https://www.jetbrains.com/help/youtrack/standalone/Manage-Permanent-Token.html

### Setup YouTrack webhook
YouTrack workflow example.

```
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
```
https://github.com/igorich/YouTrackCharger/blob/master/YouTrackWorkflow.js
