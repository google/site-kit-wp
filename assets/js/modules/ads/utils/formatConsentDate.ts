/**
 * Consent date formatting helper for the Ads conversion tracking intent.
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
import { getLocale, isValidDateString, stringToDate } from '@/js/util';

/**
 * Formats a `YYYY-MM-DD` consent date as a localized long date, e.g. "July 28, 2026".
 *
 * Returns an empty string for a missing or invalid date, so the caller can
 * leave out the sentence that shows it: showing the wrong date is worse than
 * showing none.
 *
 * @since n.e.x.t
 *
 * @param consentDate The date in `YYYY-MM-DD` format.
 * @return The localized date, or an empty string.
 */
export function formatConsentDate( consentDate?: string ): string {
	if ( ! isValidDateString( consentDate ) ) {
		return '';
	}

	return new Intl.DateTimeFormat( getLocale(), {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	} ).format( stringToDate( consentDate ) );
}
