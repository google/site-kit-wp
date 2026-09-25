/**
 * OpenTelemetry error reporting.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Internal dependencies
 */
import { enabledFeatures } from '@/js/features/index';
import createLogRecord, {
	ErrorReportContext,
	ResourceConfig,
} from './createLogRecord';
import { getFingerprint } from './fingerprint';
import sendLogRecord from './sendLogRecord';

/**
 * Configuration arrives through the same inline-data channel that powers
 * `trackEvent`, so there is one place where Site Kit tells the browser what it
 * is allowed to report. `otlpEndpoint` is only populated by PHP when the site
 * has defined GOOGLESITEKIT_OTLP_ENDPOINT *and* the user has consented, so an
 * empty value here is the single off switch.
 */
const {
	otlpEndpoint = '',
	otlpResource = {},
	referenceSiteURL = '',
	activeModules = [],
	isAuthenticated,
} = global._googlesitekitTrackingData || {};

const resource: ResourceConfig = {
	pluginVersion: global.GOOGLESITEKIT_VERSION,
	siteURL: referenceSiteURL,
	wpVersion: otlpResource.wpVersion,
	phpVersion: otlpResource.phpVersion,
	isMultisite: otlpResource.isMultisite,
	activeModules,
	enabledFeatures: Array.from( enabledFeatures || [] ),
	isAuthenticated,
};

/**
 * Fingerprints already reported in this page load.
 *
 * A React render loop can throw the same error hundreds of times a second, and
 * the hundredth copy tells us nothing the first did not. Deduplicating here
 * costs nothing and removes the most likely way a single broken install could
 * flood the ingest — client-side volume control to complement the server-side
 * sampling that the collector owns.
 */
const reportedFingerprints = new Set< string >();

/**
 * Upper bound on distinct errors reported per page load.
 *
 * Guards against a pathological case where errors are unique every time (for
 * instance a message containing a timestamp), which would defeat the
 * deduplication above.
 */
const MAX_REPORTS_PER_PAGE = 25;

/**
 * Determines whether error reporting is currently active.
 *
 * @since n.e.x.t
 *
 * @return {boolean} True when errors will be reported.
 */
export function isErrorReportingEnabled(): boolean {
	return !! otlpEndpoint;
}

/**
 * Reports an error over OTLP.
 *
 * Fires and forgets: never throws, never blocks rendering, and resolves nothing.
 * Callers should treat it exactly as they treat `trackEvent`.
 *
 * @since n.e.x.t
 *
 * @param {Object} error   The error to report.
 * @param {Object} context Where and how it occurred.
 * @return {void}
 */
export function reportError(
	error: Error | { name?: string; message?: string; stack?: string },
	context: ErrorReportContext
): void {
	if ( ! isErrorReportingEnabled() || ! error ) {
		return;
	}

	try {
		const fingerprint = getFingerprint(
			error.name || 'Error',
			error.message || '',
			context?.componentStack || error.stack || ''
		);

		if ( reportedFingerprints.has( fingerprint ) ) {
			return;
		}

		if ( reportedFingerprints.size >= MAX_REPORTS_PER_PAGE ) {
			return;
		}

		reportedFingerprints.add( fingerprint );

		sendLogRecord(
			otlpEndpoint,
			createLogRecord( error, context, resource )
		);
	} catch ( reportingError ) {
		// Reporting an error must never produce one.
	}
}

export { ERROR_SOURCE } from './constants';
