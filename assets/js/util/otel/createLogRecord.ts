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

export interface ErrorContext {
	viewContext?: string;
	componentStack?: string;
}

export interface Resource {
	pluginVersion?: string;
	siteURL?: string;
	wpVersion?: string;
	phpVersion?: string;
	activeModules?: string[];
	enabledFeatures?: string[];
}

/**
 * Converts key/value pairs to OTLP attributes, dropping empty values.
 *
 * @since n.e.x.t
 *
 * @param {Object} source Key/value pairs.
 * @return {Array} OTLP attributes.
 */
function toAttributes( source: Record< string, string | undefined > ) {
	return Object.entries( source )
		.filter( ( entry ): entry is [ string, string ] => !! entry[ 1 ] )
		.map( ( [ key, value ] ) => ( {
			key,
			value: { stringValue: value },
		} ) );
}

/**
 * Builds an OTLP logs payload for an error.
 *
 * The attribute names are the contract with the service, which reads them to
 * shape records for Google Cloud.
 *
 * @since n.e.x.t
 *
 * @param {Error}  error    The error to report.
 * @param {Object} context  Where the error occurred.
 * @param {Object} resource The environment the error occurred in.
 * @return {Object} OTLP `resourceLogs` payload.
 */
export default function createLogRecord(
	error: Error,
	context: ErrorContext,
	resource: Resource
) {
	const message = error?.message || String( error );

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
						'sitekit.modules_active':
							resource.activeModules?.join( ',' ),
						'sitekit.features_enabled':
							resource.enabledFeatures?.join( ',' ),
					} ),
				},
				scopeLogs: [
					{
						scope: { name: 'sitekit.browser' },
						logRecords: [
							{
								// The time the error happened, not the
								// dashboard's reference date.
								// eslint-disable-next-line sitekit/no-direct-date
								timeUnixNano: `${ Date.now() }000000`,
								// 17 is ERROR in the OpenTelemetry log data model.
								severityNumber: 17,
								severityText: 'ERROR',
								body: { stringValue: message },
								attributes: toAttributes( {
									'exception.type': error?.name,
									'exception.message': message,
									'exception.stacktrace': error?.stack,
									'sitekit.view_context': context.viewContext,
									'sitekit.component_stack':
										context.componentStack,
									'sitekit.user_agent':
										global.navigator?.userAgent,
								} ),
							},
						],
					},
				],
			},
		],
	};
}
