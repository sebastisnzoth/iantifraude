/**
 * AntiGolpe AI — Motor antifraude heurístico local (React Native / Expo).
 *
 * Evolución del motor web (`src/engine.js`): mismas familias de reglas,
 * ampliadas con categorías, explicaciones y recomendaciones multilingües.
 * No usa IA externa, no visita enlaces, no envía datos a servidores.
 *
 * La puntuación es heurística (0–100), NO una probabilidad de fraude.
 * Una sola palabra, una mención a Pix o una extensión de dominio por sí
 * solas nunca producen un nivel alto: se requiere combinación de señales.
 */

export type Lang = 'es' | 'pt' | 'en';
export type RiskLevel = 0 | 1 | 2; // 0 pocas señales, 1 moderado, 2 alto
export type AnalysisType = 'message' | 'link' | 'ocr' | 'qr';

export interface Signal {
  id: string;
  weight: number;
  category: string;
  label: Record<Lang, string>;
  explanation: Record<Lang, string>;
}

export interface UrlFinding {
  url: string;
  host: string;
  issues: string[];
}

export interface AnalysisResult {
  score: number; // 0–100 heurístico
  level: RiskLevel;
  insufficient: boolean;
  signals: Signal[];
  category: string | null;
  recommendations: string[];
  urls: UrlFinding[];
  isPix: boolean;
  charCount: number;
}

/** Pesos ajustables sin tocar la interfaz (ver engineConfig). */
export const WEIGHTS = {
  credential: 3,
  otp: 3,
  threat: 2,
  pressure: 2,
  urgency: 2,
  transfer: 1,
  prize: 2,
  http: 2,
  shortener: 1,
  suspiciousTld: 1,
  remoteAccess: 3,
  advanceFee: 3,
  extortion: 3,
  bankData: 3,
  investment: 2,
  jobScam: 2,
  impersonation: 2,
  qr: 1,
  pix: 1,
  urlAnomaly: 3,
  lookalike: 3,
  idn: 2,
} as const;

interface Rule {
  id: string;
  pattern: RegExp;
  weight: number;
  category: string;
  label: Record<Lang, string>;
  explanation: Record<Lang, string>;
}

const L = (es: string, pt: string, en: string): Record<Lang, string> => ({ es, pt, en });

const RULES: Rule[] = [
  {
    id: 'credential',
    pattern: /contrase[ñn]a|senha|password|passcode|clave de acceso|datos de acceso/i,
    weight: WEIGHTS.credential,
    category: 'credential_request',
    label: L('Solicitud de contraseña o credenciales', 'Pedido de senha ou credenciais', 'Password or credential request'),
    explanation: L(
      'Un mensaje legítimo de un banco o servicio nunca te pide la contraseña por chat, SMS o correo.',
      'Uma mensagem legítima de banco ou serviço nunca pede sua senha por chat, SMS ou e-mail.',
      'A legitimate bank or service never asks for your password via chat, SMS or email.',
    ),
  },
  {
    id: 'otp',
    pattern: /c[oó]digo de verifica|verification code|c[oó]digo de seguridad|security code|\botp\b|token de seguridad|code sent to you|c[oó]digo enviado/i,
    weight: WEIGHTS.otp,
    category: 'otp_request',
    label: L('Solicitud de código de verificación / OTP', 'Pedido de código de verificação / OTP', 'Verification code / OTP request'),
    explanation: L(
      'Los códigos de verificación son personales. Compartirlos permite a un tercero entrar a tu cuenta.',
      'Códigos de verificação são pessoais. Compartilhá-los permite que terceiros acessem sua conta.',
      'Verification codes are personal. Sharing them lets a third party into your account.',
    ),
  },
  {
    id: 'threat',
    pattern: /bloquead|blocked|bloqueio|suspensi[oó]n|cuenta cerrada|account closed|desactivad|deactivated|embargo|demanda judicial|orden judicial/i,
    weight: WEIGHTS.threat,
    category: 'threat',
    label: L('Amenaza de bloqueo o sanción', 'Ameaça de bloqueio ou sanção', 'Threat of blocking or sanction'),
    explanation: L(
      'Las amenazas de bloqueo buscan que actúes sin verificar. Las entidades reales notifican por canales oficiales.',
      'Ameaças de bloqueio pressionam você a agir sem verificar. Instituições reais notificam por canais oficiais.',
      'Blocking threats pressure you to act without verifying. Real institutions notify via official channels.',
    ),
  },
  {
    id: 'pressure',
    pattern: /no le digas a nadie|no se lo digas|mant[eé]n esto en secreto|keep this secret|don't tell anyone|no cuentes|não conte|confidencial|exclusivo para ti/i,
    weight: WEIGHTS.pressure,
    category: 'pressure',
    label: L('Presión para mantener el secreto', 'Pressão para manter segredo', 'Pressure to keep it secret'),
    explanation: L(
      'Pedirte secreto es una táctica para impedir que consultes con otra persona.',
      'Pedir segredo é uma tática para impedir que você consulte outra pessoa.',
      'Asking for secrecy is a tactic to stop you consulting someone else.',
    ),
  },
  {
    id: 'urgency',
    pattern: /urgente|urgent|inmediat|imediat|ahora mismo|right now|agora|últim[ao] aviso|last chance|última oportunidad|última chance|en 24 horas|within 24|expira|expires|vence hoy/i,
    weight: WEIGHTS.urgency,
    category: 'urgency',
    label: L('Urgencia artificial', 'Urgência artificial', 'Artificial urgency'),
    explanation: L(
      'La urgencia fabricada busca que no pienses ni verifiques antes de actuar.',
      'A urgência fabricada busca que você não pense nem verifique antes de agir.',
      'Manufactured urgency aims to stop you thinking or verifying before acting.',
    ),
  },
  {
    id: 'transfer',
    pattern: /transferencia|transferência|transferir|env[ií]a (el )?dinero|send (the )?money|haz (un )?pago|faça (um )?pagamento|paga ahora|pay now|dep[oó]sito|depósito/i,
    weight: WEIGHTS.transfer,
    category: 'transfer',
    label: L('Solicitud de transferencia o pago', 'Pedido de transferência ou pagamento', 'Transfer or payment request'),
    explanation: L(
      'Una solicitud de pago inesperada debe verificarse por un canal independiente antes de pagar.',
      'Um pedido de pagamento inesperado deve ser verificado por um canal independente antes de pagar.',
      'An unexpected payment request must be verified via an independent channel before paying.',
    ),
  },
  {
    id: 'prize',
    pattern: /premio|prêmio|ganaste|ganhou|loter[ií]a|lottery|prize|free money|dinero gratis|dinheiro grátis|felicitaciones|parabéns|congratulations|fuiste seleccionado|você foi selecionado|you have been selected/i,
    weight: WEIGHTS.prize,
    category: 'prize',
    label: L('Promesa de premio o beneficio', 'Promessa de prêmio ou benefício', 'Prize or benefit promise'),
    explanation: L(
      'Los premios no solicitados suelen ser anzuelos. Ningún premio legítimo exige pagar para cobrarse.',
      'Prêmios não solicitados costumam ser iscas. Nenhum prêmio legítimo exige pagar para receber.',
      'Unsolicited prizes are usually bait. No legitimate prize requires paying to claim it.',
    ),
  },
  {
    id: 'http',
    pattern: /http:\/\//i,
    weight: WEIGHTS.http,
    category: 'link',
    label: L('Enlace HTTP sin cifrado', 'Link HTTP sem criptografia', 'Unencrypted HTTP link'),
    explanation: L(
      'Los enlaces HTTP no cifran la conexión. Un sitio legítimo de banco o servicio usa HTTPS.',
      'Links HTTP não criptografam a conexão. Um site legítimo de banco ou serviço usa HTTPS.',
      'HTTP links do not encrypt the connection. A legitimate bank or service site uses HTTPS.',
    ),
  },
  {
    id: 'shortener',
    pattern: /bit\.ly|tinyurl\.com|t\.co\/|is\.gd|rb\.gy|cutt\.ly|tiny\.cc/i,
    weight: WEIGHTS.shortener,
    category: 'link',
    label: L('Enlace acortado que oculta el destino', 'Link encurtado que oculta o destino', 'Shortened link conceals destination'),
    explanation: L(
      'Un enlace acortado oculta a dónde vas. No lo abras sin verificar el destino por otro canal.',
      'Um link encurtado oculta para onde você vai. Não abra sem verificar o destino por outro canal.',
      'A shortened link hides where you are going. Do not open it without verifying the destination elsewhere.',
    ),
  },
  {
    id: 'suspiciousTld',
    pattern: /https?:\/\/[^\s/]+(?:\.xyz|\.top|\.click|\.buzz|\.icu|\.shop|\.online|\.site)(?:[/:\s]|$)/i,
    weight: WEIGHTS.suspiciousTld,
    category: 'link',
    label: L('Dominio que merece comprobación adicional', 'Domínio que merece verificação adicional', 'Domain warrants additional verification'),
    explanation: L(
      'Algunas extensiones son usadas con frecuencia en sitios fraudulentos. Por sí solas no prueban fraude.',
      'Algumas extensões são usadas com frequência em sites fraudulentos. Sozinhas não provam fraude.',
      'Some extensions are frequently used on fraudulent sites. Alone they do not prove fraud.',
    ),
  },
  {
    id: 'remoteAccess',
    pattern: /\b(?:anydesk|teamviewer|rustdesk|ammyy|supremo)\b/i,
    weight: WEIGHTS.remoteAccess,
    category: 'remote_access',
    label: L('Acceso remoto mencionado', 'Acesso remoto mencionado', 'Remote access mentioned'),
    explanation: L(
      'Pedirte instalar software de acceso remoto es una señal grave: permite controlar tu dispositivo.',
      'Pedir que instale software de acesso remoto é um sinal grave: permite controlar seu dispositivo.',
      'Asking you to install remote-access software is a serious sign: it lets someone control your device.',
    ),
  },
  {
    id: 'advanceFee',
    pattern: /taxa de libera|tasa de libera|advance fee|upfront fee|paga (una )?tasa|pay (a )?fee|gastos de gesti[oó]n|processing fee|pago anticipado|pagamento antecipado/i,
    weight: WEIGHTS.advanceFee,
    category: 'advance_fee',
    label: L('Posible pago anticipado', 'Possível pagamento antecipado', 'Possible advance fee'),
    explanation: L(
      'Cobrar una tasa por adelantado para liberar un premio, préstamo o trabajo es un patrón clásico de estafa.',
      'Cobrar uma taxa antecipada para liberar um prêmio, empréstimo ou trabalho é um padrão clássico de golpe.',
      'Charging an upfront fee to release a prize, loan or job is a classic scam pattern.',
    ),
  },
  {
    id: 'extortion',
    pattern: /sextors|chantaje|chantagem|blackmail|vazaremos|we will leak|publicaremos tus|expondremos/i,
    weight: WEIGHTS.extortion,
    category: 'extortion',
    label: L('Posible extorsión', 'Possível extorsão', 'Possible extortion'),
    explanation: L(
      'Las amenazas de publicar información a cambio de dinero son extorsión. No pagues y denunciá.',
      'Ameaças de publicar informações em troca de dinheiro são extorsão. Não pague e denuncie.',
      'Threats to publish information for money are extortion. Do not pay and report it.',
    ),
  },
  {
    id: 'bankData',
    pattern: /n[uú]mero de tarjeta|número do cartão|card number|datos bancarios|dados bancários|bank details|cuenta bancaria|conta bancária|bank account|cvv|cbu|iban/i,
    weight: WEIGHTS.bankData,
    category: 'bank_data',
    label: L('Solicitud de datos bancarios', 'Pedido de dados bancários', 'Bank data request'),
    explanation: L(
      'Nunca compartas datos completos de tarjeta o cuenta por chat, SMS o correo.',
      'Nunca compartilhe dados completos de cartão ou conta por chat, SMS ou e-mail.',
      'Never share full card or account details via chat, SMS or email.',
    ),
  },
  {
    id: 'investment',
    pattern: /inversi[oó]n garantizada|investimento garantido|guaranteed (return|profit)|ganancias garantizadas|lucro garantido|crypto duplic|duplica tu dinero|dobre seu dinheiro|double your money|rendimiento del \d+%/i,
    weight: WEIGHTS.investment,
    category: 'investment',
    label: L('Inversión con ganancias prometidas', 'Investimento com lucros prometidos', 'Investment with promised returns'),
    explanation: L(
      'Ninguna inversión legítima garantiza ganancias. Las promesas de rendimiento fijo alto son sospechosas.',
      'Nenhum investimento legítimo garante lucros. Promessas de rendimento alto e fixo são suspeitas.',
      'No legitimate investment guarantees returns. Promises of high fixed returns are suspicious.',
    ),
  },
  {
    id: 'jobScam',
    pattern: /oferta de empleo|oferta de trabalho|job offer|trabaja desde casa|trabalhe em casa|work from home|ingreso extra|ganá dinero desde|ganhe dinheiro|earn money from home|entrevista por whatsapp/i,
    weight: WEIGHTS.jobScam,
    category: 'job',
    label: L('Posible oferta laboral fraudulenta', 'Possível oferta de trabalho fraudulenta', 'Possible fraudulent job offer'),
    explanation: L(
      'Las ofertas que piden dinero, equipos o datos sensibles antes de contratar suelen ser falsas.',
      'Ofertas que pedem dinheiro, equipamentos ou dados sensíveis antes de contratar costumam ser falsas.',
      'Offers asking for money, equipment or sensitive data before hiring are usually fake.',
    ),
  },
  {
    id: 'impersonation',
    pattern: /soy (de|del) (banco|soporte|soporte técnico|atención)|sou do (banco|suporte)|this is (bank|support|technical)|habla (el|la) banco|aqui é do banco|official (notice|communication)|comunicado oficial/i,
    weight: WEIGHTS.impersonation,
    category: 'impersonation',
    label: L('Posible suplantación de identidad', 'Possível falsificação de identidade', 'Possible impersonation'),
    explanation: L(
      'Quien te escribe puede fingir ser tu banco o un servicio. Verificá por el canal oficial independiente.',
      'Quem escreve pode fingir ser seu banco ou um serviço. Verifique pelo canal oficial independente.',
      'Whoever writes to you may pretend to be your bank or a service. Verify via the independent official channel.',
    ),
  },
  {
    id: 'pix',
    pattern: /\bpix\b|clave pix|chave pix/i,
    weight: WEIGHTS.pix,
    category: 'pix',
    label: L('Mención de Pix: verificá el destinatario', 'Menção a Pix: verifique o destinatário', 'Pix mentioned: verify the recipient'),
    explanation: L(
      'Mencionar Pix por sí solo no es fraude, pero los pagos Pix son difíciles de revertir. Confirmá el destinatario.',
      'Mencionar Pix sozinho não é fraude, mas pagamentos Pix são difíceis de reverter. Confirme o destinatário.',
      'Mentioning Pix alone is not fraud, but Pix payments are hard to reverse. Confirm the recipient.',
    ),
  },
  {
    id: 'qr',
    pattern: /c[oó]digo qr|qr code|c[oó]digo de barras|escane[aá] (el )?c[oó]digo|scan (the )?code/i,
    weight: WEIGHTS.qr,
    category: 'qr',
    label: L('Mención de código QR', 'Menção a código QR', 'QR code mentioned'),
    explanation: L(
      'Un QR puede ocultar un enlace o un pago. Analizá su contenido antes de escanearlo o pagar.',
      'Um QR pode ocultar um link ou pagamento. Analise seu conteúdo antes de escanear ou pagar.',
      'A QR code can hide a link or a payment. Analyze its content before scanning or paying.',
    ),
  },
];

const KNOWN_BRANDS = [
  'banco', 'itau', 'santander', 'bradesco', 'nubank', 'bb', 'brasil', 'mercadolibre',
  'correios', 'receita', 'gov', 'gob', 'irs', 'paypal', 'amazon', 'apple', 'microsoft',
  'facebook', 'instagram', 'whatsapp', 'netflix', 'spotify', 'santander', 'hsbc',
  'bbva', 'santander', 'caixa', 'inter', 'c6bank', 'pagbank', 'picpay', 'mercadopago',
];

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[m][n];
}

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"')\]]+/gi) || [];
  return matches.map((u) => u.replace(/[.,;:!?]+$/, '')).slice(0, 30);
}

function analyzeUrls(text: string): UrlFinding[] {
  const findings: UrlFinding[] = [];
  for (const raw of extractUrls(text)) {
    const issues: string[] = [];
    let host = '';
    try {
      const u = new URL(raw);
      host = u.hostname.toLowerCase();
      if (u.username || u.password) issues.push('userinfo');
      if (host.includes('xn--')) issues.push('idn');
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[')) issues.push('ip');
      if (u.protocol === 'http:') issues.push('http');
      if (/bit\.ly|tinyurl|t\.co|is\.gd|rb\.gy|cutt\.ly/.test(host)) issues.push('shortener');
      if (/\.(xyz|top|click|buzz|icu|shop|online|site)$/.test(host)) issues.push('tld');
      if (host.split('.').length > 4) issues.push('deep-subdomain');
      // Dominio parecido a una marca conocida (typosquatting)
      const base = host.replace(/^www\./, '').split('.')[0];
      for (const brand of KNOWN_BRANDS) {
        if (base === brand) continue;
        if (base.includes(brand) && base !== brand) { issues.push('lookalike'); break; }
        if (brand.length >= 4 && levenshtein(base, brand) === 1 && base.length >= 4) { issues.push('lookalike'); break; }
      }
      // Caracteres confusos (homoglifos latinos/cirilicos)
      if (/[а-яА-Я]/.test(host)) issues.push('confusable');
    } catch {
      issues.push('malformed');
    }
    if (issues.length) findings.push({ url: raw, host, issues });
  }
  return findings;
}

export function analyzeText(input: string, type: AnalysisType = 'message'): AnalysisResult {
  const text = String(input ?? '').slice(0, 20000);
  const trimmed = text.trim();
  const charCount = trimmed.length;
  const insufficient = charCount < 3;

  const signals: Signal[] = [];
  if (!insufficient) {
    for (const rule of RULES) {
      if (rule.pattern.test(text)) {
        signals.push({ id: rule.id, weight: rule.weight, category: rule.category, label: rule.label, explanation: rule.explanation });
      }
    }
  }

  const urls = insufficient ? [] : analyzeUrls(text);
  // Señales derivadas de URL (máx. 2 para no inflar)
  const urlSignalDefs: Array<{ test: (f: UrlFinding) => boolean; id: string; weight: number; category: string; label: Record<Lang, string>; explanation: Record<Lang, string> }> = [
    {
      test: (f) => f.issues.includes('userinfo') || f.issues.includes('ip') || f.issues.includes('malformed'),
      id: 'url_anomaly',
      weight: WEIGHTS.urlAnomaly,
      category: 'link',
      label: L('Dirección web inusual u ocultación del destino', 'Endereço incomum ou destino oculto', 'Unusual or concealed web address'),
      explanation: L(
        'La URL usa credenciales incrustadas, una IP como dominio o está malformada: oculta el destino real.',
        'A URL usa credenciais embutidas, um IP como domínio ou está malformada: oculta o destino real.',
        'The URL embeds credentials, uses an IP as host, or is malformed: it conceals the real destination.',
      ),
    },
    {
      test: (f) => f.issues.includes('lookalike'),
      id: 'lookalike',
      weight: WEIGHTS.lookalike,
      category: 'impersonation',
      label: L('Dominio similar a una entidad conocida', 'Domínio parecido a uma entidade conhecida', 'Domain similar to a known entity'),
      explanation: L(
        'El dominio se parece a una marca o entidad conocida pero no es el oficial. Es una técnica habitual de phishing.',
        'O domínio se parece a uma marca ou entidade conhecida, mas não é o oficial. É uma técnica comum de phishing.',
        'The domain resembles a known brand or entity but is not the official one. A common phishing technique.',
      ),
    },
    {
      test: (f) => f.issues.includes('idn') || f.issues.includes('confusable'),
      id: 'idn',
      weight: WEIGHTS.idn,
      category: 'link',
      label: L('Dominio internacionalizado o caracteres confusos', 'Domínio internacionalizado ou caracteres confusos', 'Internationalized domain or confusable characters'),
      explanation: L(
        'El dominio usa caracteres internacionales o de otro alfabeto que pueden imitar letras latinas.',
        'O domínio usa caracteres internacionais ou de outro alfabeto que podem imitar letras latinas.',
        'The domain uses international or other-alphabet characters that can mimic Latin letters.',
      ),
    },
  ];
  for (const def of urlSignalDefs) {
    if (urls.some(def.test) && !signals.some((s) => s.id === def.id)) {
      signals.push({ id: def.id, weight: def.weight, category: def.category, label: def.label, explanation: def.explanation });
    }
  }

  const rawScore = signals.reduce((acc, s) => acc + s.weight, 0);
  const score = Math.min(100, rawScore * 12);
  const level: RiskLevel = rawScore >= 5 ? 2 : rawScore >= 2 ? 1 : 0;

  // Categoría de posible estafa: la de la señal de mayor peso
  const top = [...signals].sort((a, b) => b.weight - a.weight)[0];
  const category = top ? top.category : null;

  const recommendations = buildRecommendations(signals, urls);

  return {
    score,
    level,
    insufficient,
    signals,
    category,
    recommendations,
    urls,
    isPix: signals.some((s) => s.id === 'pix'),
    charCount,
  };
}

function buildRecommendations(signals: Signal[], urls: UrlFinding[]): string[] {
  const recs: string[] = [];
  const has = (id: string) => signals.some((s) => s.id === id);
  if (has('credential') || has('otp') || has('bankData')) {
    recs.push('credential');
  }
  if (has('remoteAccess')) recs.push('remote');
  if (has('transfer') || has('pix') || has('advanceFee')) recs.push('payment');
  if (urls.length) recs.push('link');
  if (has('threat') || has('urgency') || has('pressure')) recs.push('pause');
  if (has('extortion')) recs.push('extortion');
  if (has('prize') || has('investment') || has('jobScam')) recs.push('money');
  if (!recs.length) recs.push('general');
  return recs;
}

export const RECOMMENDATION_TEXT: Record<string, Record<Lang, string>> = {
  credential: L(
    'No compartas contraseñas, códigos de verificación ni datos bancarios. Si ya lo hiciste, cambiá tus claves desde la app oficial y activá la verificación en dos pasos.',
    'Não compartilhe senhas, códigos de verificação nem dados bancários. Se já compartilhou, altere suas senhas pelo app oficial e ative a verificação em duas etapas.',
    'Never share passwords, verification codes or bank details. If you already did, change your passwords in the official app and enable two-factor authentication.',
  ),
  remote: L(
    'No instales software de acceso remoto por pedido de un desconocido. Desinstalá cualquier app instalada recientemente y revisá tu dispositivo.',
    'Não instale software de acesso remoto a pedido de desconhecidos. Desinstale qualquer app instalado recentemente e revise seu dispositivo.',
    'Do not install remote-access software at a stranger\u2019s request. Uninstall any recently installed app and check your device.',
  ),
  payment: L(
    'No pagues ni transfieras hasta confirmar el destinatario por un canal oficial independiente (número oficial, app oficial o sucursal). Los pagos Pix y transferencias son difíciles de revertir.',
    'Não pague nem transfira até confirmar o destinatário por um canal oficial independente (número oficial, app oficial ou agência). Pagamentos Pix e transferências são difíceis de reverter.',
    'Do not pay or transfer until you confirm the recipient via an independent official channel (official number, official app or branch). Pix and bank transfers are hard to reverse.',
  ),
  link: L(
    'No abras el enlace desde este mensaje. Escribí la dirección oficial a mano o abrí la app oficial y buscá la notificación allí.',
    'Não abra o link desta mensagem. Digite o endereço oficial manualmente ou abra o app oficial e procure a notificação lá.',
    'Do not open the link from this message. Type the official address manually or open the official app and look for the notice there.',
  ),
  pause: L(
    'Hacé una pausa: la urgencia es una táctica de estafa. Consultá con alguien de confianza antes de actuar.',
    'Faça uma pausa: a urgência é uma tática de golpe. Consulte alguém de confiança antes de agir.',
    'Pause: urgency is a scam tactic. Consult someone you trust before acting.',
  ),
  extortion: L(
    'No pagues ni respondas a amenazas de extorsión. Guardá las pruebas y denunciá ante la policía o tu banco.',
    'Não pague nem responda a ameaças de extorsão. Guarde as provas e denuncie à polícia ou ao seu banco.',
    'Do not pay or reply to extortion threats. Keep evidence and report to the police or your bank.',
  ),
  money: L(
    'Desconfiá de premios, inversiones o empleos que exigen pagar por adelantado o prometen ganancias garantizadas.',
    'Desconfie de prêmios, investimentos ou empregos que exigem pagar adiantado ou prometem lucros garantidos.',
    'Distrust prizes, investments or jobs that require upfront payment or promise guaranteed returns.',
  ),
  general: L(
    'Verificá la solicitud por un canal oficial independiente antes de actuar. Si no estás seguro, no actúes.',
    'Verifique o pedido por um canal oficial independente antes de agir. Se não tiver certeza, não aja.',
    'Verify the request via an independent official channel before acting. If unsure, do not act.',
  ),
};

export const CATEGORY_LABEL: Record<string, Record<Lang, string>> = {
  credential_request: L('Posible robo de credenciales', 'Possível roubo de credenciais', 'Possible credential theft'),
  otp_request: L('Posible robo de códigos de verificación', 'Possível roubo de códigos de verificação', 'Possible verification-code theft'),
  threat: L('Posible intimidación / falso bloqueo', 'Possível intimidação / falso bloqueio', 'Possible intimidation / fake blocking'),
  pressure: L('Posible manipulación psicológica', 'Possível manipulação psicológica', 'Possible psychological manipulation'),
  urgency: L('Posible estafa por urgencia', 'Possível golpe por urgência', 'Possible urgency scam'),
  transfer: L('Posible fraude de transferencia', 'Possível fraude de transferência', 'Possible transfer fraud'),
  prize: L('Posible falso premio', 'Possível falso prêmio', 'Possible fake prize'),
  link: L('Posible enlace fraudulento / phishing', 'Possível link fraudulento / phishing', 'Possible fraudulent link / phishing'),
  remote_access: L('Posible fraude de acceso remoto', 'Possível fraude de acesso remoto', 'Possible remote-access fraud'),
  advance_fee: L('Posible estafa de pago anticipado', 'Possível golpe de pagamento antecipado', 'Possible advance-fee scam'),
  extortion: L('Posible extorsión', 'Possível extorsão', 'Possible extortion'),
  bank_data: L('Posible robo de datos bancarios', 'Possível roubo de dados bancários', 'Possible bank-data theft'),
  investment: L('Posible estafa de inversión', 'Possível golpe de investimento', 'Possible investment scam'),
  job: L('Posible estafa laboral', 'Possível golpe trabalhista', 'Possible job scam'),
  impersonation: L('Posible suplantación de identidad', 'Possível falsificação de identidade', 'Possible impersonation'),
  pix: L('Pago Pix por verificar', 'Pagamento Pix a verificar', 'Pix payment to verify'),
  qr: L('Código QR por verificar', 'Código QR a verificar', 'QR code to verify'),
};
