import { setAnalysis } from '../src/session';
import React, {useState} from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../src/AppContext';
import { PrimaryButton, Card } from '../components/ui';
import { classifyQrContent, type QrClassification } from '../src/qr';
export default function Qr(){
 const {strings:s,theme}=useApp(); const router=useRouter(); const [permission,request]=useCameraPermissions(); const [scan,setScan]=useState<QrClassification|null>(null);
 return <ScrollView contentContainerStyle={{padding:20,flexGrow:1,backgroundColor:theme.bg}}><Text style={{color:theme.text,fontSize:20,fontWeight:'700',marginBottom:12}}>{s.qrTitle}</Text>
 {!permission?.granted ? <><Text style={{color:theme.text}}>{s.qrPermission}</Text><PrimaryButton title={s.qrGrant} onPress={()=>{request().catch(()=>{});}}/></> : !scan ? <><Text style={{color:theme.text}}>{s.qrPoint}</Text><CameraView style={{height:320,marginVertical:12}} barcodeScannerSettings={{barcodeTypes:['qr']}} onBarcodeScanned={({data})=>setScan(classifyQrContent(data.slice(0,20000)))}/></> : <Card><Text style={{color:theme.text,fontSize:18}}>{scan.kind==='pix'?s.qrKindPix:scan.kind==='url'?s.qrKindUrl:scan.kind==='other'?s.qrKindOther:s.qrKindText}</Text>
 {scan.kind==='pix'? <><Text style={{color:theme.text}}>{s.qrPixNote}</Text>{scan.pix && [[s.qrName,scan.pix.merchantName],[s.qrCity,scan.pix.merchantCity],[s.qrAmount,scan.pix.amount],[s.qrTxid,scan.pix.txid],[s.qrCrc,scan.pix.crcValid===undefined?undefined:scan.pix.crcValid?s.qrValid:s.qrInvalid]].map(([k,v])=>v?<Text key={k} style={{color:theme.text}}>{k}: {v}</Text>:null)}</>:<Text selectable style={{color:theme.text}}>{scan.raw}</Text>}
 <PrimaryButton title={s.analyzeBtn} onPress={()=>(setAnalysis(scan.raw,'qr'),router.push('/result'))}/><PrimaryButton secondary title={s.qrRescan} onPress={()=>setScan(null)}/></Card>}
 </ScrollView>;
}
