'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { WSMessage } from '@/types';

const WS_URL      = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001';
const API_URL     = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const MAX_RECONNECTS    = 4;
const RECONNECT_BASE_MS = 1_500; // doubles each attempt: 1.5s → 3s → 6s → 12s
const POLL_INTERVAL_MS  = 3_000; // fallback polling interval

export function useWebSocket(onComplete?: (assignmentId: string) => void) {
  const {
    pendingJob,
    setGeneratingStep,
    updateAssignmentStatus,
    addToast,
    setPendingJob,
  } = useAppStore();

  const wsRef          = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimer      = useRef<ReturnType<typeof setInterval> | null>(null);
  const destroyed      = useRef(false);

  /* ── Polling fallback ─────────────────────────────────────────────────── */
  const startPolling = useCallback(
    (assignmentId: string) => {
      if (pollTimer.current) return; // already polling

      console.log('[WS] Starting polling fallback for assignment', assignmentId);

      pollTimer.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/api/assignments/${assignmentId}`);
          if (!res.ok) return;
          const json = await res.json();
          const a = json.data;
          if (!a) return;

          if (a.status === 'completed' && a.paper) {
            clearInterval(pollTimer.current!);
            pollTimer.current = null;
            updateAssignmentStatus(assignmentId, 'completed', a.paper);
            setPendingJob(null);
            onComplete?.(assignmentId);
          } else if (a.status === 'failed') {
            clearInterval(pollTimer.current!);
            pollTimer.current = null;
            updateAssignmentStatus(assignmentId, 'failed');
            addToast('Generation failed. Please try again.', 'error');
            setPendingJob(null);
          }
        } catch {
          // network error — keep polling
        }
      }, POLL_INTERVAL_MS);
    },
    [updateAssignmentStatus, setPendingJob, addToast, onComplete],
  );

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  /* ── WebSocket connection ─────────────────────────────────────────────── */
  const connect = useCallback(
    (jobId: string, assignmentId: string) => {
      if (destroyed.current) return;

      try {
        const ws = new WebSocket(`${WS_URL}/ws?jobId=${jobId}`);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectCount.current = 0; // reset on successful connect
          stopPolling();             // WS is working — stop polling if it was running
          console.log(`[WS] Connected (job: ${jobId})`);
        };

        ws.onmessage = (event) => {
          try {
            const msg: WSMessage = JSON.parse(event.data as string);

            switch (msg.event) {
              case 'connected':
                // Server acknowledged connection
                break;

              case 'job:step':
                setGeneratingStep(msg.data.stepIndex);
                break;

              case 'job:completed':
                stopPolling();
                updateAssignmentStatus(assignmentId, 'completed', msg.data.paper);
                setPendingJob(null);
                ws.close();
                onComplete?.(assignmentId);
                break;

              case 'job:failed':
                stopPolling();
                updateAssignmentStatus(assignmentId, 'failed', undefined, msg.data.error);
                addToast(`Generation failed: ${msg.data.error}`, 'error');
                setPendingJob(null);
                ws.close();
                break;
            }
          } catch (err) {
            console.error('[WS] Failed to parse message:', err);
          }
        };

        ws.onerror = () => {
          // onclose fires immediately after, which handles reconnect
        };

        ws.onclose = (event) => {
          if (destroyed.current) return;

          const isClean = event.wasClean;
          console.log(`[WS] Disconnected (clean: ${isClean}, code: ${event.code})`);

          // Don't reconnect if job already finished (pendingJob cleared)
          if (!useAppStore.getState().pendingJob) return;

          if (!isClean && reconnectCount.current < MAX_RECONNECTS) {
            const delay = RECONNECT_BASE_MS * 2 ** reconnectCount.current;
            reconnectCount.current += 1;
            console.log(
              `[WS] Reconnecting in ${delay}ms (attempt ${reconnectCount.current}/${MAX_RECONNECTS})`,
            );
            reconnectTimer.current = setTimeout(() => connect(jobId, assignmentId), delay);
          } else {
            // All reconnect attempts exhausted — fall back to HTTP polling
            console.warn('[WS] Max reconnects reached — switching to polling fallback');
            startPolling(assignmentId);
          }
        };
      } catch (err) {
        console.error('[WS] Failed to create WebSocket:', err);
        startPolling(assignmentId);
      }
    },
    [
      setGeneratingStep,
      updateAssignmentStatus,
      setPendingJob,
      addToast,
      onComplete,
      startPolling,
      stopPolling,
    ],
  );

  /* ── Effect: open/close socket when pendingJob changes ───────────────── */
  useEffect(() => {
    if (!pendingJob) return;

    destroyed.current      = false;
    reconnectCount.current = 0;

    const { jobId, assignmentId } = pendingJob;
    connect(jobId, assignmentId);

    return () => {
      destroyed.current = true;

      // Clear timers
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      stopPolling();

      // Close socket
      const ws = wsRef.current;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
      wsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingJob?.jobId]);
}
