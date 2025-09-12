/**
 * Proxy module for @wordpress/e2e-test-utils overriding activatePlugin.
 *
 * It re-exports everything from the original package, but replaces
 * the activatePlugin export with our instrumented implementation that
 * includes console.debug tracing for diagnosing CI timeouts.
 */

// Re-export everything from the original package first.
export * from '@wordpress/e2e-test-utils';

// Then override/augment with our custom activatePlugin implementation.
export { activatePlugin } from './activate-plugin';
