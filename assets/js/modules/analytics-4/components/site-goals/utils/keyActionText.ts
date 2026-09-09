/**
 * Site Goals Key action event type and caption.
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
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * The ecommerce event a Site Goals Key action tile counts.
 *
 * @since n.e.x.t
 */
export type EcommerceKeyActionEvent = 'purchase' | 'add_to_cart';

/**
 * Builds the caption that names the GA4 events behind the Site Goals lead
 * generation Key action total.
 *
 * With no detected event type: output "No event types".
 * With one detected event type: output the event name (eg. `“contact” events`).
 * With several event types: output the number of event types (eg. `2 event types`).
 *
 * @since n.e.x.t
 *
 * @param {Array<string>} detectedLeadEvents The lead events the Key action total counts.
 * @return {string} The caption under the Key action total, such as "“contact” events", "2 event types", or "No event types".
 */
export function getLeadEventsSubtitle( detectedLeadEvents: string[] ): string {
	if ( detectedLeadEvents.length === 0 ) {
		return __( 'No event types', 'google-site-kit' );
	}

	if ( detectedLeadEvents.length === 1 ) {
		return sprintf(
			/* translators: %s: GA4 event name, e.g. "contact". */
			__( '“%s” events', 'google-site-kit' ),
			detectedLeadEvents[ 0 ]
		);
	}

	// Only two or more events reach here, so English never sees the singular.
	// We still pass the real count, because some languages have more than two
	// plural forms and `_n` picks between them by count.
	return sprintf(
		/* translators: %d: number of detected event types, e.g. 2. */
		_n(
			'%d event type',
			'%d event types',
			detectedLeadEvents.length,
			'google-site-kit'
		),
		detectedLeadEvents.length
	);
}
