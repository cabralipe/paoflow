import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import DailySummaryComponent from '../components/DailySummary';
import { useCurrentCashSession } from '../hooks/useCurrentCashSession';
import { useDailySummary } from '../hooks/useDailySummary';
import { useRealtimeSales } from '../hooks/useRealtimeSales';
import { authService } from '../services/authService';
import { formatCurrency } from '../utils/currency';
import { Profile } from '../types';
import { Activity, Users, ShieldAlert, Award, TrendingUp, AlertCircle } from 'lucide-react';

interface AttendantStat {
  name: string;
  salesCount: number;
  breadsCount: number;
  totalValue: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(authService.getCurrentUser());
  const { currentSession, loading: loadingSession } = useCurrentCashSession();
  
  // Realtime statistical hook
  const { summary, loading: loadingSummary } = useDailySummary(currentSession?.id);
  const { sales } = useRealtimeSales(currentSession?.id);

  const [attendantsStats, setAttendantsStats] = useState<AttendantStat[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  // Calcula estatísticas por atendente a partir de todas as vendas da sessão
  useEffect(() => {
    if (sales.length === 0) {
      setAttendantsStats([]);
      return;
    }

    const map: Record<string, AttendantStat> = {};
    
    // Filtramos apenas vendas ativas (pago ou esperando pagamento, excluindo cancelados se preferido, ou incluindo todos separado de acordo)
    sales.forEach(sale => {
      const name = sale.attendant_name || 'Atendente Balcão';
      const isPaid = sale.status === 'paid';
      
      if (!map[name]) {
        map[name] = {
          name,
          salesCount: 0,
          breadsCount: 0,
          totalValue: 0
        };
      }

      // Incrementa
      map[name].salesCount++;
      if (isPaid) {
        map[name].breadsCount += sale.quantity;
        map[name].totalValue += Number(sale.total);
      }
    });

    setAttendantsStats(Object.values(map).sort((a, b) => b.totalValue - a.totalValue));
  }, [sales]);

  return (
    <Layout>
      <div className="flex flex-col gap-5" id="pao-dashboard-view">
        <Header 
          title="Painel Geral Consolidado" 
          subtitle="Acompanhe o ritmo faturamento e vendas de pães do balcão em tempo real."
          session={currentSession}
          loadingSession={loadingSession}
        />

        {/* Verificação administrativa */}
        {user && user.role !== 'admin' && (
          <div className="bg-[#FEF3C7] border-4 border-brand-dark p-4 font-black text-brand-dark flex items-center gap-2 mb-3 shadow-[4px_4px_0px_rgba(26,26,26,1)] text-xs">
            <ShieldAlert className="w-5 h-5 text-brand-orange shrink-0 stroke-[2.5]" />
            <span>PERFIL: <strong className="text-brand-orange">{user.role === 'cashier' ? 'CAIXA' : 'ATENDENTE'}</strong> — VISUALIZANDO MÉTRICAS GERAIS CORPORATIVAS.</span>
          </div>
        )}

        {/* Seção Principal do Resumo Diário Bento */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-orange stroke-[2.5]" />
            <h2 className="text-lg md:text-xl font-black text-brand-dark tracking-tight uppercase">Métricas Consolidadas da Sessão Ativa</h2>
          </div>

          {!currentSession ? (
            <div className="bg-white border-4 border-dashed border-brand-dark p-10 text-center flex flex-col items-center gap-4 shadow-[5px_5px_0px_rgba(26,26,26,1)]">
              <AlertCircle className="text-brand-orange w-12 h-12 stroke-[2.5]" />
              <div>
                <h3 className="text-base font-black text-brand-dark uppercase">Atenção: Sem Caixa Aberto</h3>
                <p className="text-slate-500 text-xs mt-2 uppercase tracking-wide leading-relaxed font-bold max-w-sm">
                  Não é possível analisar estatísticas de faturamento porque o caixa diário está fechado. Peça para o gerente iniciar o caixa informando a quantidade inicial de pães.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Bento Dashboard stats */}
              <DailySummaryComponent summary={summary} loading={loadingSummary} />

              {/* Estatísticas de Funcionários por Vendas */}
              <div className="bg-white border-4 border-brand-dark p-5 md:p-6 shadow-[5px_5px_0px_rgba(26,26,26,1)] mt-2">
                <h3 className="text-base font-black text-brand-dark tracking-tight uppercase flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-brand-orange stroke-[2.5]" />
                  Desempenho Corporativo por Atendente (PAGOS)
                </h3>
                
                {attendantsStats.length === 0 ? (
                  <p className="text-slate-400 text-xs py-4 text-center font-bold uppercase tracking-wider">Nenhuma venda contabilizada na sessão atual ainda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-brand-dark uppercase tracking-wider font-black border-b-4 border-brand-dark">
                          <th className="py-3 px-2">Posição</th>
                          <th className="py-3 px-2">Atendente</th>
                          <th className="py-3 px-2 text-center">Ticket Total (Vendas)</th>
                          <th className="py-3 px-2 text-center">Total de Pães</th>
                          <th className="py-3 px-2 text-right">Faturamento Pago</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-bold">
                        {attendantsStats.map((stat, i) => (
                          <tr key={stat.name} className="hover:bg-brand-cream/40 text-brand-dark transition-all">
                            <td className="py-3.5 px-2">
                              {i === 0 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 bg-brand-yellow text-brand-dark font-black border-2 border-brand-dark shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                                  🥇
                                </span>
                              ) : (
                                <span className="inline-sm text-brand-dark opacity-60 font-black ml-1.5">{i + 1}º</span>
                              )}
                            </td>
                            <td className="py-3.5 px-2 font-black text-brand-dark uppercase">{stat.name}</td>
                            <td className="py-3.5 px-2 text-center text-slate-500 font-mono">
                              {stat.salesCount} ped.
                            </td>
                            <td className="py-3.5 px-2 text-center text-brand-dark font-mono uppercase">
                              {stat.breadsCount} pães
                            </td>
                            <td className="py-3.5 px-2 text-right font-black text-brand-orange font-mono">
                              {formatCurrency(stat.totalValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
