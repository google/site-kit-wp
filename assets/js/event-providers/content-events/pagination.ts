/**
 * Pagination click event tracking.
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
import { ContentEventsConfig } from '@/js/event-providers/content-events';

export const POST_PAGINATION_SELECTOR = 'a.post-page-numbers';

/**
 * A bbPress topic's thread pagination.
 *
 * bbPress writes these links with the same `page-numbers` class WordPress uses
 * for blog and archive pagination, so the container tells them apart. The
 * container alone is not enough, though: bbPress renders the same
 * `.bbp-pagination-links` markup for a forum's topic list and for its search
 * results, and only a topic's own pagination counts here. `single-topic` is the
 * body class WordPress gives the singular view of the `topic` post type, so it
 * scopes this to the thread being read.
 */
export const BBPRESS_PAGINATION_SELECTOR =
	'body.single-topic .bbp-pagination-links a.page-numbers';

/**
 * Resolves the page a pagination link points at.
 *
 * The destination page, not the one being read. Every source is checked in turn
 * because the markup varies with permalink structure and with what rendered it:
 * `wp_link_pages()` emits `?page=N` without pretty permalinks and a trailing
 * `/N/` segment with them, bbPress emits `?paged=N` or `/page/N/`, and the
 * numbered link back to the first page carries no number in its href at all.
 *
 * @since n.e.x.t
 *
 * @param {HTMLAnchorElement} anchor Pagination anchor that was clicked.
 * @return {number} Destination page number; `1` when nothing yields one.
 */
function getPageNumber( anchor: HTMLAnchorElement ): number {
	try {
		const url = new URL( anchor.href );

		for ( const param of [ 'page', 'paged' ] ) {
			const pageNumber = parseInt(
				url.searchParams.get( param ) || '',
				10
			);

			if ( pageNumber > 0 ) {
				return pageNumber;
			}
		}

		const lastSegment =
			url.pathname.split( '/' ).filter( Boolean ).pop() || '';

		if ( /^\d+$/.test( lastSegment ) ) {
			const pageNumber = parseInt( lastSegment, 10 );

			if ( pageNumber > 0 ) {
				return pageNumber;
			}
		}
	} catch {
		// Not a parsable address; the anchor's text is the remaining source.
	}

	const textPageNumber = parseInt( anchor.textContent?.trim() || '', 10 );

	if ( textPageNumber > 0 ) {
		return textPageNumber;
	}

	// A pagination link whose address carries no page number points at the first
	// page — this is the "Previous page" link on page 2, for instance.
	return 1;
}

/**
 * Initializes pagination click tracking.
 *
 * Registered unconditionally as a single delegated listener on `document`, with
 * no container or page-type gate, so pagination rendered after load is covered
 * too.
 *
 * @since n.e.x.t
 *
 * @param {ContentEventsConfig} config Content events configuration.
 * @return {void}
 */
export function initializePagination( config: ContentEventsConfig ): void {
	global.document.addEventListener( 'click', ( event: Event ) => {
		// An error while handling one click must not leave the listener in a
		// state that stops it handling the next one.
		try {
			if ( ! ( event.target instanceof Element ) ) {
				return;
			}

			const anchor = event.target.closest(
				`${ POST_PAGINATION_SELECTOR }, ${ BBPRESS_PAGINATION_SELECTOR }`
			) as HTMLAnchorElement | null;

			if ( ! anchor ) {
				return;
			}

			const paginationType = anchor.matches( POST_PAGINATION_SELECTOR )
				? 'post'
				: 'bbpress';

			global._googlesitekit?.gtagEvent?.( 'pagination_click', {
				pagination_type: paginationType,
				page_number: getPageNumber( anchor ),
				post_id: config.postID,
				transport_type: 'beacon',
			} );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error(
				'Site Kit: failed to track this pagination click.',
				error
			);
		}
	} );
}
