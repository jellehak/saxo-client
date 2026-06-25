// Minimal Saxo Client - Isomorphic (Node.js & Browser)
// ESM module with functional programming style

const GATEWAY = 'https://gateway.saxobank.com/sim/openapi';

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
      throw new Error(`API Error: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json();
  };

  return {
    buy: async (orderData) => {
      return request('POST', '/trade/v2/orders', {
        AccountKey: clientKey,
        OrderType: 'Market',
        BuySell: 'Buy',
        ...orderData,
      });
    },

    sell: async (orderData) => {
      return request('POST', '/trade/v2/orders', {
        AccountKey: clientKey,
        OrderType: 'Market',
        BuySell: 'Sell',
        ...orderData,
      });
    },

    listPortfolio: async (fieldGroups = 'NetPositionBase,NetPositionView,DisplayAndFormat') => {
      return request('GET', '/port/v1/netpositions', null, {
        FieldGroups: fieldGroups,
        ClientKey: clientKey,
      });
    },

    fetchInstrument: async (uic, assetType = 'FxSpot') => {
      return request('GET', `/ref/v1/instruments/${uic}`, null, {
        AssetTypes: assetType,
      });
    },

    fetchChart: async (uic, assetType = 'FxSpot', params = {}) => {
      const url = `https://gateway.saxobank.com/sim/chart/v3/charts`;
      return request('GET', url, null, {
        Uic: uic,
        AssetType: assetType,
        ...params,
      });
    },
  };
};

export { createClient };
