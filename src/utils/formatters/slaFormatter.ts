import { ZendeskSLAMetric } from '../../types/resources';

const SLA_METRIC_NAMES: Record<string, string> = {
  first_reply_time: 'First Reply Time',
  next_reply_time: 'Next Reply Time',
  requester_wait_time: 'Requester Wait Time',
  agent_work_time: 'Agent Work Time',
  pausable_update_time: 'Pausable Update Time',
  periodic_update_time: 'Periodic Update Time',
  group_ownership_time: 'Group Ownership Time',
};

export function formatSLAMetricName(metric: string): string {
  if (!metric) return '';
  return SLA_METRIC_NAMES[metric.toLowerCase()] || metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function formatSLAMetric(item: ZendeskSLAMetric): string {
  if (!item) return '';

  const priority = item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : 'Any';
  const metricName = formatSLAMetricName(item.metric);
  
  let targetText = `${item.target} min`;
  if (item.target >= 60 && item.target % 60 === 0) {
    targetText += ` (${item.target / 60} hrs)`;
  } else if (item.target >= 60) {
    const hrs = Math.floor(item.target / 60);
    const mins = item.target % 60;
    targetText += ` (${hrs}h ${mins}m)`;
  }

  const bhText = item.business_hours ? 'Business Hours: Yes' : 'Business Hours: No (Calendar)';

  return `Priority: ${priority} | Metric: ${metricName} | Target: ${targetText} | ${bhText}`;
}

export function formatSLAMetricsList(metrics?: ZendeskSLAMetric[]): string {
  if (!metrics || !Array.isArray(metrics) || metrics.length === 0) return '';
  return metrics.map((m, idx) => `${idx + 1}. ${formatSLAMetric(m)}`).join('\n');
}
