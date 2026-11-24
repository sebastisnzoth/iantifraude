import { setAnalysis } from '../src/session';
import React, {useState} from 'react';
import { ScrollView, Text, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useApp } from '../src/AppContext';
import { PrimaryButton } from '../components/ui';
import { sanitizeText, validateImageSize, validateText } from '../src/validation';
export default function Ocr(){
 const {strings:s,theme}=useApp(); const router=useRouter(); const [text,setText]=useState(''); const [notice,setNotice]=useState('');
 const pick=async(camera:boolean)=>{try{if(camera){const p=await ImagePicker.requestCameraPermissionsAsync(); if(!p.granted){setNotice(s.ocrNoPermission);return;}} const result=camera?await ImagePicker.launchCameraAsync({mediaTypes:['images']}):await ImagePicker.launchImageLibraryAsync({mediaTypes:['images']}); if(result.canceled)return; const size=result.assets[0].fileSize; if(size != null&&!validateImageSize(size)){setNotice(s.ocrTooLarge);return;} setNotice(s.ocrManual);}catch{setNotice(s.ocrFailed);}};
 return <ScrollView contentContainerStyle={{padding:20,backgroundColor:theme.bg,flexGrow:1}}><Text style={{color:theme.text,fontSize:20,fontWeight:'700'}}>{s.ocrTitle}</Text><Text style={{color:theme.text,marginVertical:12}}>{s.ocrManual}</Text><PrimaryButton secondary title={s.ocrPick} onPress={()=>pick(false)}/><PrimaryButton secondary title={s.ocrCamera} onPress={()=>pick(true)}/><Text style={{color:theme.text}}>{notice}</Text><TextInput accessibilityLabel={s.ocrManual} multiline maxLength={20000} value={text} onChangeText={setText} style={{height:180,borderWidth:1,borderColor:theme.border,backgroundColor:theme.card,color:theme.text,padding:12,marginVertical:12,textAlignVertical:'top'}}/><PrimaryButton title={s.ocrAnalyze} onPress={()=>{const clean=sanitizeText(text);if(!validateText(clean).ok){setNotice(s.emptyError);return;}setAnalysis(clean,'ocr');router.push('/result');}}/></ScrollView>;
}
