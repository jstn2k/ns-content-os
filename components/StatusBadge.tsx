import { Badge } from './ui/badge';
import { STATUS_LABELS, type MockQueueStatus } from '@/lib/mock/data';

const VARIANT: Record<MockQueueStatus, 'default' | 'success' | 'warning' | 'destructive' | 'accent'> = {
  draft: 'default',
  needs_review: 'warning',
  approved: 'accent',
  scheduled: 'accent',
  published: 'success',
  failed: 'destructive',
};

export function StatusBadge({ status }: { status: MockQueueStatus }) {
  return <Badge variant={VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}
