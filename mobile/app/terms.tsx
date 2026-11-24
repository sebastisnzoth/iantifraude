import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useApp } from '../src/AppContext';
export default function Screen(){const {strings:s,theme}=useApp(); return <ScrollView contentContainerStyle={{padding:24,backgroundColor:theme.bg,flexGrow:1}}><Text style={{color:theme.text,fontSize:24,fontWeight:'800',marginBottom:16}}>{s.termsTitle}</Text><Text style={{color:theme.text,fontSize:17,lineHeight:26}}>{s.termsBody}</Text></ScrollView>;}
