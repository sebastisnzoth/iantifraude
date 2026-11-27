import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Linking, ScrollView, Text, TextInput, View } from 'react-native';
import { Card, PrimaryButton, SectionTitle } from '../components/ui';
import { useApp } from '../src/AppContext';
import { countrySources, localReply, translate } from '../src/ai/assistant';
import { remoteAvailable, remoteReply } from '../src/ai/remote';

type Turn = { question: string; answer: string; method: string };
type Country = keyof typeof countrySources | 'other';

export default function AssistantScreen() {
  const { theme, lang, proActive } = useApp();
  const tr = (es: string, pt: string, en: string) => translate([es, pt, en], lang);
  const [country, setCountry] = useState<Country>('other');
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [working, setWorking] = useState(false);
  const locked = useRef(false);
  const questions = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const local = tr('Análisis heurístico local', 'Análise heurística local', 'Local heuristic analysis');
  const title = tr('Asistente antifraude', 'Assistente antifraude', 'Fraud assistant');
  const fg = { color: theme.text };
  async function submit(online: boolean) {
    const question = draft.trim();
    if (locked.current || !proActive || question.length < 3) return;
    locked.current = true;
    setWorking(true);
    let method = local;
    let answer = '';
    try {
      if (online) {
        try {
          answer = await remoteReply(question, lang, true);
          method = tr('IA contextual · Mistral', 'IA contextual · Mistral', 'Contextual AI · Mistral');
        } catch {
          method = tr('IA indisponible · análisis heurístico local', 'IA indisponível · análise heurística local', 'AI unavailable · local heuristic analysis');
        }
      }
      if (!answer) answer = localReply(question, lang);
      setTurns(previous => [...previous.slice(-9), { question, answer, method }]);
      setDraft('');
    } finally {
      locked.current = false;
      setWorking(false);
    }
  }
  const notice = tr('Se enviará solo este mensaje a Cloudflare Workers AI y un identificador de instalación a RevenueCat para validar Pro. Quitá datos personales, claves y códigos antes de continuar.', 'Somente esta mensagem será enviada ao Cloudflare Workers AI e um identificador da instalação ao RevenueCat para validar o Pro. Remova dados pessoais, senhas e códigos antes de continuar.', 'Only this message will be sent to Cloudflare Workers AI and an installation ID to RevenueCat to verify Pro. Remove personal information, passwords and codes first.');
  const guide = country === 'BR'
    ? tr('Si enviaste un Pix por una estafa, contactá a tu banco por su app oficial y pedí que evalúe el caso por el MED.', 'Se você fez um Pix por golpe, contate o banco pelo aplicativo oficial e peça a análise pelo MED.', 'If you sent a Pix payment to a scammer, contact your bank through its official app and request a review under MED.')
    : country === 'AR'
    ? tr('Podés hacer la denuncia en la comisaría u oficina receptora de tu domicilio y reportar el caso a la UFECI.', 'Você pode denunciar na delegacia ou no órgão local de denúncias e comunicar o caso à UFECI.', 'Report to your local police station or complaints office. You can also report to UFECI.')
    : tr('Usá los canales oficiales de tu banco y de la policía de tu país.', 'Use os canais oficiais do banco e da polícia do seu país.', 'Use the official channels of your bank and your local police.');
  return <ScrollView ref={questions} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 8, flexGrow: 1, backgroundColor: theme.bg }}>
    <SectionTitle>{title}</SectionTitle>
    {!proActive ? <PrimaryButton title="AntiGolpe AI Pro" onPress={() => router.push('/premium')} /> : <>
      <Text style={fg}>{tr('Contame qué pasó o pegá un mensaje sospechoso. La conversación se mantiene en memoria mientras esta pantalla está abierta.', 'Conte o que aconteceu ou cole uma mensagem suspeita. A conversa fica na memória enquanto esta tela está aberta.', 'Describe what happened or paste a suspicious message. This conversation stays in memory while this screen is open.')}</Text>
      {turns.map((turn, index) => <Card key={index}>
        <Text style={[fg, { fontWeight: '700' }]}>{turn.question}</Text>
        <Text style={{ color: theme.muted, marginVertical: 8 }}>{turn.method}</Text>
        <Text selectable style={fg}>{turn.answer}</Text>
      </Card>)}
      <TextInput accessibilityLabel={title} multiline maxLength={2400} value={draft} editable={!working} onChangeText={setDraft}
        placeholder={tr('Escribí tu consulta', 'Escreva sua pergunta', 'Type your question')} placeholderTextColor={theme.muted}
        style={{ color: theme.text, backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, padding: 14, minHeight: 96, borderRadius: 12 }} />
      {working ? <Text accessibilityLiveRegion="polite" style={fg}>{tr('Analizando…', 'Analisando…', 'Analyzing…')}</Text> : draft.trim().length >= 3 ? <>
        <PrimaryButton title={local} onPress={() => void submit(false)} />
        {remoteAvailable && <PrimaryButton secondary title={tr('Consultar con IA', 'Consultar IA', 'Ask AI')} onPress={() => Alert.alert(title, notice, [
          { text: tr('Cancelar', 'Cancelar', 'Cancel'), style: 'cancel' },
          { text: tr('Enviar este mensaje', 'Enviar esta mensagem', 'Send this message'), onPress: () => void submit(true) },
        ])} />}
      </> : null}
      {turns.length > 0 && !working && <PrimaryButton secondary title={tr('Borrar conversación', 'Apagar conversa', 'Clear conversation')} onPress={() => { setTurns([]); setDraft(''); }} />}
      <SectionTitle>{tr('Dónde pedir ayuda', 'Onde buscar ajuda', 'Where to get help')}</SectionTitle>
      <View accessibilityRole="radiogroup">{(['BR', 'AR', 'other'] as const).map(code =>
        <PrimaryButton key={code} secondary={country !== code} onPress={() => setCountry(code)}
          title={code === 'BR' ? 'Brasil' : code === 'AR' ? 'Argentina' : tr('Otro país', 'Outro país', 'Other country')} />)}</View>
      <Text style={fg}>{guide}</Text>
      {country !== 'other' && <PrimaryButton secondary title={country === 'BR' ? 'Banco Central do Brasil' : 'Argentina.gob.ar'} onPress={() => {
        Linking.openURL(countrySources[country]).catch(() => Alert.alert(title, countrySources[country]));
      }} />}
    </>}
  </ScrollView>;
}
