/**
 * OTLP log record construction.
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
import {
	MAX_MESSAGE_CHARS,
	MAX_STACK_CHARS,
	SCOPE_NAME,
	SCOPE_VERSION,
	SEVERITY_ERROR,
} from './constants';
import { getFingerprint, getFingerprintInput } from './fingerprint';

/**
 * This module builds OTLP by hand rather than through the OpenTelemetry
 * JavaScript SDK. The logs SDK is still marked experimental and browser
 * instrumentation is explicitly unspecified, and the full web SDK would add
 * tens of kilobytes to a bundle that is already a sore point. OTLP itself is
 * a documented JSON shape, so producing it directly costs a few dozen lines
 * and keeps every benefit that matters: the records are standard, and the
 * backend can be changed without touching a single call site.
 */

type AttributeValue = string | number | boolean | undefined | null;

interface OTLPAttribute {
	key: string;
	value: Record< string, AttributeValue >;
}

export interface ErrorReportContext {
	source: string;
	viewContext?: string;
	componentStack?: string;
	extra?: Record< string, AttributeValue >;
}

export interface ResourceConfig {
	pluginVersion?: string;
	siteURL?: string;
	wpVersion?: string;
	phpVersion?: string;
	isMultisite?: boolean;
	activeModules?: string[];
	enabledFeatures?: string[];
	isAuthenticated?: boolean | number;
}

/**
 * Wraps a value in the OTLP `AnyValue` shape.
 *
 * @since n.e.x.t
 *
 * @param {*} value Value to wrap.
 * @return {Object|null} OTLP value object, or null when unrepresentable.
 */
function toAnyValue( value: AttributeValue ) {
	if ( value === undefined || value === null || value === '' ) {
		return null;
	}

	if ( typeof value === 'boolean' ) {
		return { boolValue: value };
	}

	if ( typeof value === 'number' ) {
		return Number.isInteger( value )
			? { intValue: String( value ) }
			: { doubleValue: value };
	}

	return { stringValue: String( value ) };
}

/**
 * Converts a plain object into an OTLP attribute array, dropping empties.
 *
 * @since n.e.x.t
 *
 * @param {Object} source Key/value pairs.
 * @return {Array} OTLP attributes.
 */
export function toAttributes(
	source: Record< string, AttributeValue >
): OTLPAttribute[] {
	return Object.entries( source ).reduce< OTLPAttribute[] >(
		( attributes, [ key, value ] ) => {
			const anyValue = toAnyValue( value );

			if ( anyValue ) {
				attributes.push( { key, value: anyValue } );
			}

			return attributes;
		},
		[]
	);
}

/**
 * Truncates a string, marking it so a reader knows the value is incomplete.
 *
 * @since n.e.x.t
 *
 * @param {string} value Value to truncate.
 * @param {number} max   Maximum length.
 * @return {string} Possibly truncated value.
 */
function truncate( value: string, max: number ): string {
	if ( typeof value !== 'string' ) {
		return '';
	}

	return value.length > max
		? `${ value.slice( 0, max ) }… [truncated]`
		: value;
}

/**
 * Builds a complete OTLP log record payload for an error.
 *
 * @since n.e.x.t
 *
 * @param {Object} error    The error to report.
 * @param {Object} context  Where and how the error occurred.
 * @param {Object} resource Emitter-level attributes.
 * @return {Object} OTLP `resourceLogs` payload, ready to POST.
 */
export default function createLogRecord(
	error: Error | { name?: string; message?: string; stack?: string },
	context: ErrorReportContext,
	resource: ResourceConfig
) {
	const type = error?.name || 'Error';
	const message = truncate( error?.message || '', MAX_MESSAGE_CHARS );

	// React's component stack is more useful than the JS stack for boundary
	// errors — it survives minification better and names the component tree —
	// so it is preferred for fingerprinting when present.
	const stack = truncate( error?.stack || '', MAX_STACK_CHARS );
	const componentStack = truncate(
		context.componentStack || '',
		MAX_STACK_CHARS
	);
	const fingerprintStack = componentStack || stack;

	return {
		resourceLogs: [
			{
				resource: {
					attributes: toAttributes( {
						'service.name': 'site-kit-wp',
						'service.version': resource.pluginVersion,
						'sitekit.site_url': resource.siteURL,
						'sitekit.wp_version': resource.wpVersion,
						'sitekit.php_version': resource.phpVersion,
						'sitekit.is_multisite': resource.isMultisite,
						'sitekit.is_authenticated': !! resource.isAuthenticated,
						'sitekit.modules_active': (
							resource.activeModules || []
						).join( ',' ),
						'sitekit.features_enabled': (
							resource.enabledFeatures || []
						).join( ',' ),
					} ),
				},
				scopeLogs: [
					{
						scope: { name: SCOPE_NAME, version: SCOPE_VERSION },
						logRecords: [
							{
								// Telemetry records when an error actually
								// happened, so this must be wall-clock time
								// rather than the dashboard's reference date.
								// eslint-disable-next-line sitekit/no-direct-date
								timeUnixNano: `${ Date.now() }000000`,
								severityNumber: SEVERITY_ERROR,
								severityText: 'ERROR',
								body: { stringValue: message },
								attributes: toAttributes( {
									// OpenTelemetry semantic conventions, so
									// any conformant backend understands these
									// without configuration.
									'exception.type': type,
									'exception.message': message,
									'exception.stacktrace': stack,

									'sitekit.error_source': context.source,
									'sitekit.view_context': context.viewContext,
									'sitekit.component_stack': componentStack,
									'sitekit.fingerprint': getFingerprint(
										type,
										message,
										fingerprintStack
									),
									// Carried so grouping rules can be tuned
									// against real data instead of guesses.
									'sitekit.fingerprint_input':
										getFingerprintInput(
											type,
											message,
											fingerprintStack
										),
									'sitekit.user_agent':
										global.navigator?.userAgent,

									...( context.extra || {} ),
								} ),
							},
						],
					},
				],
			},
		],
	};
}
