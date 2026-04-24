import axios from 'axios';

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;

// 주식 뉴스 가져오기
export const getStockNews = async (query: string) => {
  try {
    const response = await axios.get(`https://newsapi.org/v2/everything`, {
      params: {
        q: query,
        sortBy: 'publishedAt',
        apiKey: NEWS_API_KEY,
        pageSize: 5,
      },
    });
    return response.data.articles;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
};

// CORS 우회를 위해 AllOrigins 프록시 사용 및 Yahoo Finance 데이터 파싱
export const getStockDataFromGoogle = async (symbol: string) => {
  try {
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
    // CORS 차단 회피를 위한 프록시 경유
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
    
    const response = await axios.get(proxyUrl);
    const data = JSON.parse(response.data.contents);
    
    if (!data.chart.result) return null;

    const result = data.chart.result[0];
    const quotes = result.indicators.quote[0].close;
    const timestamps = result.timestamp;

    if (!timestamps || !quotes) return null;

    return timestamps.map((ts: number, i: number) => {
        const val = quotes[i];
        return {
            name: new Date(ts * 1000).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
            value: val ? Math.floor(val) : null,
        };
    }).filter((d: any) => d.value !== null);
  } catch (error) {
    console.error('Error fetching data through proxy:', error);
    return null;
  }
};
