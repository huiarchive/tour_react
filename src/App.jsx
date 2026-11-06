import "./App.css";
import React, { useState, useEffect } from "react";
import { 
  saveSelectedArea, 
  getSelectedArea, 
  toggleFavorite, 
  getFavorites 
} from "./firebase";


// 공공데이터포털 Decoding(디코딩) 키
const TOUR_API_KEY = import.meta.env.VITE_TOUR_API_KEY || "YOUR_PUBLIC_DATA_DECODING_KEY";

const AREA_LIST = [
  { code: "1", name: "서울" },
  { code: "2", name: "인천" },
  { code: "3", name: "대전" },
  { code: "4", name: "대구" },
  { code: "5", name: "광주" },
  { code: "6", name: "부산" },
  { code: "7", name: "울산" },
  { code: "8", name: "세종" },
  { code: "31", name: "경기도" },
  { code: "32", name: "강원특별자치도" },
  { code: "39", name: "제주도" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("explore");
  const [selectedArea, setSelectedArea] = useState("");
  const [statusText, setStatusText] = useState("");
  const [loading, setLoading] = useState(false);
  const [tourItems, setTourItems] = useState([]);
  const [favoritesMap, setFavoritesMap] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await fetchFavorites();
    try {
      const saved = await getSelectedArea();
      if (saved && saved.areaCode) {
        setSelectedArea(saved.areaCode);
        setStatusText(`Firestore에서 이전 저장 지역 [${saved.areaName}] 정보를 불러왔습니다.`);
        fetchTourData(saved.areaCode, saved.areaName);
      } else {
        setStatusText("저장된 지역 정보가 없습니다. 지역을 선택해 주세요.");
      }
    } catch (err) {
      console.error(err);
      setStatusText("지역을 선택하여 이용해 주세요.");
    }
  };

  const fetchFavorites = async () => {
    const favs = await getFavorites();
    setFavoritesMap(favs);
  };

  const fetchTourData = async (areaCode, areaName) => {
    setLoading(true);
    const url = `https://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${encodeURIComponent(TOUR_API_KEY)}&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&arrange=A&areaCode=${areaCode}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      let items = data.response?.body?.items?.item || [];
      if (!Array.isArray(items)) items = [items];

      if (items.length === 0) {
        setStatusText(`[${areaName}] 지역의 데이터가 없습니다.`);
        setTourItems([]);
      } else {
        setTourItems(items);
        setStatusText(`현재 선택된 지역: ${areaName} (총 ${items.length}건)`);
      }
    } catch (err) {
      console.error(err);
      setStatusText("관광 정보를 불러오는 중 오류가 발생했습니다.");
      setTourItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAreaChange = async (e) => {
    const areaCode = e.target.value;
    setSelectedArea(areaCode);

    if (!areaCode) {
      setTourItems([]);
      setStatusText("");
      return;
    }

    const areaObj = AREA_LIST.find((a) => a.code === areaCode);
    const areaName = areaObj ? areaObj.name : "";

    await fetchTourData(areaCode, areaName);
    await saveSelectedArea(areaCode, areaName);
  };

  const handleToggleFavorite = async (item) => {
    await toggleFavorite(item);
    await fetchFavorites();
  };

  const favItemList = Object.values(favoritesMap);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b pb-4 gap-4">
          <h1 className="text-2xl font-extrabold text-slate-900">🗺️ 대한민국 지역별 관광 탐색기</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("explore")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === "explore"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white text-slate-600 border hover:bg-slate-100"
              }`}
            >
              📍 관광지 탐색
            </button>
            <button
              onClick={() => {
                setActiveTab("favorites");
                fetchFavorites();
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                activeTab === "favorites"
                  ? "bg-rose-500 text-white shadow"
                  : "bg-white text-slate-600 border hover:bg-slate-100"
              }`}
            >
              ❤️ 찜 보관함 <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{favItemList.length}</span>
            </button>
          </div>
        </header>

        {activeTab === "explore" && (
          <main>
            <section className="max-w-md mx-auto bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
              <label htmlFor="areaSelect" className="font-bold text-slate-700 whitespace-nowrap">
                지역 선택:
              </label>
              <select
                id="areaSelect"
                value={selectedArea}
                onChange={handleAreaChange}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- 지역을 선택하세요 --</option>
                {AREA_LIST.map((area) => (
                  <option key={area.code} value={area.code}>
                    {area.name}
                  </option>
                ))}
              </select>
            </section>

            <div className="text-center text-sm font-medium text-slate-600 mb-4">{statusText}</div>
            {loading && <div className="text-center py-8 font-bold text-blue-600">데이터를 불러오는 중입니다...</div>}

            {!loading && tourItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {tourItems.map((item) => {
                  let imageUrl = item.firstimage || "https://via.placeholder.com/400x260?text=No+Image";
                  if (imageUrl.startsWith("http://")) imageUrl = imageUrl.replace("http://", "https://");
                  const isFav = !!favoritesMap[String(item.contentid)];

                  return (
                    <article
                      key={item.contentid}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition"
                    >
                      <div className="relative aspect-video bg-slate-200">
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="w-full h-44 object-cover"
                          onError={(e) => (e.target.src = "https://via.placeholder.com/400x260?text=Image+Error")}
                        />
                        <button
                          onClick={() => handleToggleFavorite(item)}
                          className="absolute top-2 right-2 bg-white/80 p-2 rounded-full shadow hover:scale-110 transition text-base"
                          title={isFav ? "찜 취소" : "찜하기"}
                        >
                          {isFav ? "❤️" : "🤍"}
                        </button>
                      </div>
                      <div className="p-4">
                        <h2 className="font-bold text-slate-800 line-clamp-1">{item.title}</h2>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">📍 {item.addr1 || "주소 미제공"}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        )}

        {activeTab === "favorites" && (
          <main>
            {favItemList.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-medium">찜한 관광지가 없습니다.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favItemList.map((item) => {
                  let imageUrl = item.firstimage || "https://via.placeholder.com/400x260?text=No+Image";
                  if (imageUrl.startsWith("http://")) imageUrl = imageUrl.replace("http://", "https://");

                  return (
                    <article
                      key={item.contentid}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between"
                    >
                      <div className="relative aspect-video bg-slate-200">
                        <img src={imageUrl} alt={item.title} className="w-full h-44 object-cover" />
                        <button
                          onClick={() => handleToggleFavorite(item)}
                          className="absolute top-2 right-2 bg-white/90 px-3 py-1.5 rounded-full shadow text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                      <div className="p-4">
                        <h2 className="font-bold text-slate-800 line-clamp-1">{item.title}</h2>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">📍 {item.addr1 || "주소 미제공"}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}