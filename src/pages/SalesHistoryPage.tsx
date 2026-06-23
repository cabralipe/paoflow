import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { useCurrentCashSession } from '../hooks/useCurrentCashSession';
import { useRealtimeSales } from '../hooks/useRealtimeSales';
import { authService } from '../services/authService';
import { formatCurrency } from '../utils/currency';
import { formatFullDateTime } from '../utils/dates';
import { Profile, Sale, SaleStatus, PaymentMethod } from '../types';
import { Search, Filter, RefreshCw, XCircle, ChevronDown, CheckCircle2, Clock } from 'lucide-react';

export default function SalesHistoryPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(authService.getCurrentUser());
  const { currentSession, loading: loadingSession } = useCurrentCashSession();
  
  // Realtime logging hook
  const { sales, loading: loadingSales, refetch } = useRealtimeSales(currentSession?.id);

  // Estados dos filtros
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterAttendant, setFilterAttendant] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Lista de atendentes exclusivos das vendas para dropdown de filtro
  const [attendantsList, setAttendantsList] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (sales.length > 0) {
      const names = Array.from(new Set(sales.map(s => s.attendant_name || 'Desconhecido')));
      setAttendantsList(names);
    }
  }, [sales]);

  // Aplificação dos filtros nos dados de vendas
  const filteredSales = sales.filter((sale) => {
    const matchStatus = filterStatus === 'all' || sale.status === filterStatus;
    const matchMethod = filterMethod === 'all' || sale.payment_method === filterMethod;
    const matchAttendant = filterAttendant === 'all' || (sale.attendant_name || 'Desconhecido') === filterAttendant;
    
    const term = searchTerm.toLowerCase();
    const matchSearch = term === '' || 
      String(sale.sale_number).includes(term) ||
      (sale.attendant_name || '').toLowerCase().includes(term) ||
      (sale.total.toFixed(2)).includes(term);

    return matchStatus && matchMethod && matchAttendant && matchSearch;
  });

  const getPaymentName = (method: string) => {
    switch (method) {
      case 'pix': return 'Pix';
      case 'cash': return 'Dinheiro';
      case 'card': return 'Cartão';
      case 'credit': return 'Fiado';
      default: return 'Outro';
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-5" id="pao-history-view">
        <Header 
          title="Histórico de Vendas" 
          subtitle="Consulte, filtre e acompanhe todas as vendas registradas sob a sessão ativa do caixa."
          session={currentSession}
          loadingSession={loadingSession}
        />

        {/* Bloco de Filtros Responsivos */}
        <div className="bg-white border-4 border-brand-dark p-4 md:p-5 shadow-[4px_4px_0px_rgba(26,26,26,1)]" id="history-filters-card">
          <div className="flex items-center gap-1.5 text-xs text-brand-dark/70 font-black uppercase tracking-[0.15em] mb-3.5">
            <Filter className="w-4 h-4 text-brand-orange stroke-[2.5]" />
            <span>Filtros do Livro de Caixa</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            {/* Filtro de Status */}
            <div className="flex flex-col gap-1 text-brand-dark font-black text-xs uppercase tracking-wider">
              <span className="mb-0.5">Status do Pedido</span>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-white border-3 border-brand-dark rounded-none py-2.5 px-3 text-xs outline-hidden text-brand-dark font-black cursor-pointer uppercase tracking-wider focus:border-brand-orange focus:ring-0"
                >
                  <option value="all">VER TODOS</option>
                  <option value="waiting_payment">AGUARDANDO PAGAMENTO (FILA)</option>
                  <option value="paid">CONFIRMADOS (RECEBIDOS)</option>
                  <option value="cancelled">CANCELADOS</option>
                </select>
              </div>
            </div>

            {/* Filtro de Forma de Pagamento */}
            <div className="flex flex-col gap-1 text-brand-dark font-black text-xs uppercase tracking-wider">
              <span className="mb-0.5">Meio de Pagamento</span>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="w-full bg-white border-3 border-brand-dark rounded-none py-2.5 px-3 text-xs outline-hidden text-brand-dark font-black cursor-pointer uppercase tracking-wider focus:border-brand-orange focus:ring-0"
              >
                <option value="all">TODAS AS FORMAS</option>
                <option value="pix">PIX</option>
                <option value="cash">DINHEIRO</option>
                <option value="card">CARTÃO</option>
                <option value="credit">FIADO</option>
              </select>
            </div>

            {/* Filtro de Atendente */}
            <div className="flex flex-col gap-1 text-brand-dark font-black text-xs uppercase tracking-wider">
              <span className="mb-0.5">Atendente</span>
              <select
                value={filterAttendant}
                onChange={(e) => setFilterAttendant(e.target.value)}
                className="w-full bg-white border-3 border-brand-dark rounded-none py-2.5 px-3 text-xs outline-hidden text-brand-dark font-black cursor-pointer uppercase tracking-wider focus:border-brand-orange focus:ring-0"
              >
                <option value="all">TODOS OS ATENDENTES</option>
                {attendantsList.map(name => (
                  <option key={name} value={name}>{name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Busca livre */}
            <div className="flex flex-col gap-1 text-brand-dark font-black text-xs uppercase tracking-wider">
              <span className="mb-0.5">Pesquisar por Ticket</span>
              <div className="relative">
                <Search className="absolute left-3.5 top-[13px] w-3.5 h-3.5 text-brand-dark/60 stroke-[2.5]" />
                <input
                  type="text"
                  placeholder="Ex: número, valor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border-3 border-brand-dark rounded-none py-2.5 pl-9 pr-3 text-xs outline-hidden text-brand-dark font-black uppercase tracking-wide focus:border-brand-orange focus:ring-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabela do Histórico */}
        <div className="bg-white border-4 border-brand-dark p-4 sm:p-5 shadow-[5px_5px_0px_rgba(26,26,26,1)]" id="history-table-card">
          <div className="flex justify-between items-center mb-5 pb-3 border-b-4 border-brand-cream">
            <span className="text-brand-dark text-base font-black uppercase tracking-wider">Vendas Filtradas ({filteredSales.length})</span>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 border-3 border-brand-dark text-brand-charcoal hover:bg-brand-cream/80 font-black text-xs uppercase shadow-[2px_2px_0px_rgba(26,26,26,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
              title="Sincronizar histórico"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
              Sincronizar
            </button>
          </div>

          {loadingSales && sales.length === 0 ? (
            <div className="flex flex-col gap-2.5 py-6">
              <div className="h-10 bg-white border-4 border-brand-dark animate-pulse"></div>
              <div className="h-10 bg-white border-4 border-brand-dark animate-pulse"></div>
              <div className="h-10 bg-white border-4 border-brand-dark animate-pulse"></div>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-extrabold uppercase tracking-wide" id="empty-history-alert">
              Nenhuma venda registrada coincide com os filtros selecionados ou nenhuma venda lançada na atividade atual.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-brand-dark font-black uppercase tracking-wider border-b-4 border-brand-dark">
                    <th className="py-3 px-3">Ticket</th>
                    <th className="py-3 px-3">Registro</th>
                    <th className="py-3 px-3">Atendente</th>
                    <th className="py-3 px-3 text-center">Resumo de Carga</th>
                    <th className="py-3 px-3 text-center">Pagamento</th>
                    <th className="py-3 px-3 text-right">Preço Final</th>
                    <th className="py-3 px-3 text-right">Status do Caixa</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-brand-cream font-bold text-brand-dark">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-brand-cream/40 transition-all">
                      <td className="py-3.5 px-3">
                        <span className="font-mono bg-brand-dark text-[#FEF3C7] font-black px-2 py-0.5 border border-brand-dark uppercase text-[11px]">
                          #{String(sale.sale_number).padStart(3, '0')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-[#78716C] font-mono">
                        {formatFullDateTime(sale.created_at).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-black uppercase text-brand-dark">
                        {sale.attendant_name || 'Ana Silva'}
                      </td>
                      <td className="py-3.5 px-3 text-center text-brand-dark font-mono whitespace-nowrap uppercase">
                        {sale.quantity} {sale.quantity === 1 ? 'PÃO' : 'PÃES'}
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap uppercase">
                        {getPaymentName(sale.payment_method).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-black font-mono text-brand-orange whitespace-nowrap">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <StatusBadge status={sale.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
