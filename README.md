# Browser.JS - Browsers in browsers | You're on the `main` branch

You've done it! You've found Browser.JS. But now what? Why does it exist, what does it do, why should I use it?

All will be answered soon™

## What is Browser.JS?

Browser.JS was created as a means to bypass censorship by masking web traffic for sites over websockets.


Alright, that's not really why it was created, but it's what it is now. Browser.JS was originally created because someone told me I couldn't get porn through the school firewall without using a VPN, AnyDesk, or mobile data. 

Turns out you can get porn through the school firewall, but I digress. 

## What does Browser.JS do?

Browser.JS bypasses censorship by pushing traffic to a website through one or more websocket connections. This makes it far harder to run DPI on, as it looks like standard HTTPS traffic. 

## So why should I use it?

A lot of people don't have access to the entire web, and Browser.JS helps circumvent restrictions placed on the network - information wants to be free, this is a tool to assist in that. By deploying this (not on Heroku!), you're enabling people who may not be able to get to the outside world by other means access to the internet. Whether that be people in countries where oppression is extreme, or if they're in a domestic violence situations, Browser.JS can help.


## So how do I use it?

There are two components to Browser.JS as it stands right now. A client and a server. The server can be put behind a reverse proxy like nginx (and it's recommended you do so), and the client consists of static files. 

To run the server it's as simple as:

```bash
npm i
npm run start
```

Then, all you have to do is change the websocket server configuration on [Line 90 of index.html](https://github.com/td512/browser/blob/main/client/index.html) and [Line 10 of worker.js](https://github.com/td512/browser/blob/main/client/worker.js)

That's it! You're done. You can now browse to the place you put the client, and all things going well you'll be looking at something like this:

<img width="200px" src="https://share.s3.theom.nz/60b5f3a0-a95d-4572-bbef-1e018897027a/chrome_wSEz1aLRD2.png" />
