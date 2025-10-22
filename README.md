# gats-custom
Gats.io custom server template written in TypeScript

# Installation
After cloning the repo, run:

```bash
npm install
npm run start
```

# Server configuration
To change server configuration, see [`config.ts`](./src/config.ts) for all active configurations, and to see all possible configurations, see [`Config.ts`](./src/Enums/Config.ts)

If a configuration has a limit, it will show in a comment above the configuration in [`Config.ts`](./src/Enums/Config.ts)

# Client
Create a new tampermonkey script for gats.io and paste in [`userscript.js`](./src/Client/userscript.js) and save it. Make sure the port matches your server port and your server is running before reloading the site.

# Gamemodes
Currently, the only gamemode supported is FFA. Other gamemodes such as TDM and DOM are coming soon, as well as custom gamemodes. 