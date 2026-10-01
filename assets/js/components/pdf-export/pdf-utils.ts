/**
 * PDF export utilities.
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

// The `es5` target leaves `Intl.DateTimeFormat.prototype.formatRange` untyped.
/// <reference lib="es2021.intl" />

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getLocale, isValidDateString, stringToDate } from '@/js/util';

// The characters Windows, macOS and Linux reject in filenames.
// eslint-disable-next-line no-control-regex
const RESERVED_FILENAME_CHARACTERS = /[\\/:*?"<>|\u0000-\u001f\u007f]/g;

/**
 * Extracts the host (e.g. "www.example.com") from the reference site URL.
 *
 * @since 1.182.0
 * @since n.e.x.t Moved from `PDFHeader` and added the `fallback` parameter.
 *
 * @param siteURL    The reference site URL.
 * @param [fallback] Value returned when the URL cannot be parsed, defaults to `siteURL`.
 * @return The host, or the fallback when the URL cannot be parsed.
 */
export function getSiteHost(
	siteURL: string,
	fallback: string = siteURL
): string {
	try {
		return new URL( siteURL ).host;
	} catch {
		return fallback;
	}
}

/**
 * Formats a `YYYY-MM-DD` date range as a localized short date range, e.g.
 * "Mar 1 – 7, 2026".
 *
 * @since n.e.x.t
 *
 * @param startDate The first day of the range, as `YYYY-MM-DD`.
 * @param endDate   The last day of the range, as `YYYY-MM-DD`.
 * @return The localized range, or an empty string when either date is invalid.
 */
function formatDateRange( startDate: string, endDate: string ): string {
	if ( ! isValidDateString( startDate ) || ! isValidDateString( endDate ) ) {
		return '';
	}

	return new Intl.DateTimeFormat( getLocale(), {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	} ).formatRange( stringToDate( startDate ), stringToDate( endDate ) );
}

/**
 * Builds a filesystem-safe PDF filename for the dashboard export, in the form
 * `Site Kit Dashboard - example.com - Mar 1 – 7, 2026.pdf`.
 *
 * @since 1.181.0
 * @since n.e.x.t Takes the site URL and the report dates instead of the site name and date range slug.
 *
 * @param siteURL             The reference site URL.
 * @param dateRange           The report date range.
 * @param dateRange.startDate The first day of the range, as `YYYY-MM-DD`.
 * @param dateRange.endDate   The last day of the range, as `YYYY-MM-DD`.
 * @return The composed filename.
 */
export function getPDFFilename(
	siteURL: string,
	{ startDate, endDate }: { startDate: string; endDate: string }
): string {
	const segments = [
		__( 'Site Kit Dashboard', 'google-site-kit' ),
		getSiteHost( siteURL, '' ) || 'report',
	];

	const formattedDateRange = formatDateRange( startDate, endDate );
	if ( formattedDateRange ) {
		segments.push( formattedDateRange );
	}

	const name = segments
		.join( ' - ' )
		.replace( RESERVED_FILENAME_CHARACTERS, '' )
		.replace( /\s+/g, ' ' )
		// Windows drops trailing dots and spaces from filenames.
		.replace( /[. ]+$/, '' );

	return `${ name }.pdf`;
}

/**
 * Triggers a browser download for the given blob URL by creating a temporary
 * anchor element with the `download` attribute, clicking it programmatically,
 * and removing it from the DOM.
 *
 * @since 1.181.0
 *
 * @param  url      Blob URL pointing to the generated file.
 * @param  filename Suggested filename for the downloaded file.
 * @return {void}
 */
export function triggerDownload( url: string, filename: string ): void {
	const link = global.document.createElement( 'a' );
	link.href = url;
	link.download = filename;
	link.rel = 'noopener';
	link.style.display = 'none';
	global.document.body.appendChild( link );
	link.click();
	global.document.body.removeChild( link );
}
