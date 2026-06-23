import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import QueueCard from '../components/QueueCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { useCurrentCashSession } from '../hooks/useCurrentCashSession';
import { useRealtimeSales } from '../hooks/useRealtimeSales';
import { authService } from '../services/authService';
import { salesService } from '../services/salesService';
import { formatCurrency } from '../utils/currency';
import { Profile, Sale } from '../types';
import { Clock, ShieldAlert, Sparkles, AlertCircle, ShoppingCart } from 'lucide-react';

export default function CashierQueuePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(authService.getCurrentUser());
  const { currentSession, loading: loadingSession } = useCurrentCashSession();
  
  // Hook de tempo real para escutar vendas da sessão ativa
  const { sales, loading: loadingSales, refetch } = useRealtimeSales(currentSession?.id);

  // Estados locais e modais
  const [processing, setProcessing] = useState<boolean>(false);
  const [actionSaleId, setActionSaleId] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  // Seletor de vendas pendentes
  const pendingSales = sales.filter((s) => s.status === 'waiting_payment');
  const paidSales = sales.filter((s) => s.status === 'paid');

  // Cálculos rápidos para o topo da fila
  const pendingQty = pendingSales.length;
  const pendingBreadsCount = pendingSales.reduce((acc, s) => acc + s.quantity, 0);
  const pendingValueSum = pendingSales.reduce((acc, s) => acc + Number(s.total), 0);
  const paidValueSum = paidSales.reduce((acc, s) => acc + Number(s.total), 0);

  const handleConfirmPayment = async (saleId: string) => {
    if (!user) return;
    try {
      setProcessing(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Confirma recebimento com proteção contra pagamentos duplicados
      const updated = await salesService.confirmPayment(saleId, user.id);
      
      setSuccessMsg(`Venda #${String(updated.sale_number).padStart(3, '0')} confirmada e concluída com sucesso!`);
      refetch(); // Força recarga rápida preventivamente

      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Erro ao processar ativação de pagamento.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelTrigger = (saleId: string) => {
    setActionSaleId(saleId);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!actionSaleId || !user) return;
    try {
      setProcessing(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      setCancelModalOpen(false);

      const updated = await salesService.cancelSale(actionSaleId, user.id);
      setSuccessMsg(`Venda #${String(updated.sale_number).padStart(3, '0')} cancelada de forma permanente.`);
      refetch();

      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Ocorreu um problema ao cancelar.');
    } finally {
      setActionSaleId(null);
      setProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-5" id="pao-cashier-queue-view">
        <Header 
          title="Fila de Pagamento do Caixa"
          subtitle="Acompanhe vendas enviadas pelo balcão em tempo real. Confirme faturamento assim que receber o valor correspondente."
          session={currentSession}
          loadingSession={loadingSession}
        />

        {/* Alertas e Toasts */}
        {successMsg && (
          <div className="bg-emerald-500 text-white p-4 font-black shadow-[4px_4px_0px_rgba(26,26,26,1)] border-4 border-brand-dark flex items-center justify-between gap-3 animate-slide-in" id="queue-success-toast">
            <span>{successMsg}</span>
            <button 
              type="button" 
              onClick={() => setSuccessMsg(null)} 
              className="bg-brand-dark text-white border-2 border-brand-dark shadow-[2px_2px_0px_rgba(0,0,0,1)] font-black px-4 py-1.5 hover:bg-slate-800 text-xs uppercase cursor-pointer"
            >
              OK
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500 text-white p-4 font-black shadow-[4px_4px_0px_rgba(26,26,26,1)] border-4 border-brand-dark flex items-center justify-between gap-3 animate-shake" id="queue-error-toast">
            <span>{errorMsg}</span>
            <button 
              type="button" 
              onClick={() => setErrorMsg(null)} 
              className="bg-brand-dark text-white border-2 border-brand-dark shadow-[2px_2px_0px_rgba(0,0,0,1)] font-black px-4 py-1.5 hover:bg-slate-800 text-xs uppercase cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Acesso negado visual se não for Caixa ou Admin */}
        {user && user.role === 'attendant' && (
          <div className="bg-[#FEF3C7] border-4 border-brand-dark p-5 font-black text-brand-dark flex flex-col gap-2 shadow-[4px_4px_0px_rgba(26,26,26,1)]" id="attendant-warning-banner">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brand-orange stroke-[2.5]" />
              <span className="uppercase tracking-wider">ACESSO LIMITADO: PERFIL BALCÃO</span>
            </div>
            <p className="font-bold text-xs uppercase tracking-wide leading-relaxed text-slate-800">
              Você está visualizando a tela do caixa. Como Atendente, você está impedido de confirmar pagamentos ou cancelar pedidos enviados. Esta tela serve exclusivamente de consulta.
            </p>
          </div>
        )}

        {/* 1. Cards compactos de Resumo no Topo */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-white border-4 border-brand-dark p-4 shadow-[4px_4px_0px_rgba(26,26,26,1)] flex flex-col justify-center">
            <span className="text-brand-dark/65 text-[10px] font-black uppercase tracking-wider block">Fila Pendente</span>
            <span className="text-xl md:text-2xl font-black block mt-1 text-brand-orange font-mono uppercase">{pendingQty} vendas</span>
          </div>

          <div className="bg-white border-4 border-brand-dark p-4 shadow-[4px_4px_0px_rgba(26,26,26,1)] flex flex-col justify-center">
            <span className="text-brand-dark/65 text-[10px] font-black uppercase tracking-wider block">Pães em Fila</span>
            <span className="text-xl md:text-2xl font-black block mt-1 text-brand-dark font-mono uppercase">{pendingBreadsCount} pães</span>
          </div>

          <div className="bg-white border-4 border-brand-dark p-4 shadow-[4px_4px_0px_rgba(26,26,26,1)] flex flex-col justify-center">
            <span className="text-brand-dark/65 text-[10px] font-black uppercase tracking-wider block">Valor Pendente</span>
            <span className="text-xl md:text-2xl font-black block mt-1 text-brand-dark font-mono uppercase">{formatCurrency(pendingValueSum)}</span>
          </div>

          <div className="bg-white border-4 border-brand-dark p-4 shadow-[4px_4px_0px_rgba(26,26,26,1)] flex flex-col justify-center">
            <span className="text-brand-dark/65 text-[10px] font-black uppercase tracking-wider block">Vendas Pagas (Hoje)</span>
            <span className="text-xl md:text-2xl font-black block mt-1 text-emerald-600 font-mono uppercase">{paidSales.length} pagas</span>
          </div>

          <div className="bg-white border-4 border-brand-dark p-4 shadow-[4px_4px_0px_rgba(26,26,26,1)] flex flex-col justify-center col-span-2 md:col-span-1">
            <span className="text-brand-dark/65 text-[10px] font-black uppercase tracking-wider block">Total Recebido</span>
            <span className="text-xl md:text-2xl font-black block mt-1 text-emerald-800 font-mono uppercase">{formatCurrency(paidValueSum)}</span>
          </div>
        </div>

        {/* 2. Área Central - Fila de Vendas */}
        <div className="mt-2" id="queue-box-list">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 bg-brand-orange rounded-full animate-ping"></div>
            <h2 className="text-lg md:text-xl font-black text-brand-dark tracking-tight uppercase">Vendas aguardando pagamento ({pendingQty})</h2>
          </div>

          {loadingSales && sales.length === 0 ? (
            <div className="flex flex-col gap-4">
              <div className="h-28 bg-white border-4 border-brand-dark animate-pulse"></div>
              <div className="h-28 bg-white border-4 border-brand-dark animate-pulse"></div>
            </div>
          ) : !currentSession ? (
            <div className="bg-white border-4 border-dashed border-brand-dark p-8 text-center flex flex-col items-center gap-3 shadow-[4px_4px_0px_rgba(26,26,26,1)]">
              <AlertCircle className="w-10 h-10 text-brand-orange stroke-[2.5]" />
              <div>
                <h3 className="text-sm font-black text-brand-dark uppercase tracking-wider">Atenção: Caixa Fechado</h3>
                <p className="text-slate-500 text-xs mt-1.5 max-w-sm mx-auto font-bold uppercase tracking-wide">
                  Para permitir registros de vendas de balcão ou acompanhar a fila do caixa, certifique-se de iniciar a sessão diária de caixa nas telas de balanço ou ajustes!
                </p>
              </div>
            </div>
          ) : pendingQty === 0 ? (
            <div className="bg-white border-4 border-dashed border-brand-dark p-12 text-center flex flex-col items-center justify-center gap-4 shadow-[5px_5px_0px_rgba(26,26,26,1)] animate-fade-in">
              <div className="bg-brand-cream border-2 border-brand-dark p-4 rounded-none text-brand-orange">
                <ShoppingCart className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-brand-dark font-black text-base uppercase tracking-wider block">Caixa Livre! Fila limpa</span>
                <p className="text-slate-500 text-xs mt-2 max-w-xs leading-relaxed font-bold uppercase tracking-wide">
                  Nenhum cliente aguardando na fila de pagamento. As vendas lançadas aparecerão aqui instantaneamente!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pendingSales.map((sale) => (
                <QueueCard
                  key={sale.id}
                  sale={sale}
                  onConfirm={user?.role !== 'attendant' ? handleConfirmPayment : (_saleId) => {}}
                  onCancel={user?.role !== 'attendant' ? handleCancelTrigger : (_saleId) => {}}
                  isProcessing={processing || user?.role === 'attendant'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal de confirmação de cancelamento */}
        <ConfirmDialog
          isOpen={cancelModalOpen}
          title="Confirmação de Cancelamento"
          message="Tem certeza absoluta que deseja CANCELAR permanentemente esta venda do pão francês? Esta operação dará baixa como cancelada no relatório e estoque e não poderá ser desfeita!"
          confirmLabel="Sim, Cancelar Venda"
          cancelLabel="Não, Manter Venda"
          variant="danger"
          onCancel={() => {
            setCancelModalOpen(false);
            setActionSaleId(null);
          }}
          onConfirm={handleConfirmCancel}
        />
      </div>
    </Layout>
  );
}
