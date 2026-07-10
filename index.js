// Minimal Saxo Client - Isomorphic (Node.js & Browser)
// ESM module with functional programming style

const GATEWAY = 'https://gateway.saxobank.com/sim/openapi';

const ASSET_TYPE = ''; // FxSpot

const decodeToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    let payload = parts[1];
    // Add padding if needed
    payload += '='.repeat((4 - (payload.length % 4)) % 4);
    
    const decoded = JSON.parse(
      typeof atob !== 'undefined' 
        ? atob(payload) 
        : Buffer.from(payload, 'base64').toString('utf8')
    );
    
    return decoded;
  } catch (error) {
    throw new Error(`Failed to decode token: ${error.message}`);
  }
};

const createClient = (token) => {
  if (!token) {
    throw new Error('Bearer token is required');
  }

  let clientKey;
  try {
    const decoded = decodeToken(token);
    clientKey = decoded.uid;
    if (!clientKey) {
      throw new Error('Token does not contain uid field');
    }
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const request = async (method, endpoint, body = null, params = {}) => {
    let url = endpoint.startsWith('http') ? endpoint : `${GATEWAY}${endpoint}`;
    
    if (method === 'GET' && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const err = new Error(`API Error: ${response.status}`);
      err.status = response.status;
      err.body = error;
      throw err;
    }

    return response.json();
  };

  return {
    buy: async (orderData) => {
      return request('POST', '/trade/v2/orders', {
        AccountKey: clientKey,
        OrderType: 'Market',
        BuySell: 'Buy',
        AssetType: ASSET_TYPE,
        OrderDuration: { DurationType: 'DayOrder' },
        ManualOrder: true,
        ...orderData,
      });
    },

    sell: async (orderData) => {
      return request('POST', '/trade/v2/orders', {
        AccountKey: clientKey,
        OrderType: 'Market',
        BuySell: 'Sell',
        AssetType: ASSET_TYPE,
        OrderDuration: { DurationType: 'DayOrder' },
        ManualOrder: true,
        ...orderData,
      });
    },

    listPortfolio: async (fieldGroups = 'NetPositionBase,NetPositionView,DisplayAndFormat') => {
      const result = await request('GET', '/port/v1/netpositions', null, {
        FieldGroups: fieldGroups,
        ClientKey: clientKey,
      });
      return result.Data || [];
    },

    fetchInstrument: async (uic, assetType = ASSET_TYPE) => {
      return request('GET', `/ref/v1/instruments/${uic}`, null, {
        AssetTypes: assetType,
      });
    },

    fetchTradingConditions: async (uic, assetType = ASSET_TYPE) => {
      return request('GET', `/ref/v1/instruments/${uic}/details`, null, {
        AssetTypes: assetType,
        FieldGroups: 'MinimumTradeSize,PipSize,ContractSize',
      });
    },

    fetchChart: async (uic, assetType = ASSET_TYPE, params = {}) => {
      const url = `/chart/v3/charts`;
      return request('GET', url, null, {
        Uic: uic,
        AssetType: assetType,
        Horizon: '1', // Minimal tick, a day = 1440
        ...params,
      });
    },

    searchInstruments: async (keywords, assetTypes = '') => {
      const result = await request('GET', '/ref/v1/instruments', null, {
        Keywords: keywords,
        AssetTypes: assetTypes,
      });
      return result.Data || [];
    },

    detectAssetType: async (uic) => {
      const result = await request('GET', '/ref/v1/instruments', null, {
        Uics: String(uic),
      });
      if (result && result.Data && result.Data.length > 0) {
        return result.Data[0].AssetType;
      }
      throw new Error(`Could not detect asset type for UIC ${uic}`);
    },

    listOrders: async (fieldGroups = 'DisplayAndFormat') => {
      const result = await request('GET', '/port/v1/orders/me', null, {
        FieldGroups: fieldGroups,
      });
      return result.Data || [];
    },

    listRecentTransactions: async (params = {}) => {
      const result = await request('GET', '/port/v1/closedpositions/me', null, {
        FieldGroups: 'DisplayAndFormat,ExchangeInfo',
        ...params,
      });
      return result.Data || [];
    },

    getBalance: async (params = {}) => {
      const result = await request('GET', '/port/v1/balances', null, {
        AccountKey: clientKey,
        ClientKey: clientKey,
        ...params,
      });
      return result.Data ? result.Data[0] : result;
    },

    getMe: async (params = {}) => {
      const result = await request('GET', '/port/v1/accounts/me', null, {
        FieldGroups: 'AccountStatus,CurrencyDecimals',
        ...params,
      });
      return result.Data ? result.Data[0] : result;
    },

    lookupInstrument: async (symbol) => {
      const result = await request('GET', `/lookup/${symbol}`, null);
      return result;
    },

    listLookupInstruments: async () => {
      const result = await request('GET', '/lookup', null);
      return result;
    },
  };
};

export { createClient };
