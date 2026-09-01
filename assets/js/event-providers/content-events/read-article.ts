/**
 * Read article event tracking.
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

/**
 * Sends the `read_article` event after the visitor has read the post.
 *
 * Both of these have to happen, in either order:
 *
 * - The visitor reaches the end of the article text.
 * - The visitor stays on the page long enough to read the post.
 *
 * @since n.e.x.t
 *
 * @param {ContentEventsConfig} config Content events configuration.
 * @return {void}
 */
export function initializeReadArticle( config: ContentEventsConfig ): void {
	const {
		postID,
		isSinglePost,
		isLastPageOfMultiPagePost,
		wordCount,
		estimatedReadTimeSeconds,
		readTimeThresholdPercent,
		minimumReadTimeSeconds,
	} = config;

	// We send the event only from the last page of a single blog post, so one
	// visit sends at most one event.
	if ( ! isSinglePost || ! isLastPageOfMultiPagePost ) {
		return;
	}

	const requiredWaitMs =
		Math.max(
			minimumReadTimeSeconds,
			( estimatedReadTimeSeconds * readTimeThresholdPercent ) / 100
		) * 1000;

	let hasReachedEnd = false;
	let hasWaitedLongEnough = false;

	let observer: IntersectionObserver | null = null;
	let timeoutID: ReturnType< typeof setTimeout > | null = null;

	/** Time counted so far, while the page was visible and had the focus. */
	let waitedMs = 0;

	/**
	 * The moment the timer last started, from `performance.now()`.
	 *
	 * That clock only moves forwards, so changing the device clock adds no
	 * reading time.
	 */
	let waitStartedAt = 0;

	// Stops the observer and the timer, and removes the event listeners.
	function cleanUp(): void {
		stopWatchingForEnd();
		pauseWaitTimer();

		global.removeEventListener( 'blur', updateWaitTimer );
		global.removeEventListener( 'focus', updateWaitTimer );
		global.document.removeEventListener(
			'visibilitychange',
			updateWaitTimer
		);
	}

	// Sends the event when the visitor has reached the end and waited long
	// enough, then cleans up so nothing sends a second event.
	function maybeSendEvent(): void {
		if ( ! hasReachedEnd || ! hasWaitedLongEnough ) {
			return;
		}

		try {
			global._googlesitekit?.gtagEvent?.( 'read_article', {
				post_id: postID,
				word_count: wordCount,
				estimated_read_time_seconds: estimatedReadTimeSeconds,
			} );
		} catch ( error ) {
			// The catch keeps `cleanUp()` running when `gtagEvent()` throws.
			// eslint-disable-next-line no-console
			console.error(
				'Site Kit: failed to send the read article event.',
				error
			);
		}

		cleanUp();
	}

	// Removes the observer and the scroll listener.
	function stopWatchingForEnd(): void {
		observer?.disconnect();
		observer = null;

		global.removeEventListener( 'scroll', handleScroll );
	}

	// Records the end of the article as reached, and stops watching for it.
	function markEndReached(): void {
		hasReachedEnd = true;

		stopWatchingForEnd();
		maybeSendEvent();
	}

	// Counts the end of the article as reached at 90% of the page. The last 10%
	// leaves room for whatever the theme renders below the article text.
	function handleScroll(): void {
		const scrollRatio =
			( global.scrollY + global.innerHeight ) /
			global.document.documentElement.scrollHeight;

		if ( scrollRatio >= 0.9 ) {
			markEndReached();
		}
	}

	// Starts the timer for the rest of the required wait.
	function startWaitTimer(): void {
		// The visitor has already waited long enough, or a timer is running.
		if ( hasWaitedLongEnough || timeoutID !== null ) {
			return;
		}

		waitStartedAt = global.performance.now();

		timeoutID = global.setTimeout( () => {
			timeoutID = null;
			hasWaitedLongEnough = true;

			maybeSendEvent();
		}, requiredWaitMs - waitedMs );
	}

	// Stops the timer and keeps the time counted so far.
	function pauseWaitTimer(): void {
		// No timer is running, so there's nothing to add to `waitedMs`.
		if ( timeoutID === null ) {
			return;
		}

		global.clearTimeout( timeoutID );
		timeoutID = null;

		waitedMs += global.performance.now() - waitStartedAt;
	}

	// Starts or stops the timer to match the page's visibility and focus.
	function updateWaitTimer(): void {
		// The visitor reads only while the page is visible and the document has
		// the focus. An embedded player taking the focus fires `blur` too, so
		// the check reads the document's state rather than trusting the event.
		if (
			global.document.visibilityState !== 'hidden' &&
			global.document.hasFocus()
		) {
			startWaitTimer();
		} else {
			pauseWaitTimer();
		}
	}

	/** The invisible marker PHP appends to the end of the post content. */
	const endOfContentMarker = global.document.querySelector(
		'.googlesitekit-end-of-content'
	);

	if (
		endOfContentMarker &&
		typeof global.IntersectionObserver === 'function'
	) {
		observer = new global.IntersectionObserver( ( entries ) => {
			if ( entries.some( ( entry ) => entry.isIntersecting ) ) {
				markEndReached();
			}
		} );

		observer.observe( endOfContentMarker );
	} else {
		// Either a page builder rendered the content without `the_content`, or
		// the browser has no `IntersectionObserver`.
		global.addEventListener( 'scroll', handleScroll, { passive: true } );

		handleScroll();
	}

	global.addEventListener( 'blur', updateWaitTimer );
	global.addEventListener( 'focus', updateWaitTimer );
	global.document.addEventListener( 'visibilitychange', updateWaitTimer );

	updateWaitTimer();
}
