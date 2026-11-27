import type { Lang } from '../engine';

interface Bulletin {
  id: string;
  region: 'BR' | 'AR';
  published: string;
  agency: string;
  url: string;
  title: Record<Lang, string>;
  body: Record<Lang, string>;
}

// Reviewed original publications. No account, network fetch, or device location needed.
export const bulletins: Bulletin[] = [
  {
    id: 'br-cisc-2026-02-13', region: 'BR', published: '2026-02-13', agency: 'Governo Federal',
    url: 'https://www.gov.br/cisc/pt-br/alertas-de-golpes-digitais/golpistas-enviam-mensagens-no-whatsapp-se-passando-por-entidades-do-governo',
    title: { es: 'Falsas cobranzas oficiales por WhatsApp', pt: 'Falsas cobranças oficiais pelo WhatsApp', en: 'Fake government payment demands on WhatsApp' },
    body: {
      es: 'Estafadores usan datos personales y logos oficiales para exigir pagos por Pix o boleto. Verificá la deuda por un canal oficial que abras vos.',
      pt: 'Golpistas usam dados pessoais e marcas oficiais para cobrar via Pix ou boleto. Confira a dívida em um canal oficial acessado por você.',
      en: 'Scammers use personal details and government logos to demand Pix or boleto payments. Check the debt through an official channel you open yourself.',
    },
  },
  {
    id: 'ar-ufeci-2025-02-07', region: 'AR', published: '2025-02-07', agency: 'UFECI',
    url: 'https://www.fiscales.gob.ar/ciberdelincuencia/alertan-por-llamadas-de-whatsapp-fraudulentas-que-aparentan-provenir-de-agentes-del-pami/',
    title: { es: 'Llamadas de personas que se hacen pasar por PAMI', pt: 'Ligações de falsos agentes do PAMI', en: 'Callers posing as PAMI staff' },
    body: {
      es: 'Ofrecen descuentos en medicamentos y piden fotos del DNI, del carnet o del rostro. Cortá la llamada y consultá directamente a PAMI.',
      pt: 'Oferecem descontos em remédios e pedem fotos do documento, da carteirinha ou do rosto. Encerre a ligação e consulte o PAMI diretamente.',
      en: 'Callers promise medicine discounts and request photos of IDs, membership cards or faces. End the call and contact PAMI independently.',
    },
  },
];

// Additions create a new edition without depending on a user’s device clock.
export const bulletinEdition = bulletins.map(b => b.id).join('|');
