import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import BigButton from '../components/BigButton';
import CustomDailySummary from '../components/DailySummary';
import { useCurrentCashSession } from '../hooks/useCurrentCashSession';
import { useDailySummary } from '../hooks/useDailySummary';
import { authService } from '../services/authService';
import { cashierService } from '../services/cashierService';
import { formatCurrency } from '../utils/currency';
import { formatFullDateTime } from '../utils/dates';
import { Profile } from '../types';
import { Lock, FileSpreadsheet, Percent, Info, ClipboardCopy, ArrowRightLeft, ShieldAlert, AlertCircle } from 'lucide-react';

export default function CloseCashierPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(authService.getCurrentUser());
  const { currentSession, loading: loadingSession, refetch: refetchSession } = useCurrentCashSession();
  const { summary, loading: loadingSummary } = useDailySummary(currentSession?.id);

  // Estados locais : Quantidade física contada e observações
  const [actualBreadsCount, setActualBreadsCount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Estados de feedback
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const handleCloseCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user) return;
    if (!currentSession) {
      setErrorMsg('Não há sessão de caixa aberta no momento.');
      return;
    }

    const physicalCount = parseInt(actualBreadsCount, 10);
    if (isNaN(physicalCount) || physicalCount < 0) {
      setErrorMsg('Por favor, informe a quantidade real física contada de pães restantes no mostrador (digite 0 se não sobrar nenhum).');
      return;
    }

    try {
      setSubmitting(true);
      await cashierService.closeSession(user.id, physicalCount, notes);
      await refetchSession();
      setSuccessMsg(`Caixa FECHADO com sucesso! Todas as vendas foram salvas e consolidadas no histórico.`);
      setActualBreadsCount('');
      setNotes('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao realizar o fechamento do caixa.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cálculos de diferença de inventário (Estoque Esperado vs Estoque Real Contado)
  const remainingEstimated = summary ? summary.quantity_remaining_estimated : 0;
  const parsedActual = actualBreadsCount !== '' ? parseInt(actualBreadsCount, 10) : null;
  const inventoryDiff = parsedActual !== null && !isNaN(parsedActual) ? parsedActual - remainingEstimated : null;

  return (
    <Layout>
      <div className="flex flex-col gap-5" id="pao-close-cashier-view">
        <Header 
          title="Balanço & Fechamento de Caixa" 
          subtitle="Realize a conferência física do balcão de pães e feche o balanço de vendas diárias."
          session={currentSession}
          loadingSession={loadingSession}
        />

        {/* Verificação de Permissão do Caixa */}
        {user && user.role === 'attendant' && (
          <div className="bg-rose-500/10 border-4 border-brand-dark p-5 text-sm font-black text-rose-900 flex flex-col gap-2 shadow-[4px_4px_0px_rgba(26,26,26,1)]" id="attendant-close-forbidden">
            <div className="flex items-center gap-2 text-rose-950 uppercase tracking-wide">
              <ShieldAlert className="w-5 h-5 text-rose-600 stroke-[2.5]" />
              <span>Acesso Restrito: Perfil Atendente de Balcão</span>
            </div>
            <p className="text-slate-700 font-bold text-xs leading-relaxed uppercase tracking-wide">
              Você não possui autorização para fechar o caixa ou realizar a alteração de inventário. Essa tela serve apenas para auditar as vendas efetuadas no dia corrente.
            </p>
          </div>
        )}

        {/* Toasts */}
        {successMsg && (
          <div className="bg-emerald-500 text-white border-4 border-brand-dark p-4 font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_rgba(26,26,26,1)]" id="close-success">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500 text-white border-4 border-brand-dark p-4 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[4px_4px_0px_rgba(26,26,26,1)]" id="close-error">
            <AlertCircle className="w-5 h-5 text-white shrink-0 stroke-[2.5]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Seção Principal */}
        {!currentSession ? (
          <div className="bg-white border-4 border-dashed border-brand-dark p-10 text-center flex flex-col items-center gap-4 shadow-[5px_5px_0px_rgba(26,26,26,1)]">
            <ClipboardCopy className="text-brand-orange w-12 h-12 stroke-[2.5]" />
            <div>
              <h3 className="text-base font-black text-brand-dark uppercase">Não há caixa aberto atualmente</h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed uppercase tracking-wider font-bold max-w-sm">
                O caixa diário está encerrado. Peça para o gerente ou supervisor administrativo iniciar o dia informando a nova carga inicial sob a tela de ajustes.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Lado Esquerdo - Relatório Consolidado (Col 7) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-brand-orange stroke-[2.5]" />
                <h2 className="text-base font-black text-brand-dark tracking-tight uppercase">Balanço Consolidado Diário</h2>
              </div>

              {/* Bento Dashboard statistics card */}
              <CustomDailySummary summary={summary} loading={loadingSummary} />

              {/* Metadados da sessão aberta */}
              <div className="bg-white border-4 border-brand-dark p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between items-start gap-4 text-xs font-black text-brand-dark shadow-[4px_4px_0px_rgba(26,26,26,1)]">
                <div>
                  <span className="block uppercase tracking-wide">Abertura: <strong className="text-brand-orange">{formatFullDateTime(currentSession.opened_at).toUpperCase()}</strong></span>
                  <span className="block mt-2 uppercase tracking-wide">Por Operador: <strong className="text-brand-dark">{String(currentSession.opened_by_name || 'Felipe Admin').toUpperCase()}</strong></span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="block uppercase tracking-wide">Situação: <span className="bg-emerald-500 text-white border-2 border-brand-dark px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">Aberto</span></span>
                  <span className="block mt-2.5 uppercase tracking-wide font-mono">Turno: <strong className="text-brand-orange">Diário / Balcão</strong></span>
                </div>
              </div>
            </div>

            {/* Lado Direito - Auditoria e Salvar (Col 5) */}
            <div className={`lg:col-span-5 flex flex-col gap-6 ${user?.role === 'attendant' ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-orange stroke-[2.5]" />
                <h2 className="text-base font-black text-brand-dark tracking-tight uppercase">Auditoria Física de Balcão</h2>
              </div>

              <div className="bg-white border-4 border-brand-dark p-5 md:p-6 shadow-[5px_5px_0px_rgba(26,26,26,1)] flex flex-col gap-5">
                
                {/* Info sobre estoque estimado */}
                <div className="bg-[#FEF3C7] border-3 border-brand-dark p-4 flex gap-3 text-xs leading-relaxed text-[#78350F] font-black shadow-[2px_2px_0px_rgba(26,26,26,1)] uppercase tracking-wide">
                  <Info className="w-4 h-4 text-brand-orange shrink-0 mt-0.5 stroke-[2.5]" />
                  <div>
                    Estimativa do sistema: Restam cerca de <strong>{remainingEstimated} pães</strong> franceses no balcão de vendas. Conte fisicamente o mostrador e insira o valor real ao lado.
                  </div>
                </div>

                <form onSubmit={handleCloseCashier} className="flex flex-col gap-5">
                  
                  {/* Entrada Física Contada */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-brand-dark text-xs font-black uppercase tracking-wider block">
                      Pães Restantes Contados no Balcão
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 50 pães"
                      value={actualBreadsCount}
                      onChange={(e) => setActualBreadsCount(e.target.value)}
                      required
                      className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-3 px-4 text-sm font-black outline-hidden text-brand-dark focus:ring-0 uppercase"
                    />
                  </div>

                  {/* Comparativo de Inventário (Diferença) */}
                  {inventoryDiff !== null && (
                    <div className={`p-4 border-3 border-brand-dark flex items-center justify-between transition-all gap-4 text-xs font-black shadow-[2px_2px_0px_rgba(21,21,21,1)] uppercase tracking-wider ${
                      inventoryDiff === 0
                        ? 'bg-emerald-500 text-white'
                        : inventoryDiff > 0
                        ? 'bg-blue-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}>
                      <span className="flex items-center gap-1.5 leading-none">
                        <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
                        Diferença Apurada:
                      </span>
                      <span className="text-sm font-black tracking-tight font-mono">
                        {inventoryDiff === 0 && 'Carga exata! Sem sobras.'}
                        {inventoryDiff > 0 && `Sobras de +${inventoryDiff} pães`}
                        {inventoryDiff < 0 && `Quebra de ${inventoryDiff} pães`}
                      </span>
                    </div>
                  )}

                  {/* Observações */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-brand-dark text-xs font-black uppercase tracking-wider block">
                      Anotações de Fechamento / Turno
                    </label>
                    <textarea
                      placeholder="Ex: Quebras normais de fabricação registradas. Fechado sem divergências financeiras."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-2 px-3.5 text-sm font-black outline-hidden text-brand-dark focus:ring-0"
                    />
                  </div>

                  {/* Botão de Confirmação */}
                  <div className="mt-2.5">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 text-center font-black text-white bg-rose-500 hover:bg-rose-600 border-4 border-brand-dark shadow-[4px_4px_0px_rgba(26,26,26,1)] active:shadow-none active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                    >
                      <Lock className="w-4 h-4 stroke-[2.5]" />
                      {submitting ? 'Salvando Fechamento...' : 'FECHAR E ENCERRAR CAIXA DO DIA'}
                    </button>
                  </div>

                </form>

              </div>
              
              {/* Rodapé segurança */}
              <div className="text-center font-mono text-[9px] font-black text-brand-dark/55 uppercase mt-3">
                Auditoria registrada sob usuário <span className="text-brand-orange">{user?.name.toUpperCase()}</span> • Supervisor
              </div>

            </div>

          </div>
        )}
      </div>
    </Layout>
  );
}
