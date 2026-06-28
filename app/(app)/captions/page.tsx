import { getPrimaryAccount } from '@/lib/db/accounts';
import { getAccountPillars, getActiveBrandVoice } from '@/lib/db/ai';
import { isAiConfigured } from '@/lib/ai';
import { CaptionGenerator } from '@/components/CaptionGenerator';
import { mockPillars } from '@/lib/mock/data';

export const dynamic = 'force-dynamic';

export default async function CaptionsPage() {
  const primary = await getPrimaryAccount();
  const realPillars = primary?.account ? await getAccountPillars(primary.account.id) : [];
  const pillars =
    realPillars.length > 0
      ? realPillars.map((p) => ({ key: p.key, label: p.label }))
      : mockPillars.map((p) => ({ key: p.key, label: p.label }));
  const hasVoice = primary?.account ? Boolean(await getActiveBrandVoice(primary.account.id)) : false;

  return <CaptionGenerator pillars={pillars} aiReady={isAiConfigured()} hasVoice={hasVoice} />;
}
