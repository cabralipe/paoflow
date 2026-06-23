import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import QuantityButtons from '../components/QuantityButtons';
import PaymentButtons from '../components/PaymentButtons';
import SaleTotal from '../components/SaleTotal';
import MostOrderedButtons from '../components/MostOrderedButtons';
import BigButton from '../components/BigButton';
import { useCurrentCashSession } from '../hooks/useCurrentCashSession';
import { useMostOrderedQuantities } from '../hooks/useMostOrderedQuantities';
import { authService } from '../services/authService';
import { settingsService } from '../services/settingsService';
import { salesService } from '../services/salesService';
import { formatCurrency } from '../utils/currency';
import { calculateTotal } from '../utils/calculations';
import { BreadSettings, PaymentMethod, Profile } from '../types';
import { ShoppingBag, Sparkles, Check, AlertCircle, Trash2, ShieldAlert } from 'lucide-react';

export default function QuickSalePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(authService.getCurrentUser());
  const { currentSession, loading: loadingSession } = useCurrentCashSession();
  const { mostOrdered, refetch: refetchMostOrdered } = useMostOrderedQuantities(currentSession?.id);

  // Estados locais da venda
  const [quantity, setQuantity] = useState<number>(10); // Valor padrão inicial
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [settings, setSettings] = useState<BreadSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);
  
  // Estado de envio / feedback
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Se não estiver logado, redireciona para login
    if (!user) {
      navigate('/login');
      return;
    }

    // Carregar configurações do pão francês
    const loadSettings = async () => {
      try {
        setLoadingSettings(true);
        const data = await settingsService.getSettings();
        setSettings(data);
      } catch (e: any) {
        console.error('Falha ao carregar configurações de preço:', e);
        setErrorMsg('Não foi possível se comunicar com o banco de dados.');
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, [user, navigate]);

  const handleClearSale = () => {
    setQuantity(10);
    setPaymentMethod(null);
    setErrorMsg(null);
  };

  const handleSendToCashier = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentSession) {
      setErrorMsg('ATENÇÃO: Não há sessão de caixa aberta atualmente. Solicite que um operador abra o caixa para vender.');
      return;
    }

    if (quantity <= 0) {
      setErrorMsg('Por favor, informe uma quantidade maior do que zero.');
      return;
    }

    if (!paymentMethod) {
      setErrorMsg('Por favor, selecione a Forma de Pagamento informada pelo cliente.');
      return;
    }

    if (!settings || !user) return;

    try {
      setSubmitting(true);
      const total = calculateTotal(quantity, settings.unit_price);
      
      const response = await salesService.createSale({
        cash_session_id: currentSession.id,
        attendant_id: user.id,
        quantity,
        unit_price: settings.unit_price,
        total,
        payment_method: paymentMethod
      });

      // Feedback de Sucesso
      setSuccessMsg(`Pedido #${String(response.sale_number).padStart(3, '0')} enviado com sucesso para a fila do caixa!`);
      
      // Limpar campos
      setQuantity(10);
      setPaymentMethod(null);
      
      // Recarregar os mais pedidos
      refetchMostOrdered();

      // Some com aviso de sucesso depois de 4 segundos
      setTimeout(() => {
        setSuccessMsg(null);
      }, 4000);

    } catch (e: any) {
      console.error(e);
      setErrorMsg('Erro ao tentar enviar pedido para o caixa. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const unitPrice = settings ? settings.unit_price : 0.80;
  const total = calculateTotal(quantity, unitPrice);

  return (
    <Layout>
      <div className="flex flex-col gap-5" id="pao-quick-sale-view">
        <Header 
          title="Venda Rápida de Pães" 
          subtitle="Selecione a quantidade de pães, o meio de pagamento e clique em enviar."
          session={currentSession}
          loadingSession={loadingSession}
        />

        {/* Verifica se usuário tem permissão para vender */}
        {user?.role === 'cashier' && (
          <div className="bg-[#FEF3C7] border-4 border-brand-dark p-4 text-xs font-black uppercase text-brand-dark flex items-center gap-2 mb-2 shadow-[4px_4px_0px_rgba(26,26,26,1)]">
            <ShieldAlert className="w-5 h-5 text-brand-orange shrink-0 stroke-[2.5]" />
            <span>Perfil: <strong>Operador de Caixa</strong>. Você pode fazer vendas, mas lembre-se de monitorar a <strong>Fila do Caixa</strong> para confirmar recebimentos em tempo real.</span>
          </div>
        )}

        {/* Notificações flutuantes de feedback do balcão */}
        {successMsg && (
          <div className="bg-emerald-500 text-white p-4 font-black shadow-[4px_4px_0px_rgba(26,26,26,1)] border-4 border-brand-dark flex items-center justify-between gap-3 animate-slide-in" id="success-toast">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-brand-dark text-white border-2 border-brand-dark shadow-[1px_1px_0px_rgba(26,26,26,1)]">
                <Check className="w-5 h-5 text-white stroke-[3px]" />
              </div>
              <span>{successMsg}</span>
            </div>
            <button 
              type="button"
              onClick={() => setSuccessMsg(null)} 
              className="font-black bg-brand-dark px-3 py-1 border-2 border-brand-dark shadow-[2px_2px_0px_rgba(0,0,0,1)] text-xs text-white uppercase hover:bg-slate-800"
            >
              OK
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500 border-4 border-brand-dark text-white p-4 font-black shadow-[4px_4px_0px_rgba(26,26,26,1)] flex items-start gap-3 animate-shake" id="error-toast">
            <AlertCircle className="w-5 h-5 text-brand-dark mt-0.5 shrink-0 stroke-[2.5]" />
            <div className="flex-1">
              <span>{errorMsg}</span>
            </div>
            <button 
              type="button"
              onClick={() => setErrorMsg(null)} 
              className="text-brand-dark bg-white border-2 border-brand-dark shadow-[2px_2px_0px_rgba(0,0,0,1)] px-3 py-1 hover:bg-slate-100 font-black text-xs uppercase"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Tela Dividida */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Lado Esquerdo - Seleção de Quantidades (Col 7) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Seletor Principal */}
            <QuantityButtons 
              quantity={quantity}
              onChange={setQuantity}
              quickQuantities={settings ? settings.quick_quantities : [5, 10, 12, 20]}
            />

            {/* Mais Pedidos do dia */}
            <MostOrderedButtons 
              mostOrdered={mostOrdered}
              onSelect={setQuantity}
              currentSelect={quantity}
            />

          </div>

          {/* Lado Direito - Pagamento e Envio (Col 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Bloco de Preços e Sessão */}
            <div className="bg-white border-4 border-brand-dark p-5 shadow-[5px_5px_0px_rgba(26,26,26,1)] flex justify-between items-center">
              <div>
                <span className="text-brand-dark/60 text-[10px] font-black uppercase tracking-wider block">Produto</span>
                <span className="text-lg font-black text-brand-dark block mt-0.5">Pão Francês</span>
              </div>
              <div className="text-right">
                <span className="text-brand-dark/60 text-[10px] font-black uppercase tracking-wider block">Preço Unitário</span>
                <span className="text-lg font-black text-brand-dark block mt-0.5">{formatCurrency(unitPrice)}</span>
              </div>
            </div>

            {/* Escolha do Meio de Pagamento */}
            <PaymentButtons 
              selectedMethod={paymentMethod}
              onChange={setPaymentMethod}
            />

            {/* Totalizador */}
            <SaleTotal 
              quantity={quantity}
              unitPrice={unitPrice}
            />

            {/* Ações Inferiores Giga */}
            <div className="flex flex-col gap-3">
              <BigButton 
                label={submitting ? 'Enviando Pedido...' : 'ENVIAR PARA O CAIXA'}
                disabled={submitting || !currentSession}
                variant="primary"
                onClick={handleSendToCashier}
                icon={ShoppingBag}
              />
              <button
                type="button"
                onClick={handleClearSale}
                className="w-full py-3 border-3 border-dashed border-brand-dark hover:bg-rose-100 hover:text-rose-700 text-brand-charcoal font-black text-xs uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_rgba(26,26,26,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(26,26,26,1)]"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                Limpar Campos
              </button>
            </div>

            {/* Indicação de Atendente */}
            <div className="text-center font-mono text-[10px] text-brand-dark/65 font-black uppercase mt-2">
              Registrado por <span className="text-brand-orange">{user?.name.toUpperCase()}</span> • PERFIL BALCÃO
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}
