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

You can also now use a **custom client** if you want more configuration options like overlay messages, custom gamemodes and more. Save [`2.1.3-custom.js`](./src/Client/public/2.1.3-custom.js) as a chrome override for gats.io's 2.1.3.js. If you do use the custom client, make sure the `customClient` configuration is set to true.

# Gamemodes
gats-custom current supports the following gamemodes:
```
- FFA
- CTF
```