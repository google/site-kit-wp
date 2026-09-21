/**
 * Constants for OpenTelemetry error reporting.
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
 * OTLP path for log records, appended to the configured endpoint.
 *
 * @since n.e.x.t
 */
export const OTLP_LOGS_PATH = '/v1/logs';

/**
 * Instrumentation scope reported with every record.
 *
 * Names the emitter so browser and PHP records can be told apart in the
 * backend without inspecting attributes.
 *
 * @since n.e.x.t
 */
export const SCOPE_NAME = 'sitekit.browser';

/**
 * Emitter version, independent of the plugin version.
 *
 * Lets the payload shape be versioned separately from Site Kit releases,
 * which matters when the backend has to parse records from installs spanning
 * years of plugin versions.
 *
 * @since n.e.x.t
 */
export const SCOPE_VERSION = '0.1.0';

/**
 * OTLP severity number for ERROR.
 *
 * From the OpenTelemetry log data model; 17 is the base ERROR level.
 *
 * @since n.e.x.t
 */
export const SEVERITY_ERROR = 17;

/**
 * Maximum characters kept from a stack trace.
 *
 * Generous compared with the 500-byte GA event label this replaces, but not
 * unbounded: a runaway recursion can produce megabytes of stack, and every
 * install is an untrusted emitter.
 *
 * @since n.e.x.t
 */
export const MAX_STACK_CHARS = 8192;

/**
 * Maximum characters kept from an error message.
 *
 * @since n.e.x.t
 */
export const MAX_MESSAGE_CHARS = 2048;

/**
 * Error sources, recorded as `sitekit.error_source`.
 *
 * @since n.e.x.t
 */
export const ERROR_SOURCE = {
	REACT_BOUNDARY: 'react_boundary',
	UNHANDLED_REJECTION: 'unhandled_rejection',
	UNCAUGHT_EXCEPTION: 'uncaught_exception',
	API: 'api',
} as const;
