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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { formatDateRange } from './formatDateString';

// The printable characters Windows, macOS and Linux reject in filenames.
const RESERVED_FILENAME_CHARACTERS = /[\\/:*?"<>|]/g;

/**
 * Checks whether a character is a control character (U+0000–U+001F or
 * U+007F), which filesystems also reject in filenames.
 *
 * @since n.e.x.t
 *
 * @param {string} character A single character.
 * @return {boolean} Whether the character is a control character.
 */
function isControlCharacter( character: string ): boolean {
	const code = character.charCodeAt( 0 );

	return code <= 0x1f || code === 0x7f;
}

/**
 * Extracts the host (e.g. "www.example.com") from the reference site URL.
 *
 * Used for the site address in both the PDF header and the PDF filename.
 *
 * @since 1.182.0
 * @since n.e.x.t Moved from `PDFHeader` and added the `fallback` parameter.
 *
 * @param {string} siteURL            The reference site URL.
 * @param {string} [fallback=siteURL] The value to return when the URL cannot be parsed.
 * @return {string} The host, or `fallback` when the URL cannot be parsed.
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
 * Builds a filesystem-safe PDF filename for the dashboard export, e.g.
 * `Site Kit Dashboard - example.com - Mar 1 – 7, 2026.pdf`.
 *
 * @since 1.181.0
 * @since n.e.x.t Takes the site URL and the report dates instead of the site name and date range slug.
 *
 * @param {string} siteURL             The reference site URL.
 * @param {Object} dateRange           The report date range.
 * @param {string} dateRange.startDate The first day of the range, as `YYYY-MM-DD`.
 * @param {string} dateRange.endDate   The last day of the range, as `YYYY-MM-DD`.
 * @return {string} The composed filename.
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
		// Some locales separate the date parts with `/`, e.g. `2026/09/04` in
		// Japanese, so hyphenate them rather than run the numbers together.
		segments.push(
			formattedDateRange.replace( RESERVED_FILENAME_CHARACTERS, '-' )
		);
	}

	const name = segments
		.join( ' - ' )
		.replace( RESERVED_FILENAME_CHARACTERS, '' )
		.split( '' )
		.filter( ( character ) => ! isControlCharacter( character ) )
		.join( '' )
		.replace( /\s+/g, ' ' )
		// Avoid a dot or space right before the extension, e.g. Hungarian dates end with a dot.
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
