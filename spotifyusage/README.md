# Music Habits (Spotify)

This app gives you a Spotify Rewind whenever you want. You can see your most played artists and tracks, and also see some metrics about your average music preferences in a radar chart. 

I made this weekend project with the goal of learning about the [Proof Key for Code Exchange (PKCE) authorization flow](https://tools.ietf.org/html/rfc7636). The authentication with Spotify was the most challenging portion of this project. For example, I was using a regular base64 encoding of my key but the API was expecting a base64URL encoding which was a subtle bug that took a while to track down. I also learned about using the HTML web storage API when I realized I needed to store a refresh token and an end date to regularly re-authenticate with Spotify. 

Once the authorization flow was complete, pulling data from the Spotify API was straight-forward, so I also made a graph of the average metrics of the top tracks using Chart.js. 