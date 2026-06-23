import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import CustomDailySummary from '../components/DailySummary';
import { useCurrentCashSession } from '../hooks/useCurrentCashSession';
import { useDailySummary } from '../hooks/useDailySummary';
import { authService } from '../services/authService';
import { cashierService } from '../services/cashierService';
import { formatFullDateTime } from '../utils/dates';
import { CashSession, Profile } from '../types';
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  ClipboardCopy,
  FileSpreadsheet,
  Info,
  Lock,
  ShieldAlert,
} from 'lucide-react';

export default function CloseCashierPage() {
  const navigate = useNavigate();
  const [user] = useState<Profile | null>(authService.getCurrentUser());
  const { currentSession, loading: loadingSession, refetch: refetchSession } = useCurrentCashSession();
  const [lastClosedSession, setLastClosedSession] = useState<CashSession | null>(null);
  const [loadingClosedSession, setLoadingClosedSession] = useState<boolean>(false);

  const displaySession = currentSession || lastClosedSession;
  const isClosedSessionView = !currentSession && !!lastClosedSession;
  const { summary, loading: loadingSummary } = useDailySummary(displaySession?.id);

  const [actualBreadsCount, setActualBreadsCount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    let active = true;

    const fetchLastClosedSession = async () => {
      if (loadingSession) return;

      if (currentSession) {
        setLastClosedSession(null);
        return;
      }

      try {
        setLoadingClosedSession(true);
        const session = await cashierService.getLastClosedSession();
        if (active) setLastClosedSession(session);
      } catch (err) {
        console.error('Erro ao buscar ultimo caixa fechado:', err);
      } finally {
        if (active) setLoadingClosedSession(false);
      }
    };

    fetchLastClosedSession();

    return () => {
      active = false;
    };
  }, [currentSession?.id, loadingSession]);

  const handleCloseCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user) return;
    if (!currentSession) {
      setErrorMsg('Nao ha sessao de caixa aberta no momento.');
      return;
    }

    const physicalCount = parseInt(actualBreadsCount, 10);
    if (isNaN(physicalCount) || physicalCount < 0) {
      setErrorMsg('Informe a quantidade fisica contada de paes restantes no balcao. Use 0 se nao sobrou nenhum.');
      return;
    }

    try {
      setSubmitting(true);
      const closedSession = await cashierService.closeSession(user.id, physicalCount, notes);
      setLastClosedSession(closedSession);
      await refetchSession();
      setSuccessMsg('Caixa fechado com sucesso. O balanco consolidado esta disponivel abaixo.');
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

  const remainingEstimated = summary ? summary.quantity_remaining_estimated : 0;
  const parsedActual = actualBreadsCount !== '' ? parseInt(actualBreadsCount, 10) : null;
  const countedBreads = isClosedSessionView ? displaySession?.closing_bread_quantity ?? null : parsedActual;
  const inventoryDiff = countedBreads !== null && !isNaN(countedBreads) ? countedBreads - remainingEstimated : null;

  const inventoryDiffLabel = () => {
    if (inventoryDiff === null) return null;
    if (inventoryDiff === 0) return 'Carga exata. Sem sobras.';
    if (inventoryDiff > 0) return `Sobras de +${inventoryDiff} paes`;
    return `Quebra de ${inventoryDiff} paes`;
  };

  return (
    <Layout>
      <div className="flex flex-col gap-5" id="pao-close-cashier-view">
        <Header
          title="Balanco & Fechamento de Caixa"
          subtitle={
            isClosedSessionView
              ? 'Consulte o ultimo caixa fechado com o balanco consolidado da operacao.'
              : 'Realize a conferencia fisica do balcao de paes e feche o balanco de vendas diarias.'
          }
          session={displaySession}
          loadingSession={loadingSession || loadingClosedSession}
        />

        {user && user.role === 'attendant' && (
          <div className="bg-rose-500/10 border-4 border-brand-dark p-5 text-sm font-black text-rose-900 flex flex-col gap-2 shadow-[4px_4px_0px_rgba(26,26,26,1)]" id="attendant-close-forbidden">
            <div className="flex items-center gap-2 text-rose-950 uppercase tracking-wide">
              <ShieldAlert className="w-5 h-5 text-rose-600 stroke-[2.5]" />
              <span>Acesso Restrito: Perfil Atendente de Balcao</span>
            </div>
            <p className="text-slate-700 font-bold text-xs leading-relaxed uppercase tracking-wide">
              Voce nao possui autorizacao para fechar o caixa ou alterar inventario. Essa tela serve apenas para auditar as vendas efetuadas.
            </p>
          </div>
        )}

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

        {!displaySession ? (
          <div className="bg-white border-4 border-dashed border-brand-dark p-10 text-center flex flex-col items-center gap-4 shadow-[5px_5px_0px_rgba(26,26,26,1)]">
            <ClipboardCopy className="text-brand-orange w-12 h-12 stroke-[2.5]" />
            <div>
              <h3 className="text-base font-black text-brand-dark uppercase">Nao ha caixa aberto atualmente</h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed uppercase tracking-wider font-bold max-w-sm">
                Nenhum fechamento anterior foi encontrado para esta padaria. Abra um caixa em ajustes para iniciar uma nova operacao.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-brand-orange stroke-[2.5]" />
                <h2 className="text-base font-black text-brand-dark tracking-tight uppercase">
                  {isClosedSessionView ? 'Balanco do Ultimo Caixa Fechado' : 'Balanco Consolidado Diario'}
                </h2>
              </div>

              <CustomDailySummary summary={summary} loading={loadingSummary} />

              {isClosedSessionView && (
                <div className="bg-emerald-500 text-white border-4 border-brand-dark p-4 sm:p-5 flex flex-col gap-3 shadow-[4px_4px_0px_rgba(26,26,26,1)]">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>Ultimo caixa fechado registrado</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-black uppercase tracking-wide">
                    <div className="bg-white/15 border-2 border-white/40 p-3">
                      <span className="block text-white/80">Fechado em</span>
                      <strong className="block mt-1">{formatFullDateTime(displaySession.closed_at).toUpperCase()}</strong>
                    </div>
                    <div className="bg-white/15 border-2 border-white/40 p-3">
                      <span className="block text-white/80">Fechado por</span>
                      <strong className="block mt-1">{String(displaySession.closed_by_name || 'Operador').toUpperCase()}</strong>
                    </div>
                    <div className="bg-white/15 border-2 border-white/40 p-3">
                      <span className="block text-white/80">Contagem final</span>
                      <strong className="block mt-1">{displaySession.closing_bread_quantity ?? 0} PAES</strong>
                    </div>
                  </div>
                  {displaySession.notes && (
                    <div className="bg-white text-brand-dark border-2 border-brand-dark p-3 text-xs font-black uppercase tracking-wide">
                      <span className="block text-brand-orange mb-1">Anotacoes do fechamento</span>
                      {displaySession.notes}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white border-4 border-brand-dark p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between items-start gap-4 text-xs font-black text-brand-dark shadow-[4px_4px_0px_rgba(26,26,26,1)]">
                <div>
                  <span className="block uppercase tracking-wide">
                    Abertura: <strong className="text-brand-orange">{formatFullDateTime(displaySession.opened_at).toUpperCase()}</strong>
                  </span>
                  <span className="block mt-2 uppercase tracking-wide">
                    Por Operador: <strong className="text-brand-dark">{String(displaySession.opened_by_name || 'Operador').toUpperCase()}</strong>
                  </span>
                  {displaySession.closed_at && (
                    <span className="block mt-2 uppercase tracking-wide">
                      Fechamento: <strong className="text-brand-orange">{formatFullDateTime(displaySession.closed_at).toUpperCase()}</strong>
                    </span>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  <span className="block uppercase tracking-wide">
                    Situacao:{' '}
                    <span className={`${displaySession.status === 'closed' ? 'bg-rose-500' : 'bg-emerald-500'} text-white border-2 border-brand-dark px-2.5 py-1 text-[10px] font-black uppercase tracking-wider`}>
                      {displaySession.status === 'closed' ? 'Fechado' : 'Aberto'}
                    </span>
                  </span>
                  <span className="block mt-2.5 uppercase tracking-wide font-mono">
                    Turno: <strong className="text-brand-orange">Diario / Balcao</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className={`lg:col-span-5 flex flex-col gap-6 ${user?.role === 'attendant' ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-orange stroke-[2.5]" />
                <h2 className="text-base font-black text-brand-dark tracking-tight uppercase">
                  {isClosedSessionView ? 'Resultado da Auditoria' : 'Auditoria Fisica de Balcao'}
                </h2>
              </div>

              <div className="bg-white border-4 border-brand-dark p-5 md:p-6 shadow-[5px_5px_0px_rgba(26,26,26,1)] flex flex-col gap-5">
                <div className="bg-[#FEF3C7] border-3 border-brand-dark p-4 flex gap-3 text-xs leading-relaxed text-[#78350F] font-black shadow-[2px_2px_0px_rgba(26,26,26,1)] uppercase tracking-wide">
                  <Info className="w-4 h-4 text-brand-orange shrink-0 mt-0.5 stroke-[2.5]" />
                  <div>
                    Estimativa do sistema: restam cerca de <strong>{remainingEstimated} paes</strong> no balcao.
                    {isClosedSessionView ? ' A contagem fisica registrada no fechamento aparece abaixo.' : ' Conte fisicamente o mostrador e insira o valor real.'}
                  </div>
                </div>

                {isClosedSessionView ? (
                  <div className="flex flex-col gap-5">
                    <div className="border-3 border-brand-dark p-4 bg-white shadow-[2px_2px_0px_rgba(26,26,26,1)]">
                      <span className="text-brand-dark/70 text-[10px] font-black uppercase tracking-wide block">Paes restantes contados</span>
                      <span className="text-3xl font-black block mt-1.5 text-brand-dark font-mono uppercase">
                        {displaySession.closing_bread_quantity ?? 0} PAES
                      </span>
                    </div>

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
                          Diferenca Apurada:
                        </span>
                        <span className="text-sm font-black tracking-tight font-mono">{inventoryDiffLabel()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleCloseCashier} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-brand-dark text-xs font-black uppercase tracking-wider block">
                        Paes Restantes Contados no Balcao
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Ex: 50 paes"
                        value={actualBreadsCount}
                        onChange={(e) => setActualBreadsCount(e.target.value)}
                        required
                        className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-3 px-4 text-sm font-black outline-hidden text-brand-dark focus:ring-0 uppercase"
                      />
                    </div>

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
                          Diferenca Apurada:
                        </span>
                        <span className="text-sm font-black tracking-tight font-mono">{inventoryDiffLabel()}</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-brand-dark text-xs font-black uppercase tracking-wider block">
                        Anotacoes de Fechamento / Turno
                      </label>
                      <textarea
                        placeholder="Ex: Fechado sem divergencias financeiras."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full bg-white border-3 border-brand-dark focus:border-brand-orange py-2 px-3.5 text-sm font-black outline-hidden text-brand-dark focus:ring-0"
                      />
                    </div>

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
                )}
              </div>

              <div className="text-center font-mono text-[9px] font-black text-brand-dark/55 uppercase mt-3">
                Auditoria registrada sob usuario <span className="text-brand-orange">{user?.name.toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
