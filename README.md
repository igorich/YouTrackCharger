# YouTrackCharger
YouTrack integration

## Features
- if message in DM/channel contains YT link -> this link will converted to pretty issue card.
- if your issue was updated in YT -> notification to DM chat \w Charger bot

## Commands
### channels related
- /yt-add <board url> <work item prefix> <auth token>. Adds a board to the global list.
- /yt-list. Display all registered YouTrack boards.
- /yt-remove <board url>|<work item prefix>. Remove YouTrack board from global list.

### DM related
- /yt-subscribe <board url>. Subscribe to board events. You will be notified if you is a reporter of updated item. Board should be in global access list.
- /yt-unsubscribe <board url>. Unsubscribe from the notifications from current board.
- /yt-my-list. List your subscriptions

## Dev docs
### Global settings storage *under construction*
- boards+pref+token
- user-to-board subscriptions on/off
