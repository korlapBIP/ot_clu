import { firebaseSettings } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

function isPlaceholderConfig(config){
  if(!config) return true;
  return Object.values(config).some(value => String(value || '').startsWith('ISI_') || !String(value || '').trim());
}

function cleanWorkers(workers){
  if(!Array.isArray(workers)) return [];
  return workers
    .filter(w => w && w.no !== undefined && w.nama !== undefined)
    .map(w => ({
      no: String(w.no).trim(),
      nama: String(w.nama).trim(),
      selected: !!w.selected
    }))
    .filter(w => w.no && w.nama);
}


function cleanAdminSettings(settings){
  if(!settings || typeof settings !== 'object') return {};
  const passwordHash = String(settings.passwordHash || '').trim();
  return passwordHash ? { passwordHash } : {};
}

export function createLemburDatabase(){
  const state = {
    enabled: false,
    db: null,
    auth: null,
    collectionPrefix: firebaseSettings.collectionPrefix || 'lembur_bip'
  };

  return {
    get enabled(){ return state.enabled; },

    async init(){
      if(!firebaseSettings.enabled || isPlaceholderConfig(firebaseSettings.firebaseConfig)){
        state.enabled = false;
        return { enabled:false, reason:'Firebase belum dikonfigurasi.' };
      }

      const app = initializeApp(firebaseSettings.firebaseConfig);
      state.auth = getAuth(app);
      await signInAnonymously(state.auth);
      state.db = getFirestore(app);
      state.enabled = true;
      return { enabled:true };
    },

    async loadWorkers(){
      if(!state.enabled) return null;
      const ref = doc(state.db, state.collectionPrefix, 'workers');
      const snap = await getDoc(ref);
      if(!snap.exists()) return null;
      return cleanWorkers(snap.data().items || []);
    },

    async saveWorkers(workers){
      if(!state.enabled) return false;
      const ref = doc(state.db, state.collectionPrefix, 'workers');
      await setDoc(ref, {
        items: cleanWorkers(workers),
        updatedAt: serverTimestamp(),
        updatedBy: state.auth.currentUser ? state.auth.currentUser.uid : null
      }, { merge:true });
      return true;
    },

    async loadAdminSettings(){
      if(!state.enabled) return null;
      const ref = doc(state.db, state.collectionPrefix, 'admin_settings');
      const snap = await getDoc(ref);
      if(!snap.exists()) return null;
      return cleanAdminSettings(snap.data() || {});
    },

    async saveAdminSettings(settings){
      if(!state.enabled) return false;
      const ref = doc(state.db, state.collectionPrefix, 'admin_settings');
      await setDoc(ref, {
        ...cleanAdminSettings(settings),
        updatedAt: serverTimestamp(),
        updatedBy: state.auth.currentUser ? state.auth.currentUser.uid : null
      }, { merge:true });
      return true;
    },

    async saveReport(report){
      if(!state.enabled) return false;
      const safeReport = {
        ...report,
        createdAt: serverTimestamp(),
        createdBy: state.auth.currentUser ? state.auth.currentUser.uid : null
      };
      const ref = collection(state.db, state.collectionPrefix, 'reports', 'items');
      await addDoc(ref, safeReport);
      return true;
    },

    async loadReportsByDate(tanggal){
      if(!state.enabled) return [];
      const ref = collection(state.db, state.collectionPrefix, 'reports', 'items');
      const q = query(ref, where('tanggal', '==', String(tanggal || '')));
      const snap = await getDocs(q);
      return snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    }
  };
}
