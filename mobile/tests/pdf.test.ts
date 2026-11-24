import { exportPdf } from '../src/pdf';
import { analyzeText } from '../src/engine';
const deps = { print:jest.fn(async(_html:string)=>({uri:'file:///cache/report.pdf'})), isAvailable:jest.fn(async()=>true), share:jest.fn(async(_uri:string)=>{}) };
beforeEach(()=>jest.clearAllMocks());
test('renders a local PDF and shares only the generated file',async()=>{
 await exportPdf(analyzeText('urgent password'),'en',deps);
 expect(deps.print).toHaveBeenCalledWith(expect.stringContaining('Heuristic score'));
 expect(deps.share).toHaveBeenCalledWith('file:///cache/report.pdf');
});
test('reports unavailable sharing before generating a file',async()=>{
 deps.isAvailable.mockResolvedValueOnce(false);
 await expect(exportPdf(analyzeText('hola'),'es',deps)).rejects.toThrow('sharing-unavailable');
 expect(deps.print).not.toHaveBeenCalled();
});
test('propagates print failures and does not share',async()=>{
 deps.print.mockRejectedValueOnce(new Error('print failed'));
 await expect(exportPdf(analyzeText('hola'),'es',deps)).rejects.toThrow('print failed');
 expect(deps.share).not.toHaveBeenCalled();
});
