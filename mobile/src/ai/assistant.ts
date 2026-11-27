import { analyzeText, RECOMMENDATION_TEXT, type Lang } from '../engine';

const labels = {
  authority: ['Invoca una autoridad para evitar que cuestiones el pedido.', 'Invoca autoridade para evitar que você questione o pedido.', 'Invokes authority to discourage you from questioning the request.'],
  secrecy: ['Te pide mantener el secreto, lo que dificulta consultar a alguien de confianza.', 'Pede sigilo, dificultando uma segunda opinião.', 'Asks for secrecy, making it harder to seek a second opinion.'],
  urgency: ['La presión de tiempo reduce tu oportunidad de verificar.', 'A pressão de tempo reduz a oportunidade de verificar.', 'Time pressure reduces your opportunity to verify.'],
  payment: ['Hay un pedido relacionado con dinero. Verificá el movimiento en tu propia cuenta.', 'Há um pedido envolvendo dinheiro. Confira a movimentação na sua conta.', 'There is a money request. Check your own account records.'],
  credential: ['Podrían estar intentando acceder a tu cuenta. Mantené tus códigos en privado.', 'Pode haver tentativa de acessar sua conta. Mantenha seus códigos em segredo.', 'Someone may be trying to access your account. Keep your codes private.'],
  impersonation: ['Podrían estar haciéndose pasar por alguien conocido. Confirmá por otro canal.', 'Alguém pode estar se passando por um conhecido. Confirme por outro canal.', 'Someone may be impersonating a trusted contact. Confirm independently.'],
  reward: ['La promesa de un beneficio puede usarse para presionarte a pagar o entregar datos.', 'Uma vantagem prometida pode pressionar você a pagar ou entregar dados.', 'A promised reward may pressure you to pay or disclose information.'],
  unknown: ['Verificá la situación por otra vía.', 'Confirme a situação por outra via.', 'Verify the situation independently.'],
} as const;

export const countrySources = {
  BR: 'https://www.bcb.gov.br/meubc/faqs/p/vitima-fez-um-pix-e-caiu-em-um-golpe',
  AR: 'https://www.argentina.gob.ar/servicio/denunciar-un-delito-informatico',
};

const noEvidence = ['No encontré señales concretas. Esto no confirma que sea seguro.', 'Não encontrei sinais concretos. Isso não confirma que seja seguro.', 'I found no specific signals. This does not confirm safety.'];

export function translate(values: readonly string[], lang: Lang) {
  return values[{ es: 0, pt: 1, en: 2 }[lang]];
}

export function localReply(text: string, lang: Lang) {
  const result = analyzeText(text);
  const context = result.signals.slice(0, 2).map(s => s.explanation[lang]);
  const advice = result.recommendations.slice(0, 2).map(r => RECOMMENDATION_TEXT[r][lang]);
  return [...(context.length ? context : [translate(noEvidence, lang)]), ...advice].join('\n\n');
}

export function modelReply(input: unknown, original: string, lang: Lang) {
  const payload = input as { signals?: { tactic: string; quote: string }[] } | null;
  if (!Array.isArray(payload?.signals) || payload.signals.length > 4) throw new Error('invalid-response');
  if (!payload.signals.length) return translate(noEvidence, lang);
  return payload.signals.map(signal => {
    if (!Object.hasOwn(labels, signal.tactic) || typeof signal.quote !== 'string' ||
        !signal.quote.trim() || signal.quote.length > 160 || !original.includes(signal.quote)) throw new Error('invalid-response');
    return '“' + signal.quote + '”\n' + translate(labels[signal.tactic as keyof typeof labels], lang);
  }).join('\n\n');
}
