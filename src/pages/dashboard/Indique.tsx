import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, RefreshCw, Copy, Check, MessageCircle, Send, Gift, UserPlus, CreditCard, Award, Link2 } from 'lucide-react';
import DashboardTitleCard from '@/components/dashboard/DashboardTitleCard';
import { useAuth } from '@/contexts/AuthContext';
import { walletApiService } from '@/services/walletApiService';
import { bonusConfigService } from '@/services/bonusConfigService';
import { toast } from 'sonner';

const Indique = () => {
  const { user } = useAuth();
  const [referralEarnings, setReferralEarnings] = useState<any[]>([]);
  const [config, setConfig] = useState({
    referral_system_enabled: true,
    referral_bonus_enabled: true,
    referral_commission_enabled: false,
    referral_bonus_amount: 0,
    referral_commission_percentage: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const referralCode = user?.codigo_indicacao || '';
  const currentDomain = window.location.origin;
  const referralLink = `${currentDomain}/registration?ref=${referralCode}`;

  const loadReferralData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const bonusAmount = await bonusConfigService.getBonusAmount();
      const configData = {
        referral_system_enabled: true,
        referral_bonus_enabled: true,
        referral_commission_enabled: false,
        referral_bonus_amount: bonusAmount,
        referral_commission_percentage: 0
      };
      setConfig(configData);

      const transactionsResponse = await walletApiService.getTransactionHistory(parseInt(user.id), 100);
      let apiReferralEarnings: any[] = [];

      if (transactionsResponse.success && transactionsResponse.data) {
        apiReferralEarnings = transactionsResponse.data
          .filter((t: any) => t.type === 'indicacao')
          .map((t: any) => {
            let referredName = 'Usuário indicado';
            if (t.description) {
              let match = t.description.match(/- (.*?) se cadastrou/);
              if (!match) match = t.description.match(/(.*?) se cadastrou/);
              if (!match) match = t.description.match(/Bônus de indicação - (.*?)$/);
              if (!match) match = t.description.match(/Indicação de (.*?)$/);
              if (match && match[1]) referredName = match[1].trim();
            }
            return {
              id: t.id?.toString() || Date.now().toString(),
              referrer_id: user.id,
              referred_user_id: t.id,
              amount: parseFloat(t.amount) || bonusAmount,
              created_at: t.created_at || new Date().toISOString(),
              status: 'paid',
              referred_name: referredName
            };
          });
      }

      setReferralEarnings(apiReferralEarnings);

      if (apiReferralEarnings.length === 0 && (!transactionsResponse.success || !transactionsResponse.data?.length)) {
        // No data from API
      }
    } catch (error) {
      console.error('❌ [INDIQUE] Erro ao carregar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, [user?.id]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(new Date(dateString));
    } catch { return dateString; }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Erro ao copiar'); }
  };

  const shareOnWhatsApp = () => {
    const message = `🎁 Use meu código *${referralCode}* e ganhe R$ ${config.referral_bonus_amount.toFixed(2)} de bônus!\n\nCadastre-se: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareOnTelegram = () => {
    const message = `🎁 Use meu código ${referralCode} e ganhe R$ ${config.referral_bonus_amount.toFixed(2)} de bônus!\nLink: ${referralLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const totalBonus = referralEarnings.reduce((sum, ref) => sum + ref.amount, 0);
  const potentialBonus = config.referral_bonus_amount;

  if (isLoading && !referralCode) {
    return (
      <div className="space-y-4 relative z-10 px-1 sm:px-0">
        <DashboardTitleCard title="Programa de Indicação" icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />} />
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!referralCode) {
    return (
      <div className="space-y-4 relative z-10 px-1 sm:px-0">
        <DashboardTitleCard title="Programa de Indicação" icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />} />
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <span className="text-destructive text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-destructive">Código não encontrado</h3>
                <p className="text-sm text-muted-foreground">Entre em contato com o suporte.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10 px-1 sm:px-0">
      <DashboardTitleCard title="Programa de Indicação" icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />} />

      {/* Top Section: Hero Card + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Hero Card - Left */}
        <div className="lg:col-span-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 dark:from-emerald-700 dark:via-emerald-600 dark:to-teal-500 p-6 h-full text-white shadow-lg">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 space-y-4">
              <div>
                <h3 className="text-lg font-bold">Indique e Ganhe</h3>
                <p className="text-white/80 text-sm">Compartilhe seu link e ganhe recompensas!</p>
              </div>

              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Users className="h-8 w-8 text-white" />
              </div>

              <div>
                <p className="text-3xl font-bold">{formatCurrency(totalBonus)}</p>
                <p className="text-white/70 text-sm">Total ganho com indicações</p>
                {potentialBonus > 0 && (
                  <p className="text-white/60 text-xs mt-1">+ {formatCurrency(potentialBonus)} em potencial</p>
                )}
              </div>

              {/* Referral Link */}
              <div>
                <p className="text-white/70 text-xs mb-1.5">Seu link de indicação</p>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg p-2.5">
                  <span className="text-xs truncate flex-1 font-mono">{referralLink}</span>
                  <button
                    onClick={() => copyToClipboard(referralLink)}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors flex-shrink-0"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Stats mini */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="text-center bg-white/10 rounded-lg py-2">
                  <p className="text-xl font-bold">{referralEarnings.length}</p>
                  <p className="text-[10px] text-white/70">Cadastros</p>
                </div>
                <div className="text-center bg-white/10 rounded-lg py-2">
                  <p className="text-xl font-bold">{referralEarnings.filter(e => e.status === 'paid').length}</p>
                  <p className="text-[10px] text-white/70">Bônus Pagos</p>
                </div>
                <div className="text-center bg-white/10 rounded-lg py-2">
                  <p className="text-xl font-bold">{referralEarnings.length}</p>
                  <p className="text-[10px] text-white/70">Ativos</p>
                </div>
              </div>

              {/* Share Button */}
              <Button
                onClick={() => copyToClipboard(referralLink)}
                className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                variant="outline"
              >
                <Link2 className="h-4 w-4 mr-2" />
                Compartilhar Link
              </Button>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Resumo de Ganhos */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground">Resumo de Ganhos</h2>
              <p className="text-sm text-muted-foreground">Acompanhe o desempenho do seu programa de indicação</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Cadastros</p>
                  <p className="text-3xl font-bold text-foreground">{referralEarnings.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatCurrency(referralEarnings.reduce((s, r) => s + r.amount, 0))}</p>
                </CardContent>
              </Card>

              <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Bônus Pagos</p>
                  <p className="text-3xl font-bold text-foreground">{referralEarnings.filter(e => e.status === 'paid').length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatCurrency(totalBonus)}</p>
                </CardContent>
              </Card>

              <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Valor por Indicação</p>
                  <p className="text-3xl font-bold text-foreground">
                    {isLoading ? '...' : formatCurrency(config.referral_bonus_amount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Para cada cadastro</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={shareOnWhatsApp} className="bg-[#25D366] hover:bg-[#20BA5A] text-white flex-1 min-w-[140px]">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={shareOnTelegram} className="bg-[#0088cc] hover:bg-[#006699] text-white flex-1 min-w-[140px]">
              <Send className="h-4 w-4 mr-2" />
              Telegram
            </Button>
            <Button onClick={() => copyToClipboard(referralLink)} variant="outline" className="flex-1 min-w-[140px]">
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copiado!' : 'Copiar Link'}
            </Button>
          </div>
        </div>
      </div>

      {/* Histórico de Indicações */}
      <Card className="border border-border/50 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Histórico de Indicações</h2>
              <p className="text-sm text-muted-foreground">Acompanhe as pessoas que se cadastraram com seu link</p>
            </div>
            <Button variant="ghost" size="sm" onClick={loadReferralData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                  <div className="h-4 bg-muted rounded w-20" />
                </div>
              ))}
            </div>
          ) : referralEarnings.length > 0 ? (
            <>
              {/* Table header - desktop */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/50 mb-2">
                <div className="col-span-4">Nome</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-2 text-center">Data</div>
                <div className="col-span-2 text-center">Bônus Pagos</div>
                <div className="col-span-2 text-right">Ganhos</div>
              </div>

              <div className="space-y-2">
                {referralEarnings.map((earning) => (
                  <div key={earning.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center p-4 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                    {/* Name */}
                    <div className="md:col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {earning.referred_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{earning.referred_name || 'Usuário indicado'}</p>
                        <p className="text-xs text-muted-foreground">ID: {earning.referred_user_id}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2 flex md:justify-center">
                      <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0 text-xs">
                        ✓ Registrado
                      </Badge>
                    </div>

                    {/* Date */}
                    <div className="md:col-span-2 text-sm text-muted-foreground md:text-center">
                      {formatDate(earning.created_at)}
                    </div>

                    {/* Bonus count */}
                    <div className="md:col-span-2 md:text-center">
                      <span className="text-sm font-medium text-foreground">1</span>
                    </div>

                    {/* Amount */}
                    <div className="md:col-span-2 md:text-right">
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(earning.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma indicação ainda</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Compartilhe seu link para começar a ganhar bônus!
              </p>
              <Button onClick={() => copyToClipboard(referralLink)} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link de Indicação
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Indique;
