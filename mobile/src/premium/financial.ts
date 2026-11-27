import type { Lang, Signal } from '../engine';

const label = (es: string, pt: string, en: string): Record<Lang, string> => ({ es, pt, en });
const bank = 'https://www.bcb.gov.br/meubc/faqs/s/golpes';
const loan = 'https://www.bcb.gov.br/detalhenoticia/15352/nota';
const ftc = 'https://consumer.ftc.gov/consumer-alerts/2023/08/did-someone-insist-you-pay-them-cryptocurrency';
const advance = /anticipad|antecipad|por adelantado|upfront|processing fee|taxa de libera|tasa de libera/;
const transfer = /pix|transfer|send money|enviame dinero|manda dinheiro|deposit|cripto|crypto/;

interface Pattern {
  id: string;
  context: RegExp;
  request: RegExp;
  label: Record<Lang, string>;
  explanation: Record<Lang, string>;
  source: string;
}

const patterns: Pattern[] = [
  { id: 'receipt', context: /comprovante|comprobante|payment receipt|proof of payment|transferencia programada|pix agendado/,
    request: /entreg|despach|envia el producto|refund|devolv|devolu|ship|release the item/,
    label: label('Entrega o devolución basada en un comprobante', 'Entrega ou devolução com base em comprovante', 'Shipment or refund based on a receipt'),
    explanation: label('Se menciona un comprobante y se pide entregar o devolver algo. Revisá el crédito en tu propia cuenta.', 'A mensagem cita um comprovante e pede entrega ou devolução. Confira o crédito no seu próprio extrato.', 'The message mentions a receipt and requests shipment or a refund. Check the credit in your own account.'), source: bank },
  { id: 'loan', context: /emprestimo|prestamo|\bloan\b/, request: advance,
    label: label('Pago previo para obtener crédito', 'Pagamento prévio para obter crédito', 'Advance payment for a loan'),
    explanation: label('El crédito aparece condicionado a un pago previo. Consultá a la entidad por su canal oficial antes de pagar.', 'O crédito aparece condicionado a um pagamento prévio. Consulte a instituição pelo canal oficial antes de pagar.', 'Credit appears conditional on an upfront payment. Contact the lender independently before paying.'), source: loan },
  { id: 'boleto', context: /boleto|factura|invoice/, request: /novo beneficiario|nuevo beneficiario|new payee|changed bank details|mudou a conta|cambio de cuenta|segunda via.*whatsapp/,
    label: label('Cambio de beneficiario de una factura', 'Mudança de beneficiário de uma cobrança', 'Changed payee on a bill'),
    explanation: label('La solicitud cambia los datos de cobro. Confirmá beneficiario e importe con el emisor por separado.', 'O pedido altera os dados de cobrança. Confirme o beneficiário e o valor diretamente com o emissor.', 'The request changes billing details. Confirm the payee and amount independently with the issuer.'), source: bank },
  { id: 'investment', context: /inversi[oó]n|invest|criptomoneda|criptomoeda|crypto|bitcoin|usdt/,
    request: /garantizad|garantid|guaranteed|double your|duplica|dobre seu|sin riesgo|sem risco|risk.free/,
    label: label('Oferta de inversión con promesa de rendimiento', 'Investimento com promessa de rendimento', 'Investment with promised returns'),
    explanation: label('La oferta combina inversión y certeza de ganancia. Verificá la entidad antes de enviar fondos.', 'A oferta combina investimento e certeza de ganho. Verifique a instituição antes de enviar recursos.', 'The offer combines investing and certainty of profit. Verify the provider before sending funds.'), source: ftc },
  { id: 'recruit', context: /reclut|recrut|recruit|refera amigos|indique amigos|invita amigos|invite friends/,
    request: /comision|comissao|commission|bonus|rendimiento|lucro|ganancia/,
    label: label('Ingresos vinculados al reclutamiento', 'Renda vinculada ao recrutamento', 'Earnings tied to recruitment'),
    explanation: label('Se ofrecen ingresos por incorporar personas. Revisá si los pagos dependen de nuevas inscripciones.', 'Há promessa de renda por trazer pessoas. Confira se os pagamentos dependem de novas adesões.', 'The offer links earnings to bringing people in. Check whether payouts depend on new enrolments.'), source: 'https://consumer.ftc.gov/articles/multi-level-marketing-businesses-pyramid-schemes' },
  { id: 'market', context: /marketplace|mercado livre|mercado libre|vendedor|seller|comprador|buyer/,
    request: /fuera de la plataforma|fora da plataforma|outside the platform|off.platform|pagar por fuera|pagar por fora/,
    label: label('Pedido de pago fuera del marketplace', 'Pedido de pagamento fora do marketplace', 'Off-platform marketplace payment'),
    explanation: label('La operación se desplaza fuera de la plataforma. Comprobá el pedido dentro de tu cuenta.', 'A operação é desviada para fora da plataforma. Confira o pedido na sua conta.', 'The transaction is being moved off-platform. Check the order inside your account.'), source: 'https://consumer.ftc.gov/articles/buying-online-marketplace' },
  { id: 'romance', context: /mi amor|meu amor|my love|sweetheart|dating|novio|namorad/,
    request: transfer, label: label('Pedido financiero en un vínculo afectivo', 'Pedido financeiro em vínculo afetivo', 'Financial request in a romantic context'),
    explanation: label('El lenguaje afectivo aparece junto a una solicitud financiera. Confirmá la identidad por un canal independiente.', 'A linguagem afetiva aparece com um pedido financeiro. Confirme a identidade por outro canal.', 'Romantic language appears alongside financial terms. Verify the person independently before sending money.'), source: ftc },
  { id: 'job', context: /empleo|emprego|trabajo|trabalho|\bjob\b|vacante|vaga|hiring|task/,
    request: advance, label: label('Cobro anticipado para trabajar', 'Cobrança antecipada para trabalhar', 'Upfront payment for work'),
    explanation: label('La oferta laboral menciona un pago inicial. Verificá al empleador antes de entregar dinero.', 'A oferta de trabalho menciona um pagamento inicial. Verifique o empregador antes de entregar dinheiro.', 'The job offer mentions an advance payment. Verify the employer before giving them money.'), source: ftc },
];

export interface FinancialSignal extends Signal { source: string }

export function financialSignals(input: string): FinancialSignal[] {
  const text = input.slice(0, 20000).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return patterns.filter(p => p.context.test(text) && p.request.test(text)).map(p => ({
    id: 'financial_' + p.id, category: 'financial_' + p.id, weight: 2,
    label: p.label, explanation: p.explanation, source: p.source,
  }));
}
