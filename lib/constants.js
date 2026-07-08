
/**
 * Init demo and return config and helper functions.
 * @param {Object} settings The required elements in the website.
 * @return {Object} Object with config, user object and helper functions.
 */
export function demonstrationHelper(settings) {
    // https://www.developer.saxo/openapi/learn/environments
    const configSim = {
        "grantType": "token",  // Implicit Flow. With some changes the Authorization Code Flow (grantType code) can be used
        "env": "sim",  // The SaxoTraderGO app for Simulation can be found here: https://www.saxotrader.com/sim/ (Developer Portal https://www.developer.saxo/openapi/ and https://developer.saxobank.com/openapi/ from China)
        "authUrl": "https://sim.logonvalidation.net/authorize",
        "redirectUrl": window.location.protocol + "//" + window.location.host + "/openapi-samples-js/assets/html/redirect.html",
        "apiHost": "gateway.saxobank.com",
        "apiPath": "/sim/openapi",  // SIM - Change to "/openapi" when using a Live token
        "websocketConnectUrl": "wss://sim-streaming.saxobank.com/sim/oapi/streaming/ws/connect",
        "websocketReauthUrl": "https://sim-streaming.saxobank.com/sim/oapi/streaming/ws/authorize",
        // App management: https://www.developer.saxo/openapi/appmanagement#/
        "appKey": "1a6eb56ced7c4e04b1467e7e9be9bff7"  // This is the OAuth2 client_id - no need to create your own app, unless you want to use a different redirect URL
        // "appKey": "7194692c30db42efb2c675c6c0fb2a67"  // This app is on Legacy AssetTypes, the default before November 2021 - more info: https://saxobank.github.io/openapi-samples-js/instruments/extended-assettypes/
        // "appKey": "67625f8ca809446aa10b08d6eae2c7ab"  // This app has no trading rights - use this to test how it behaves when ordering
    };
    const configLive = {
        // Using "Live" for testing the samples is a risk. Use it with care!
        "grantType": "token",  // Implicit Flow. With some changes the Authorization Code Flow (grantType code) can be used
        "env": "live",  // The SaxoTraderGO app for Live can be found here: https://www.saxotrader.com/
        "authUrl": "https://live.logonvalidation.net/authorize",
        "redirectUrl": window.location.protocol + "//" + window.location.host + "/openapi-samples-js/assets/html/redirect.html",
        "apiHost": "gateway.saxobank.com",
        "apiPath": "/openapi",
        "websocketConnectUrl": "wss://live-streaming.saxobank.com/oapi/streaming/ws/connect",
        "websocketReauthUrl": "https://live-streaming.saxobank.com/oapi/streaming/ws/authorize",
        "appKey": "4995383fd4b344e588eb784a7c666835"  // This is the OAuth2 client_id - no need to create your own app, unless you want to use a different redirect URL
        // "appKey": "ae84ff08844e40d9a7e546bb1c4bdeb7"  // This app is on Legacy AssetTypes, the default before November 2021 - more info: https://saxobank.github.io/openapi-samples-js/instruments/extended-assettypes/
    };
    return {
        configSim,
        configLive
    }
}