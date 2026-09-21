/**
 * OTLP transport.
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
import { OTLP_LOGS_PATH } from './constants';

/**
 * The one rule this file exists to enforce: reporting an error must never
 * cause an error the user can see. Every failure path here is swallowed.
 *
 * Errors frequently coincide with the page being torn down — a crash that
 * triggers a reload, a user navigating away from a broken screen — so the
 * request has to be able to outlive the document. `keepalive` does that, with
 * `sendBeacon` as the fallback where it is unavailable.
 */

/**
 * Posts an OTLP payload to the configured endpoint.
 *
 * @since n.e.x.t
 *
 * @param {string} endpoint Base endpoint URL, without path.
 * @param {Object} payload  OTLP payload.
 * @return {void}
 */
export default function sendLogRecord(
	endpoint: string,
	payload: object
): void {
	if ( ! endpoint ) {
		return;
	}

	const url = `${ endpoint }${ OTLP_LOGS_PATH }`;

	let body: string;

	try {
		body = JSON.stringify( payload );
	} catch ( serializationError ) {
		// A payload that cannot be serialised is not worth reporting about.
		return;
	}

	try {
		if ( typeof global.fetch === 'function' ) {
			global
				.fetch( url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body,
					// Survives page unload, which is exactly when errors tend
					// to be reported.
					keepalive: true,
					// Telemetry must never carry the user's session.
					credentials: 'omit',
					mode: 'cors',
				} )
				// Swallowed deliberately: a failed report is not the user's
				// problem, and an unhandled rejection here would itself be
				// caught by the reporting we are trying to run.
				.catch( () => {} );

			return;
		}

		if ( typeof global.navigator?.sendBeacon === 'function' ) {
			global.navigator.sendBeacon(
				url,
				new Blob( [ body ], { type: 'application/json' } )
			);
		}
	} catch ( transportError ) {
		// Intentionally empty.
	}
}
