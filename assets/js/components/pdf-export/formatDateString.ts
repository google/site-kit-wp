/**
 * Date string formatting helper for PDF export.
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
 * Formats a `YYYY-MM-DD` date as a localized short date, e.g. "Jan 1, 2021".
 *
 * Returns an empty string for missing/invalid input: `stringToDate` throws on a
 * non-`YYYY-MM-DD` string, which would otherwise abort the whole PDF render.
 *
 * @since 1.182.0
 * @since 1.184.0 Moved from `PDFHeader` to a shared helper for use in other PDF components.
 *
 * @param dateString The date in `YYYY-MM-DD` format.
 * @return The localized date, or an empty string.
 */
export function formatDateString( dateString: string ): string {
	if ( ! isValidDateString( dateString ) ) {
		return '';
	}

	return new Intl.DateTimeFormat( getLocale(), {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	} ).format( stringToDate( dateString ) );
}
