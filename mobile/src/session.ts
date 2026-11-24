// El contenido sensible permanece solo en memoria, nunca en rutas ni almacenamiento.
import type { AnalysisType } from './engine';
let draft = '';
let generation = 0;
export function sessionGeneration(){ return generation; }
let current: {text:string; type:AnalysisType} = {text:'',type:'message'};
export function setDraft(value:string){draft=value;}
export function takeDraft(){const value=draft;draft='';return value;}
export function setAnalysis(text:string,type:AnalysisType){current={text,type};}
export function getAnalysis(){return current;}
export function clearSession(){draft='';current={text:'',type:'message'};generation++;}
