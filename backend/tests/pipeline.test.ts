import { describe, expect, it } from 'vitest';
import { runPipeline } from '../src/processors/pipeline';

const header = 'service_id,service_name,timestamp,status_code,latency,latency_unit,agent,region';

describe('runPipeline', () => {
  it('parses, cleans, and summarizes a small mixed-quality CSV', () => {
    const rows = [
      header,
      'svc-auth,auth-api,2025-05-13T12:45:00Z,200,150,ms,agent-1,ap-south-1', // clean
      'svc-auth,auth-api,2025-05-13T13:00:00Z,999,116,ms,agent-1,ap-south-1', // invalid status
      'svc-payments,payments-api,2025-05-13T13:15:00Z,200,,ms,agent-1,ap-south-1', // missing latency
      'svc-notify,notify-worker,2025-05-13T13:30:00Z,200,-296,ms,agent-1,ap-south-1', // negative latency
      'svc-search,search-api,2025-05-13T13:45:00Z,200,0.486,s,agent-1,ap-south-1', // seconds -> ms
      'svc-search,search-api,2025-05-13T13:45:00Z,200,0.486,s,agent-1,ap-south-1', // exact duplicate of prior row
      'svc-search,search-api,2025-05-13T13:45:00Z,200,0.512,s,agent-2,ap-south-1', // different agent, same slot: kept
      'svc-unknown,mystery-api,2025-05-13T14:00:00Z,200,100,ms,agent-1,ap-south-1', // unknown service: rejected
    ].join('\n');

    const { summary, rows: cleaned } = runPipeline('test.csv', rows);

    expect(summary.totalRows).toBe(8);
    expect(summary.rejectedRows).toBe(1);
    expect(summary.duplicateRows).toBe(1);
    expect(summary.acceptedRows).toBe(6);
    expect(summary.dataQuality).toEqual({
      invalidStatus: 1,
      latencyMissing: 1,
      latencyInvalid: 1,
    });

    const search = cleaned.find((r) => r.serviceId === 'svc-search' && r.agent === 'agent-1');
    expect(search?.latencyMs).toBe(486);

    const bothAgentsPresent = cleaned.filter((r) => r.serviceId === 'svc-search');
    expect(bothAgentsPresent).toHaveLength(2);
  });
});
