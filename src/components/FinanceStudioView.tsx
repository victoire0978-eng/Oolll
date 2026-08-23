import React, { useState } from 'react';
import {
  calculateSIG,
  calculateBalanceSheet,
  calculateInvestmentNPVIRR,
  SAMPLE_STRATEGIC_MATRICES,
} from '../utils/financeStudio';
import {
  TrendingUp,
  PieChart,
  BarChart3,
  DollarSign,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const FinanceStudioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bilan' | 'sig' | 'van_tri' | 'strategic'>('bilan');
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // 1. Balance Sheet State
  const [ressourcesStables, setRessourcesStables] = useState<number>(450000);
  const [emploisStables, setEmploisStables] = useState<number>(320000);
  const [actifCirculant, setActifCirculant] = useState<number>(180000);
  const [passifCirculant, setPassifCirculant] = useState<number>(120000);
  const [capitauxPropres, setCapitauxPropres] = useState<number>(300000);
  const [dettesFinancieres, setDettesFinancieres] = useState<number>(150000);

  // 2. SIG State
  const [caVentes, setCaVentes] = useState<number>(500000);
  const [coutAchat, setCoutAchat] = useState<number>(200000);
  const [productionVendue, setProductionVendue] = useState<number>(300000);
  const [consommationsTiers, setConsommationsTiers] = useState<number>(150000);
  const [chargesPersonnel, setChargesPersonnel] = useState<number>(220000);
  const [dotationsAmort, setDotationsAmort] = useState<number>(45000);

  // 3. Investment State
  const [investissementInitial, setInvestissementInitial] = useState<number>(100000);
  const [tauxActualisation, setTauxActualisation] = useState<number>(8);
  const [cf1, setCf1] = useState<number>(30000);
  const [cf2, setCf2] = useState<number>(35000);
  const [cf3, setCf3] = useState<number>(40000);
  const [cf4, setCf4] = useState<number>(35000);

  // Calculations
  const balanceSheetRes = calculateBalanceSheet({
    ressourcesStables,
    emploisStables,
    actifCirculantExploitation: actifCirculant,
    passifCirculantExploitation: passifCirculant,
    capitauxPropres,
    dettesFinancieresTotales: dettesFinancieres,
  });

  const sigRes = calculateSIG({
    caVentesMarchandises: caVentes,
    coutAchatMarchandisesVendues: coutAchat,
    productionVendueBiensServices: productionVendue,
    consommationsProvenanceTiers: consommationsTiers,
    chargesPersonnel,
    dotationsAmortissementsProvisions: dotationsAmort,
  });

  const investmentRes = calculateInvestmentNPVIRR({
    investissementInitial,
    tauxActualisation: tauxActualisation / 100,
    fluxTresorerieAnnuels: [cf1, cf2, cf3, cf4],
  });

  const currentMatrix = SAMPLE_STRATEGIC_MATRICES[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 backdrop-blur-md">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Studio d'Analyse Économique, Financière & Stratégique
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Gestion & Finance
                </span>
              </h2>
              <p className="text-xs text-white/60">
                Calculs financiers normés (FRNG, BFR, Trésorerie, SIG, VAN/TRI) et matrices stratégiques (SWOT, PESTEL, Porter).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(`FRNG: ${balanceSheetRes.frng}€, BFR: ${balanceSheetRes.bfr}€, TN: ${balanceSheetRes.tresorerieNette}€`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-all"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('bilan')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'bilan'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Bilan Fonctionnel (FRNG / BFR / TN)</span>
        </button>
        <button
          onClick={() => setActiveTab('sig')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'sig'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Soldes de Gestion (SIG / EBE / VA)</span>
        </button>
        <button
          onClick={() => setActiveTab('van_tri')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'van_tri'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Rentabilité Investissement (VAN / TRI)</span>
        </button>
        <button
          onClick={() => setActiveTab('strategic')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'strategic'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Matrices Stratégiques (SWOT/PESTEL/Porter)</span>
        </button>
      </div>

      {/* 1. BILAN FONCTIONNEL */}
      {activeTab === 'bilan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
              <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Agrégats du Bilan Fonctionnel
              </h3>

              <div className="space-y-2">
                <div>
                  <label className="text-white/70">Ressources Stables (Capitaux + Dettes LT) :</label>
                  <input
                    type="number"
                    value={ressourcesStables}
                    onChange={(e) => setRessourcesStables(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-white/70">Emplois Stables (Actif Immobilisé Brut) :</label>
                  <input
                    type="number"
                    value={emploisStables}
                    onChange={(e) => setEmploisStables(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-white/70">Actif Circulant (Stocks + Créances) :</label>
                  <input
                    type="number"
                    value={actifCirculant}
                    onChange={(e) => setActifCirculant(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-white/70">Passif Circulant (Dettes Fournisseurs/Fiscales) :</label>
                  <input
                    type="number"
                    value={passifCirculant}
                    onChange={(e) => setPassifCirculant(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/50">FRNG</span>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {balanceSheetRes.frng.toLocaleString()} €
                </div>
                <p className="text-[11px] text-white/50">Ressources Stables - Emplois Stables</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/50">BFR</span>
                <div className="text-lg font-bold font-mono text-amber-400">
                  {balanceSheetRes.bfr.toLocaleString()} €
                </div>
                <p className="text-[11px] text-white/50">Actif Circulant - Passif Circulant</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/50">Trésorerie Nette</span>
                <div className={`text-lg font-bold font-mono ${balanceSheetRes.tresorerieNette >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {balanceSheetRes.tresorerieNette.toLocaleString()} €
                </div>
                <p className="text-[11px] text-white/50">TN = FRNG - BFR</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Diagnostic & Interprétation Financière
              </h4>
              <div className="space-y-2 text-xs">
                {balanceSheetRes.interpretation.map((interp, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-white/90">
                    {interp}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SOLDES INTERMÉDIAIRES DE GESTION (SIG) */}
      {activeTab === 'sig' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
              <h3 className="font-bold text-white uppercase tracking-wider">Données du Compte de Résultat</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-white/70">CA Ventes de marchandises :</label>
                  <input
                    type="number"
                    value={caVentes}
                    onChange={(e) => setCaVentes(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-white/70">Coût d'achat marchandises vendues :</label>
                  <input
                    type="number"
                    value={coutAchat}
                    onChange={(e) => setCoutAchat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-white/70">Production vendue (services/biens) :</label>
                  <input
                    type="number"
                    value={productionVendue}
                    onChange={(e) => setProductionVendue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-white/70">Consommations de tiers :</label>
                  <input
                    type="number"
                    value={consommationsTiers}
                    onChange={(e) => setConsommationsTiers(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-white/70">Charges de personnel (Salaires & charges) :</label>
                  <input
                    type="number"
                    value={chargesPersonnel}
                    onChange={(e) => setChargesPersonnel(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <h3 className="font-bold text-emerald-300 uppercase tracking-wider">Cascade des Soldes (SIG)</h3>
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between p-2 rounded-lg bg-black/20 text-white">
                  <span>1. Marge Commerciale :</span>
                  <span className="font-bold text-emerald-400">{sigRes.margeCommerciale.toLocaleString()} €</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-black/20 text-white">
                  <span>2. Valeur Ajoutée (VA) :</span>
                  <span className="font-bold text-emerald-400">{sigRes.valeurAjoutee.toLocaleString()} €</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-black/40 text-emerald-300 border border-emerald-500/20">
                  <span className="font-bold">3. Excédent Brut d'Exploitation (EBE) :</span>
                  <span className="font-bold">{sigRes.excedentBrutExploitation.toLocaleString()} €</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-black/20 text-white">
                  <span>4. Résultat d'Exploitation (REX) :</span>
                  <span className="font-bold text-cyan-400">{sigRes.resultatExploitation.toLocaleString()} €</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-black/40 text-white border border-white/10">
                  <span className="font-bold">5. Résultat Net de l'Exercice :</span>
                  <span className="font-bold text-emerald-400">{sigRes.resultatNet.toLocaleString()} €</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                  <span className="font-bold">6. Capacité d'Autofinancement (CAF) :</span>
                  <span className="font-bold">{sigRes.capaciteAutofinancement.toLocaleString()} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RENTABILITÉ D'INVESTISSEMENT (VAN / TRI) */}
      {activeTab === 'van_tri' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
              <h3 className="font-bold text-white uppercase tracking-wider">Paramètres du Projet</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-white/70">Investissement Initial (I0) :</label>
                  <input
                    type="number"
                    value={investissementInitial}
                    onChange={(e) => setInvestissementInitial(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-white/70">Taux d'actualisation (%) :</label>
                  <input
                    type="number"
                    value={tauxActualisation}
                    onChange={(e) => setTauxActualisation(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <label className="text-white/50 text-[10px]">Cash-Flow Année 1 :</label>
                    <input
                      type="number"
                      value={cf1}
                      onChange={(e) => setCf1(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-[10px]">Cash-Flow Année 2 :</label>
                    <input
                      type="number"
                      value={cf2}
                      onChange={(e) => setCf2(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-[10px]">Cash-Flow Année 3 :</label>
                    <input
                      type="number"
                      value={cf3}
                      onChange={(e) => setCf3(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-[10px]">Cash-Flow Année 4 :</label>
                    <input
                      type="number"
                      value={cf4}
                      onChange={(e) => setCf4(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/50">Valeur Actuelle Nette (VAN)</span>
                <div className={`text-xl font-bold font-mono ${investmentRes.van > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {investmentRes.van.toFixed(2)} €
                </div>
                <p className="text-[11px] text-white/60">{investmentRes.van > 0 ? '✓ Projet Rentable' : '❌ Projet non rentable'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/50">Taux de Rentabilité Interne (TRI)</span>
                <div className="text-xl font-bold font-mono text-cyan-400">
                  {investmentRes.triEstimated.toFixed(2)} %
                </div>
                <p className="text-[11px] text-white/60">Taux où la VAN s'annule</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <h4 className="font-bold text-emerald-300">Échéancier des Flux Actualisés</h4>
              <div className="space-y-1 font-mono text-white/70">
                {investmentRes.steps.map((st, i) => (
                  <div key={i} className="p-2 rounded-lg bg-black/20">{st}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MATRICES STRATÉGIQUES (SWOT, PESTEL, PORTER) */}
      {activeTab === 'strategic' && (
        <div className="space-y-6">
          {/* SWOT */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-3.5 h-3.5" />
              Matrice SWOT
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                <span className="font-bold text-emerald-400">Forces (Strengths)</span>
                {currentMatrix.swot.strengths.map((s, i) => (
                  <div key={i} className="text-white/80 flex items-center gap-1.5">• {s}</div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1.5">
                <span className="font-bold text-amber-400">Faiblesses (Weaknesses)</span>
                {currentMatrix.swot.weaknesses.map((s, i) => (
                  <div key={i} className="text-white/80 flex items-center gap-1.5">• {s}</div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1.5">
                <span className="font-bold text-cyan-400">Opportunités (Opportunities)</span>
                {currentMatrix.swot.opportunities.map((s, i) => (
                  <div key={i} className="text-white/80 flex items-center gap-1.5">• {s}</div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1.5">
                <span className="font-bold text-rose-400">Menaces (Threats)</span>
                {currentMatrix.swot.threats.map((s, i) => (
                  <div key={i} className="text-white/80 flex items-center gap-1.5">• {s}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
