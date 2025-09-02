/**
 * Storyshots: Ignore Console Messages
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Array of console messages to ignore in Storyshots tests.
 */
export const IGNORE_CONSOLE_MESSAGES = {
	// Ignored everywhere; noise caused by Storyshots navigation/loading.
	global: [
		// Caused by Storyshots plugin loading iframe, unrelated to component logic.
		/net::ERR_ABORTED.*\/iframe\.html/i,
		// Caused by Storyshots navigation during story render cycles.
		/Execution context was destroyed, most likely because of a navigation\./,
	],

	// Expected errors allowed only for specific stories which are there to
	// demonstrate error boundaries.
	// Use regex for storyId (extracted from page.url() ?id=<storyId>).
	// Storybook storyId format example: "components-errorhandler--default"
	byStory: [
		// Components/ErrorHandler › Default
		{
			id: /^components-errorhandler--default$/,
			// Ignore any intentional error thrown to demonstrate the error boundary.
			patterns: [ /.+/ ],
		},

		// Components/ErrorNotice › Default
		{
			id: /^components-errornotice--default$/,
			// Expected caught error; allow all for this story.
			patterns: [ /.+/ ],
		},

		// Components/GoogleChartErrorHandler › Default
		{
			id: /^components-googlecharterrorhandler--default$/,
			patterns: [ /.+/ ],
		},

		// Components/MediaErrorHandler (all variants)
		{
			id: /^components-mediaerrorhandler--.+$/,
			patterns: [ /.+/ ],
		},

		// Components/WidgetErrorHandler › Default
		{
			id: /^components-widgeterrorhandler--default$/,
			patterns: [ /.+/ ],
		},

		// Modules/Analytics 4/.../AudienceSelectionPanel › Insufficient permissions error
		{
			// Be flexible about "analytics-4" vs "analytics 4" canonicalization in titles.
			id: /^modules-analytics-?4-.*audience-selection-panel--insufficient-permissions-error$/,
			patterns: [
				/Google Site Kit API Error.*datapoint:sync-audiences/i,
			],
		},
	],

	// TEMPORARY: allow known errors tracked in #11324 to unblock merging.
	// TODO: In ticket #11324: Remove each of these as the underlying issues are fixed.
	temporaryGlobal: [
		/Fetch API cannot load file/,
		/You are probably offline/,
		/TypeError:\s+notifications\.reduce is not a function/,
		/Error:\s+`initialFocus`\s+as selector refers to no known node/,
		/TypeError:\s+Cannot read (?:properties|property) of undefined \(reading 'includes'\)/,
		/Invariant Violation:\s+Options for Search Console report must be an object\./,
	],
};

/**
 * Normalizes a Puppeteer console/page message for robust matching.
 *
 * @since n.e.x.t
 *
 * @param {string} message Raw message text to normalize.
 * @return {string} Normalized message text.
 */
export function normalizeMessage( message ) {
	return String( message )
		.replace( /JSHandle@(?:error|object)\s*/g, '' )
		.trim();
}

/**
 * Checks whether the given text matches any of the provided patterns.
 *
 * @since n.e.x.t
 *
 * @param {string}   text     Text to test.
 * @param {RegExp[]} patterns Array of regular expressions to test against.
 * @return {boolean} True if any pattern matches; otherwise false.
 */
export function matchesAny( text, patterns ) {
	return patterns.some( ( rx ) => rx.test( text ) );
}

/**
 * Determines whether the given message should be ignored globally or for a given story.
 *
 * @since n.e.x.t
 *
 * @param {string} rawMessage Raw message text.
 * @param {string} storyID    Storybook story ID (e.g. "components-errorhandler--default").
 * @return {boolean} True if the message should be ignored; otherwise false.
 */
export function isIgnored( rawMessage, storyID ) {
	const text = normalizeMessage( rawMessage );

	// Global errors to ignore.
	if ( matchesAny( text, IGNORE_CONSOLE_MESSAGES.global ) ) {
		return true;
	}

	// Temporary global suppressions for #11324.
	// TODO:: Remove in 11324 block below once fixed.
	if ( matchesAny( text, IGNORE_CONSOLE_MESSAGES.temporaryGlobal ) ) {
		return true;
	}

	// Story-scoped expected errors.
	if ( storyID ) {
		for ( const entry of IGNORE_CONSOLE_MESSAGES.byStory ) {
			if (
				entry.id.test( storyID ) &&
				matchesAny( text, entry.patterns )
			) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Extracts story ID from the current Storybook URL (?id=<storyId>).
 *
 * @since n.e.x.t
 *
 * @param {string} url Full storybook URL.
 * @return {string|null} Story ID if found; otherwise null.
 */
export function getStoryIDFromURL( url ) {
	try {
		const u = new URL( url );
		return u.searchParams.get( 'id' );
	} catch ( e ) {
		return null;
	}
}
