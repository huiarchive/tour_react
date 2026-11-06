import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  getDocs 
} from "firebase/firestore";

// 1. .env 파일에 설정된 환경 변수를 안전하게 불러옵니다.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, // Firestore 필수 설정값
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 2. Firebase App 및 Firestore 초기화
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ------------------------------------------------------------------
// Firestore 데이터베이스 CRUD 함수 모음
// ------------------------------------------------------------------

/**
 * 1. 선택한 지역 정보 저장 / 업데이트
 * userSelection 컬렉션의 'current' 문서에 선택된 지역 코드 및 이름을 저장합니다.
 */
export async function saveSelectedArea(areaCode, areaName) {
  try {
    const docRef = doc(db, "userSelection", "current");
    await setDoc(docRef, {
      areaCode,
      areaName,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Firestore 지역 저장 에러:", error);
  }
}

/**
 * 2. 가장 최근에 선택한 지역 정보 불러오기
 */
export async function getSelectedArea() {
  try {
    const docRef = doc(db, "userSelection", "current");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Firestore 지역 조회 에러:", error);
    return null;
  }
}

/**
 * 3. 찜하기 / 찜 취소 토글 함수
 * favorites 컬렉션에 해당 관광지 contentid 문서가 존재하면 삭제(취소), 없으면 저장(추가)합니다.
 */
export async function toggleFavorite(item) {
  try {
    const contentId = String(item.contentid);
    const favDocRef = doc(db, "favorites", contentId);
    const snap = await getDoc(favDocRef);

    if (snap.exists()) {
      // 이미 찜에 존재할 경우 삭제 (찜 취소)
      await deleteDoc(favDocRef);
      return false; // false 반환 (찜 해제됨)
    } else {
      // 찜 목록에 신규 추가
      await setDoc(favDocRef, {
        contentid: item.contentid,
        title: item.title,
        addr1: item.addr1 || "",
        firstimage: item.firstimage || "",
        savedAt: new Date().toISOString()
      });
      return true; // true 반환 (찜 등록됨)
    }
  } catch (error) {
    console.error("Firestore 찜 토글 에러:", error);
    return false;
  }
}

/**
 * 4. 전체 찜 목록 조회 함수
 * favorites 컬렉션의 모든 문서를 가져와 Object 형태로 반환합니다.
 */
export async function getFavorites() {
  try {
    const querySnapshot = await getDocs(collection(db, "favorites"));
    const favoritesMap = {};
    querySnapshot.forEach((docSnap) => {
      favoritesMap[docSnap.id] = docSnap.data();
    });
    return favoritesMap;
  } catch (error) {
    console.error("Firestore 찜 목록 로드 에러:", error);
    return {};
  }
}