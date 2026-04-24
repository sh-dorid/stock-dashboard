import React, { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Search, Bell, User, Star, ArrowUpRight, ArrowDownRight, 
  Loader2, Activity, Globe, Newspaper, LayoutGrid, TrendingUp
} from 'lucide-react';
import { getStockNews, getStockDataFromGoogle } from './services/stockApi';

const STOCK_MAP: { [key: string]: string } = {
  '삼성전자': '005930', 'SK하이닉스': '000660', '현대차': '005380',
  '카카오': '035720', '네이버': '035420', '애플': 'AAPL',
  '테슬라': 'TSLA', '엔비디아': 'NVDA', '마이크로소프트': 'MSFT',
  '에코프로': '086520', '셀트리온': '068270'
};

function App() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [searchSymbol, setSearchSymbol] = useState(''); 
  const [currentSymbol, setCurrentSymbol] = useState('삼성전자');
  const [isLoading, setIsLoading] = useState(false);
  const [priceInfo, setPriceInfo] = useState({ price: '0', change: '0%', up: true });
  const [watchlistPrices, setWatchlistPrices] = useState<{ [key: string]: { price: string, change: string, up: boolean } }>({});

  const fetchWatchlistPrices = async () => {
    const names = Object.keys(STOCK_MAP).slice(0, 6); // 상위 6개만
    for (const name of names) {
      try {
        const symbolCode = STOCK_MAP[name];
        const apiSymbol = /^\d+$/.test(symbolCode) ? `${symbolCode}.KS` : symbolCode;
        const data = await getStockDataFromGoogle(apiSymbol);
        if (data && data.length > 0) {
          const lastPrice = data[data.length - 1].value;
          const firstPrice = data[0].value;
          const changeVal = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(1);
          setWatchlistPrices(prev => ({
            ...prev,
            [name]: {
              price: lastPrice.toLocaleString(),
              change: `${changeVal > 0 ? '+' : ''}${changeVal}%`,
              up: lastPrice >= firstPrice
            }
          }));
        }
        // 무료 API 제한을 고려한 짧은 지연 (선택 사항)
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) { console.error(e); }
    }
  };

  const fetchData = async (input: string) => {
    // ... 기존 fetchData 로직 유지
    setIsLoading(true);
    try {
      const symbolCode = STOCK_MAP[input] || input;
      const apiSymbol = /^\d+$/.test(symbolCode) ? `${symbolCode}.KS` : symbolCode;
      
      const dailyData = await getStockDataFromGoogle(apiSymbol);
      if (dailyData && dailyData.length > 0) {
        setChartData(dailyData);
        const lastPrice = dailyData[dailyData.length - 1].value;
        const firstPrice = dailyData[0].value;
        const changeVal = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
        setPriceInfo({
          price: lastPrice.toLocaleString(),
          change: `${changeVal > 0 ? '+' : ''}${changeVal}%`,
          up: lastPrice >= firstPrice
        });
      }

      const newsData = await getStockNews(input);
      if (newsData) {
        setNews(newsData.slice(0, 10).map((article: any, idx: number) => ({
          id: idx,
          title: article.title,
          time: new Date(article.publishedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          source: article.source.name,
          url: article.url
        })));
      }
      setCurrentSymbol(input);
    } catch (error) {
      console.error("Data fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData('삼성전자');
    fetchWatchlistPrices();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSymbol.trim()) {
      fetchData(searchSymbol);
      setSearchSymbol('');
    }
  };

  return (
    <div className="app-layout">
      {/* Left Panel: Watchlist */}
      <aside className="panel">
        <div className="panel-header">
          <span>MARKETS</span>
          <Activity size={18} className="up" />
        </div>
        <div style={{ padding: '0.5rem' }}>
          <table className="stock-table">
            <thead>
              <tr>
                <th>ASSET</th>
                <th>PRICE</th>
                <th>CHG</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(STOCK_MAP).slice(0, 8).map(name => {
                const info = watchlistPrices[name];
                return (
                  <tr key={name} className="stock-row" onClick={() => fetchData(name)}>
                    <td style={{ fontWeight: 600 }}>{name}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {info ? info.price : '--'}
                    </td>
                    <td style={{ textAlign: 'right' }} className={info ? (info.up ? 'up' : 'down') : ''}>
                      {info ? info.change : '--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </aside>

      {/* Center View: Chart & Dashboard */}
      <main className="main-view">
        <nav className="top-nav">
          <form onSubmit={handleSearch} className="search-box">
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search assets (e.g. 삼성전자, TSLA)" 
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
            />
          </form>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Bell size={20} className="text-secondary" />
            <User size={20} className="text-secondary" />
            <div style={{ width: 32, height: 32, background: 'var(--brand)', borderRadius: '50%' }}></div>
          </div>
        </nav>

        <section className="chart-section">
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {currentSymbol} / KRW
                </h2>
                <div className="price-display">
                  <span className="price-main">{priceInfo.price}</span>
                  <span className={`price-change ${priceInfo.up ? 'up' : 'down'}`}>
                    {priceInfo.change}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['1D', '1W', '1M', '1Y'].map(t => (
                  <button key={t} style={{ 
                    background: t === '1M' ? 'var(--brand)' : 'var(--bg-card)', 
                    border: '1px solid var(--border)',
                    color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem'
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ width: '100%', height: 400, marginTop: '1rem' }}>
              {isLoading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyCenter: 'center', background: 'var(--bg-card)', borderRadius: 12 }} className="animate-pulse">
                   <p style={{ width: '100%', textAlign: 'center' }}>Loading live market data...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" tick={{fontSize: 11}} minTickGap={30} />
                    <YAxis stroke="#475569" domain={['auto', 'auto']} orientation="right" tick={{fontSize: 11}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="var(--brand)" strokeWidth={3} fillOpacity={1} fill="url(#chartGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="trade-card">
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>MARKET STATS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Volume</span><span style={{ fontWeight: 600 }}>12.4M</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Day High</span><span className="up">74,200</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Day Low</span><span className="down">71,800</span>
                </div>
              </div>
            </div>
            <div className="trade-card">
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>TECHNICAL ANALYSIS</h4>
              <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                <p style={{ color: 'var(--accent-up)', fontSize: '1.5rem', fontWeight: 800 }}>STRONG BUY</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Based on 24 technical indicators</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Right Panel: News & Social */}
      <aside className="panel panel-right">
        <div className="panel-header">
          <span>LIVE NEWS</span>
          <Newspaper size={18} className="text-secondary" />
        </div>
        <div style={{ overflowY: 'auto' }}>
          {news.length > 0 ? news.map(item => (
            <div key={item.id} className="news-card">
              <span className="news-tag">MARKET</span>
              <a href={item.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>{item.title}</h4>
              </a>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>{item.source}</span>
                <span>{item.time}</span>
              </div>
            </div>
          )) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No recent news for this asset.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;
