import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { Card, PrimaryButton } from '../../components/ui';
import { useApp } from '../../src/AppContext';
import { loadHistory, removeHistory, clearHistory, type HistoryEntry } from '../../src/storage';
export default function History() {
 const {strings:s,theme,prefs}=useApp(); const [items,setItems]=useState<HistoryEntry[]>([]);
 const refresh=useCallback(()=>{loadHistory().then(setItems).catch(()=>setItems([]));},[]);
 useFocusEffect(useCallback(()=>{refresh();},[refresh]));
 return <ScrollView contentContainerStyle={{padding:20,backgroundColor:theme.bg}}><Text style={{color:theme.text,fontSize:18}}>{prefs.historyEnabled?s.historyEnabled:s.historyOff}</Text>
 {prefs.historyEnabled && (items.length ? items.map(e=><Card key={e.id}><Text style={{color:theme.text}}>{new Date(e.date).toLocaleString()} · {e.type} · {e.level===2?s.riskHigh:e.level===1?s.riskMid:s.riskLow} · {e.count}</Text><PrimaryButton secondary title={s.deleteItem} onPress={()=>{removeHistory(e.id).then(setItems);}} /></Card>):<Text style={{color:theme.text}}>{s.historyEmpty}</Text>)}
 {items.length>0 && <PrimaryButton secondary title={s.clearHistory} onPress={()=>{clearHistory().then(refresh);}}/>}</ScrollView>;
}
