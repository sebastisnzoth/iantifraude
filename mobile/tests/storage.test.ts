import { addHistory, clearAllLocalData, clearHistory, loadHistory, loadPrefs, removeHistory, savePrefs, DEFAULT_PREFS } from '../src/storage';
const values: Record<string,string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({__esModule:true,default:{getItem:jest.fn(async (key:string)=>values[key] ?? null),setItem:jest.fn(async (key:string,value:string)=>{values[key]=value;}),removeItem:jest.fn(async (key:string)=>{delete values[key];})}}));
beforeEach(()=>{Object.keys(values).forEach(k=>delete values[k]);});
test('history stores only metadata and deletes individual entries', async()=>{let list=await addHistory({type:'message',level:1,count:2});expect(Object.keys(list[0]).sort()).toEqual(['count','date','id','level','type']);expect(await loadHistory()).toHaveLength(1);expect(await removeHistory(list[0].id)).toHaveLength(0);});
test('preferences and all local data can be cleared',async()=>{await savePrefs({...DEFAULT_PREFS,historyEnabled:true,language:'en'});expect((await loadPrefs()).language).toBe('en');await addHistory({type:'qr',level:0,count:0});await clearHistory();expect(await loadHistory()).toEqual([]);await clearAllLocalData();expect((await loadPrefs()).historyEnabled).toBe(false);});
test('concurrent additions and deletion remain ordered', async()=>{
 await Promise.all([addHistory({type:'message',level:0,count:0}),addHistory({type:'link',level:1,count:1})]);
 expect(await loadHistory()).toHaveLength(2);
 await Promise.all([addHistory({type:'qr',level:2,count:3}),clearHistory()]);
 expect(await loadHistory()).toEqual([]);
});
test('invalid stored preferences do not enable history',async()=>{
 values['antigolpe:prefs'] = JSON.stringify({historyEnabled:'true',language:'unsupported',darkMode:'false'});
 expect(await loadPrefs()).toEqual(DEFAULT_PREFS);
});
