import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HealthStatus } from './HealthStatus';

function mockFetch(response: Partial<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('HealthStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the relative /api/health endpoint and shows the server status', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', version: '1.2.3', dataDir: '/data' }),
    });

    render(<HealthStatus />);

    expect(screen.getByText(/checking server/i)).toBeInTheDocument();
    expect(await screen.findByText(/server: ok/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.2\.3/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/health', expect.anything());
  });

  it('shows an error when the health check fails', async () => {
    mockFetch({ ok: false, status: 500 });

    render(<HealthStatus />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/HTTP 500/);
  });
});
