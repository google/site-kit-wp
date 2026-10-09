/**
 * Visual regression test helpers for the Storybook preview.
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
 * External dependencies
 */
import {
	STORY_ERRORED,
	STORY_MISSING,
	STORY_RENDERED,
	STORY_THREW_EXCEPTION,
} from 'storybook/internal/core-events';
// Not `@storybook/addons`: the root `node_modules` holds a 6.x copy whose
// channel is a mock, so its listeners never fire.
import { addons } from 'storybook/internal/preview-api';

// The web font faces that `storybook/preview-head.html` requests.
export const VRT_FONTS = [
	'400 16px "Google Sans Text"',
	'500 16px "Google Sans Text"',
	'400 16px "Google Sans Display"',
	'500 16px "Google Sans Display"',
	'700 16px "Google Sans Display"',
];

/**
 * Checks whether the preview runs in visual regression test mode.
 *
 * `storybook/preview-head-vrt.html` sets the flag in builds made with `VRT=1`.
 *
 * @since n.e.x.t
 *
 * @return {boolean} Whether the preview runs in visual regression test mode.
 */
export function isVRT() {
	return document.documentElement.dataset.vrt === 'true';
}

/**
 * Records the story's render state on the document element.
 *
 * @since n.e.x.t
 *
 * @param {string} state   The render state: `pending`, `rendered` or `errored`.
 * @param {string} [error] The error message, for the `errored` state.
 */
function setStoryState( state, error = '' ) {
	document.documentElement.dataset.vrtStoryState = state;
	document.documentElement.dataset.vrtStoryError = error;
}

/**
 * Exposes Storybook's render events to the visual regression test runner.
 *
 * The runner (`tests/vrt/readiness.js`) waits for the `data-vrt-story-state`
 * attribute to leave `pending`, and fails with `data-vrt-story-error` when the
 * story errors instead of rendering.
 *
 * @since n.e.x.t
 */
export function trackVRTStoryState() {
	const channel = addons.getChannel();

	setStoryState( 'pending' );

	channel.on( STORY_RENDERED, () => setStoryState( 'rendered' ) );
	channel.on( STORY_ERRORED, ( { title, description } = {} ) =>
		setStoryState(
			'errored',
			[ title, description ].filter( Boolean ).join( ': ' )
		)
	);
	channel.on( STORY_THREW_EXCEPTION, ( error = {} ) =>
		setStoryState( 'errored', error.message || String( error ) )
	);
	channel.on( STORY_MISSING, ( storyID ) =>
		setStoryState( 'errored', `Story "${ storyID }" is missing.` )
	);
}

/**
 * Loads the web fonts the stories use.
 *
 * @since n.e.x.t
 *
 * @return {Promise<void>} Resolves once every font face has loaded.
 */
export async function loadVRTFonts() {
	const loadedFaces = await Promise.all(
		VRT_FONTS.map( ( font ) => document.fonts.load( font, 'Aa' ) )
	);

	// `document.fonts.load()` resolves with no faces when the stylesheet that
	// declares them failed to load, rather than rejecting.
	const missingFonts = VRT_FONTS.filter(
		( font, index ) => ! loadedFaces[ index ].length
	);

	if ( missingFonts.length ) {
		throw new Error(
			`Web fonts failed to load: ${ missingFonts.join( ', ' ) }.`
		);
	}

	await document.fonts.ready;
}
