import { Config } from './Enums/Config';

// All below configurations are the default settings - you can remove or add any configuration
export const config: Config = {
    maxPlayers: 81,
    maxConnectionsPerIP: 2,
    startingScore: 300,
    //maxSpeed: 75,
    maxHealth: 100,
    fogEnabled: false,
    scoreSquareEnabled: true,
    scoreSquareGain: 15,
    noMidPerkTimeout: false,
    bulletDamageEnabled: true, 
    playerCollisionsEnabled: true,
    //premiumCratesEnabled: true,
    //bottomlessMags: true,
    //generateMaze: {
    //    organic: true
    //}
    customClient: true
}