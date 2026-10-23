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
import createLogRecord, { ErrorContext } from './createLogRecord';

// Added by PHP to the tracking inline data (see `Core\Telemetry\Telemetry`).
export interface TelemetryConfig {
	otlpEndpoint: string;
	otlpResource: { wpVersion?: string; phpVersion?: string };
}

// PHP only provides an endpoint to users who have consented to tracking, so an
// empty endpoint means reporting is off.
const {
	otlpEndpoint = '',
	otlpResource = {},
	referenceSiteURL = '',
	activeModules = [],
} = global._googlesitekitTrackingData || {};

const resource = {
	pluginVersion: global.GOOGLESITEKIT_VERSION,
	siteURL: referenceSiteURL,
	wpVersion: otlpResource.wpVersion,
	phpVersion: otlpResource.phpVersion,
	activeModules,
	enabledFeatures: Array.from( enabledFeatures || [] ),
};

/**
 * Determines whether error reporting is active.
 *
 * @since n.e.x.t
 *
 * @return {boolean} True when errors will be reported.
 */
export function isErrorReportingEnabled(): boolean {
	return !! otlpEndpoint;
}

/**
 * Reports an error as an OTLP log record.
 *
 * Fires and forgets: never throws, and never delays rendering.
 *
 * @since n.e.x.t
 *
 * @param {Error}  error   The error to report.
 * @param {Object} context Where the error occurred.
 * @return {void}
 */
export function reportError( error: Error, context: ErrorContext ): void {
	if ( ! otlpEndpoint || ! error ) {
		return;
	}

	try {
		global
			.fetch( `${ otlpEndpoint }/v1/logs`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(
					createLogRecord( error, context, resource )
				),
				// Lets the request outlive the page, since errors are often
				// followed by a reload.
				keepalive: true,
				credentials: 'omit',
			} )
			.catch( () => {} );
	} catch ( reportingError ) {
		// Reporting an error must never cause one.
	}
}
