/**
 * Content events provider.
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
import { initializePagination } from './content-events/pagination';
import { initializeReadArticle } from './content-events/read-article';
import { initializeVimeo } from './content-events/vimeo';

/** The Content Events configuration published by PHP on the frontend. */
export interface ContentEventsConfig {
	/** ID of the queried post, or `0` when there isn't one. */
	postID: number;
	/** Whether the current request is for a single post. */
	isSinglePost: boolean;
	/** Whether the content rendered a Vimeo embed. */
	hasVimeoEmbed: boolean;
	/** Number of words in the post content this request rendered. */
	wordCount: number;
	/** Estimated reading time for the content this request rendered, in seconds. */
	estimatedReadTimeSeconds: number;
	/** Whether the request renders the post's last page. */
	isLastPageOfMultiPagePost: boolean;
	/** Percentage of the estimated reading time a visitor must stay. */
	readTimeThresholdPercent: number;
	/** Shortest time a visitor must stay, in seconds. */
	minimumReadTimeSeconds: number;
}

/**
 * Gets the Content Events configuration.
 *
 * @since 1.186.0
 * @since n.e.x.t Added the keys the `read_article` event needs.
 *
 * @return {ContentEventsConfig} Content events configuration object.
 */
export function getContentEventsConfig(): ContentEventsConfig {
	return {
		postID: 0,
		isSinglePost: false,
		hasVimeoEmbed: false,
		wordCount: 0,
		estimatedReadTimeSeconds: 0,
		isLastPageOfMultiPagePost: false,
		// These two defaults are here only because `ContentEventsConfig`
		// requires them. `Content_Events.php` always sends the real values.
		// Only a page cached before this release falls back to these numbers.
		// That page has no `isLastPageOfMultiPagePost` either, so
		// `initializeReadArticle()` returns before it reads them.
		readTimeThresholdPercent: 85,
		minimumReadTimeSeconds: 5,
		...( global._googlesitekit?.contentEvents || {} ),
	};
}

/**
 * Runs one initializer, and reports a failure rather than throwing it.
 *
 * The initializers run one after another, so a throw from the first stops the
 * rest. Neither one throws today. We still catch, because they run on the
 * public frontend of any WordPress site, where another plugin can replace a
 * browser global they call, such as `IntersectionObserver` or `performance`.
 *
 * @since n.e.x.t
 *
 * @param {Function} initialize Initializer to run.
 * @param {string}   [message]  Optional. Message to log before the error.
 * @return {void}
 */
function initializeSafely( initialize: () => void, message?: string ): void {
	try {
		initialize();
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( ...( message ? [ message, error ] : [ error ] ) );
	}
}

const config = getContentEventsConfig();

// `initializeVimeo()` is async, so a failure inside it rejects its own promise
// rather than throwing here.
initializeVimeo( config );

initializeSafely(
	() => initializePagination( config ),
	'Site Kit: failed to initialize pagination click tracking.'
);

initializeSafely(
	() => initializeReadArticle( config ),
	'Site Kit: failed to initialize read article tracking.'
);
