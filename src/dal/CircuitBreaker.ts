/**
 * Circuit Breaker
 * Implements circuit breaker pattern for DAL connectors
 * Prevents cascading failures and enables automatic recovery
 */

import { CircuitBreakerOptions, CircuitBreakerState } from './types';

export class CircuitBreaker {
  private state: CircuitBreakerState = {
    state: 'CLOSED',
    failures: 0
  };
  
  private readonly options: CircuitBreakerOptions;
  private onStateChange?: (state: CircuitBreakerState) => void;

  constructor(options: CircuitBreakerOptions, onStateChange?: (state: CircuitBreakerState) => void) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 60000, // 1 minute
      ...options
    };
    this.onStateChange = onStateChange;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state.state = 'HALF_OPEN';
        this.notifyStateChange();
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.state.failures = 0;
    
    if (this.state.state === 'HALF_OPEN') {
      this.state.state = 'CLOSED';
      this.state.nextAttemptTime = undefined;
      this.notifyStateChange();
    }
  }

  private onFailure(): void {
    this.state.failures += 1;
    this.state.lastFailureTime = new Date();

    if (this.state.failures >= this.options.failureThreshold) {
      this.state.state = 'OPEN';
      this.state.nextAttemptTime = new Date(Date.now() + this.options.resetTimeout);
      this.notifyStateChange();
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.state.nextAttemptTime) {
      return false;
    }
    
    return Date.now() >= this.state.nextAttemptTime.getTime();
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      state: 'CLOSED',
      failures: 0
    };
    this.notifyStateChange();
  }

  forceOpen(): void {
    this.state = {
      state: 'OPEN',
      failures: this.options.failureThreshold,
      lastFailureTime: new Date(),
      nextAttemptTime: new Date(Date.now() + this.options.resetTimeout)
    };
    this.notifyStateChange();
  }

  isCallAllowed(): boolean {
    return this.state.state !== 'OPEN' || this.shouldAttemptReset();
  }

  getMetrics(): {
    state: string;
    failures: number;
    failureRate: number;
    timeToNextAttempt?: number;
  } {
    const timeToNextAttempt = this.state.nextAttemptTime 
      ? Math.max(0, this.state.nextAttemptTime.getTime() - Date.now())
      : undefined;

    return {
      state: this.state.state,
      failures: this.state.failures,
      failureRate: this.state.failures / this.options.failureThreshold,
      timeToNextAttempt
    };
  }
}