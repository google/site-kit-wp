/**
 * OTLPTestError component.
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
import { isErrorReportingEnabled } from '@/js/util/otel';

/**
 * Throws a test error when `?googlesitekit-otel-test=1` is present.
 *
 * Proof-of-concept only. Throwing during render exercises the real
 * `ErrorHandler` path. Renders nothing unless error reporting is enabled.
 *
 * @since n.e.x.t
 *
 * @return {null} Nothing, unless it throws.
 */
export default function OTLPTestError() {
	if ( ! isErrorReportingEnabled() ) {
		return null;
	}

	// eslint-disable-next-line sitekit/acronym-case
	const params = new URLSearchParams( global.location?.search || '' );

	if ( params.get( 'googlesitekit-otel-test' ) !== '1' ) {
		return null;
	}

	throw new TypeError(
		"Deliberate test error from OTLPTestError: cannot read properties of null (reading 'otlpTestPayload')"
	);
}
