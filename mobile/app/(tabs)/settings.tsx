import React, { useState } from 'react';
import { ScrollView, Text, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, PrimaryButton, SectionTitle } from '../../components/ui';
import { useApp } from '../../src/AppContext';
import { clearAllLocalData, DEFAULT_PREFS } from '../../src/storage';
import type { Lang } from '../../src/engine';
import { clearSession } from '../../src/session';
import { premiumStrings } from '../../src/premium/strings';
export default function Settings(){
 const {strings:s,theme,prefs,updatePrefs}=useApp(); const router=useRouter();
 const [confirming,setConfirming]=useState(false); const [notice,setNotice]=useState('');
 const save=(patch: Parameters<typeof updatePrefs>[0])=>{updatePrefs(patch).catch(()=>setNotice(s.storageError));};
 const toggle=(label:string,value:boolean,fn:(v:boolean)=>void)=><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}><Text style={{color:theme.text,flex:1,fontSize:16}}>{label}</Text><Switch value={value} onValueChange={fn} accessibilityLabel={label}/></View>;
 return <ScrollView contentContainerStyle={{padding:20,paddingBottom:40,backgroundColor:theme.bg}}>
 <SectionTitle>{s.settingsLanguage}</SectionTitle><Card>{(['es','pt','en'] as Lang[]).map(l=><PrimaryButton key={l} secondary title={(prefs.language===l?'✓ ':'')+({es:'Español',pt:'Português (Brasil)',en:'English'}[l])} onPress={()=>{save({language:l});}}/>)}</Card>
 <Card>{toggle(s.settingsDark,prefs.darkMode,v=>{save({darkMode:v});})}{toggle(s.settingsHistory,prefs.historyEnabled,v=>{save({historyEnabled:v});})}<Text style={{color:theme.muted}}>{s.settingsHistoryDesc}</Text></Card>
 <SectionTitle>{s.settingsAi}</SectionTitle><Card><Text style={{color:theme.text}}>{s.settingsAiLocal}</Text></Card>
 <PrimaryButton secondary title={s.settingsPrivacy} onPress={()=>router.push('/privacy')}/><PrimaryButton secondary title={s.settingsTerms} onPress={()=>router.push('/terms')}/><PrimaryButton secondary title={s.help} onPress={()=>router.push('/help')}/>
 <Card><Text style={{color:theme.text}}>{s.aboutBody}</Text></Card><PrimaryButton secondary title={premiumStrings(prefs.language).title} onPress={()=>router.push('/premium')}/>
 {notice ? <Text accessibilityLiveRegion="polite" style={{color:theme.text,marginVertical:8}}>{notice}</Text> : null}
 {!confirming ? <PrimaryButton secondary title={s.settingsClear} onPress={()=>{setNotice('');setConfirming(true);}}/> : <Card>
 <Text style={{color:theme.text,fontSize:16}}>{s.confirmClear}</Text>
 <PrimaryButton title={s.confirmDelete} onPress={()=>{setConfirming(false);clearSession();clearAllLocalData().then(()=>updatePrefs({...DEFAULT_PREFS,onboardingDone:true})).then(()=>setNotice(s.settingsClearDone)).catch(()=>setNotice(s.storageError));}}/>
 <PrimaryButton secondary title={s.cancel} onPress={()=>setConfirming(false)}/></Card>}
 </ScrollView>;
}
