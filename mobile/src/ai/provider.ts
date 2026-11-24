import { analyzeText, type AnalysisResult, type AnalysisType } from '../engine';

/**
 * Interfaz modular de proveedores de IA.
 * El MVP funciona 100% offline con el motor heurístico local.
 * Un proveedor remoto solo podrá activarse con: integración real,
 * proveedor gratuito, credenciales protegidas en backend y
 * consentimiento explícito del usuario. Nunca claves en la app.
 */
export interface AIProvider {
  readonly name: string;
  readonly isRemote: boolean;
  analyze(text: string, type?: AnalysisType): Promise<AnalysisResult>;
}

export class LocalHeuristicProvider implements AIProvider {
  readonly name = 'local-heuristic';
  readonly isRemote = false;
  async analyze(text: string, type: AnalysisType = 'message'): Promise<AnalysisResult> {
    return analyzeText(text, type);
  }
}

export class RemoteAIProvider implements AIProvider {
  readonly name = 'remote-not-configured';
  readonly isRemote = true;
  async analyze(): Promise<AnalysisResult> {
    throw new Error(
      'Remote AI is not configured. It requires a real integration, a free provider, ' +
        'backend-protected credentials and explicit user consent. The local engine is used instead.',
    );
  }
}

export const activeProvider: AIProvider = new LocalHeuristicProvider();
