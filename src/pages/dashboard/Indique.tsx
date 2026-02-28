import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, RefreshCw, Copy, Check, MessageCircle, Send, Gift, UserPlus, DollarSign, TrendingUp, Share2, Sparkles, ArrowRight } from 'lucide-react';
import DashboardTitleCard from '@/components/dashboard/DashboardTitleCard';
import { useAuth } from '@/contexts/AuthContext';
import { walletApiService } from '@/services/walletApiService';
import { newReferralApiService } from '@/services/newReferralApiService';
import { toast } from 'sonner';

const Indique = () => {
  const { user } = useAuth();
  const [referralEarnings, setReferralEarnings] = useState<any[]>([]);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
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
      // Buscar valor do bônus via system-config (endpoint que funciona)
      const amount = await newReferralApiService.getReferralBonusAmount();
      setBonusAmount(amount);

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
              amount: parseFloat(t.amount) || amount,
              created_at: t.created_at || new Date().toISOString(),
              status: 'paid',
              referred_name: referredName
            };
          });
      }

      setReferralEarnings(apiReferralEarnings);
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
    const message = `🎁 Use meu código *${referralCode}* e ganhe R$ ${bonusAmount.toFixed(2)} de bônus!\n\nCadastre-se: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareOnTelegram = () => {
    const message = `🎁 Use meu código ${referralCode} e ganhe R$ ${bonusAmount.toFixed(2)} de bônus!\nLink: ${referralLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const totalBonus = referralEarnings.reduce((sum, ref) => sum + ref.amount, 0);

  if (isLoading && !referralCode) {
    return (
      <div className="space-y-4 relative z-10 px-1 sm:px-0">
        <DashboardTitleCard title="Programa de Indicação" icon={<Gift className="h-4 w-4 sm:h-5 sm:w-5" />} />
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!referralCode) {
    return (
      <div className="space-y-4 relative z-10 px-1 sm:px-0">
        <DashboardTitleCard title="Programa de Indicação" icon={<Gift className="h-4 w-4 sm:h-5 sm:w-5" />} />
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-center">
            <span className="text-4xl mb-3 block">⚠️</span>
            <h3 className="text-lg font-semibold text-destructive">Código não encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">Entre em contato com o suporte.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10 px-1 sm:px-0">
      <DashboardTitleCard title="Programa de Indicação" icon={<Gift className="h-4 w-4 sm:h-5 sm:w-5" />} />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 dark:from-emerald-700 dark:via-emerald-600 dark:to-teal-600 p-6 sm:p-8 text-white shadow-xl">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute top-4 right-4 opacity-10">
          <Gift className="h-24 w-24" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-sm font-medium text-white/90 uppercase tracking-wider">Indique e Ganhe</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold mb-1">
            Compartilhe e ganhem{' '}
            <span className="text-yellow-300">
              {isLoading ? '...' : formatCurrency(bonusAmount)}
            </span>{' '}
            cada um!
          </h2>
          <p className="text-white/80 text-sm sm:text-base max-w-lg">
            Convide amigos para a plataforma. Quando se cadastrarem, vocês dois recebem bônus!
          </p>

          {/* Referral Link */}
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <span className="text-sm truncate flex-1 font-mono text-white/90">{referralLink}</span>
              <button
                onClick={() => copyToClipboard(referralLink)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all flex-shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={shareOnWhatsApp} size="sm" className="bg-[#25D366] hover:bg-[#20BA5A] text-white border-0 rounded-lg">
              <MessageCircle className="h-4 w-4 mr-1.5" />
              WhatsApp
            </Button>
            <Button onClick={shareOnTelegram} size="sm" className="bg-[#0088cc] hover:bg-[#006699] text-white border-0 rounded-lg">
              <Send className="h-4 w-4 mr-1.5" />
              Telegram
            </Button>
            <Button onClick={() => copyToClipboard(referralCode)} size="sm" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-lg">
              <Share2 className="h-4 w-4 mr-1.5" />
              Código: {referralCode}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all group">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Valor por Indicação</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {isLoading ? '...' : formatCurrency(bonusAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all group">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Indicados</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">{referralEarnings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all group">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total Ganho</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">{formatCurrency(totalBonus)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all group">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Gift className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Bônus Pagos</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">{referralEarnings.filter(e => e.status === 'paid').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Como Funciona */}
      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Como Funciona
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', icon: Share2, title: 'Compartilhe', desc: 'Envie seu link de indicação para amigos' },
              { step: '2', icon: UserPlus, title: 'Cadastro', desc: 'Seu amigo se cadastra na plataforma' },
              { step: '3', icon: Gift, title: 'Ganhem', desc: `Ambos recebem ${formatCurrency(bonusAmount)} de bônus` },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{item.step}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">Histórico de Indicações</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {referralEarnings.length} {referralEarnings.length === 1 ? 'indicação' : 'indicações'} registradas
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={loadReferralData} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-9 h-9 bg-muted rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted rounded w-28" />
                    <div className="h-3 bg-muted rounded w-20" />
                  </div>
                  <div className="h-4 bg-muted rounded w-16" />
                </div>
              ))}
            </div>
          ) : referralEarnings.length > 0 ? (
            <div className="space-y-2">
              {referralEarnings.map((earning) => (
                <div key={earning.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {earning.referred_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{earning.referred_name || 'Usuário indicado'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(earning.created_at)}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-xs">
                    +{formatCurrency(earning.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-muted/80 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <h4 className="text-sm font-medium text-foreground mb-1">Nenhuma indicação ainda</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Compartilhe seu link e comece a ganhar {formatCurrency(bonusAmount)} por indicação!
              </p>
              <Button onClick={() => copyToClipboard(referralLink)} size="sm" variant="outline" className="rounded-lg">
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copiar Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Indique;
