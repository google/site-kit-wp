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
 * Query parameter that triggers the test error.
 */
const TRIGGER_PARAM = 'googlesitekit-otel-test';

/**
 * Throws a deliberate error so the reporting pipeline can be exercised.
 *
 * Proof-of-concept affordance. Error reporting is the one feature that cannot
 * be verified by using the product normally — you need a bug to observe it,
 * and waiting for a real one is not a test plan. Sentry ships the same thing
 * as its "send test event" button.
 *
 * Renders nothing unless reporting is enabled *and* the trigger parameter is
 * present, so it is inert during ordinary use. It throws during render, which
 * is what puts it in front of the ErrorHandler boundary above it rather than
 * merely calling the reporter directly — the point is to test the real path,
 * not a shortcut through it.
 *
 * @since n.e.x.t
 *
 * @return {null} Never returns when triggered.
 */
export default function OTLPTestError() {
	if ( ! isErrorReportingEnabled() ) {
		return null;
	}

	// eslint-disable-next-line sitekit/acronym-case
	const params = new URLSearchParams( global.location?.search || '' );

	if ( params.get( TRIGGER_PARAM ) !== '1' ) {
		return null;
	}

	throw new TypeError(
		"Deliberate test error from OTLPTestError: cannot read properties of null (reading 'otlpTestPayload')"
	);
}
