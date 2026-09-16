/**
 * Vimeo Player SDK loader.
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

export const VIMEO_SDK_SRC = 'https://player.vimeo.com/api/player.js';

/** Marks a script element this module injected, as opposed to a pre-existing one. */
const OWN_SCRIPT_MARKER = 'data-googlesitekit-vimeo-sdk';

export interface VimeoPlayer {
	on( event: string, callback: ( data: { percent: number } ) => void ): void;
	getVideoTitle(): Promise< string >;
	getVideoUrl(): Promise< string >; // eslint-disable-line sitekit/acronym-case
}

export type VimeoPlayerConstructor = new (
	element: HTMLIFrameElement
) => VimeoPlayer;

interface VimeoGlobal {
	Player?: VimeoPlayerConstructor;
}

/**
 * Reads the (untyped) `Vimeo` global as the narrow slice this loader needs.
 *
 * @since 1.187.0
 *
 * @return {Object|undefined} The `Vimeo` global, when present.
 */
function getVimeo(): VimeoGlobal | undefined {
	return ( global as unknown as { Vimeo?: VimeoGlobal } ).Vimeo;
}

/**
 * How long to wait for a pre-existing SDK script tag before giving up.
 *
 * Without this, a script that already failed to load before this code ran
 * would leave `ensureVimeoSDKLoaded()` pending forever.
 *
 * @since 1.187.0
 */
export const EXISTING_SCRIPT_LOAD_TIMEOUT = 10000;

/**
 * Waits for a script element to finish loading.
 *
 * @since 1.187.0
 *
 * @param {HTMLScriptElement} script    The script element to wait on.
 * @param {number}            [timeout] Milliseconds to wait before giving up and rejecting.
 * @return {Promise<void>} Resolves on the element's `load` event, rejects on `error` or timeout.
 */
function waitForScript(
	// eslint-disable-next-line sitekit/acronym-case
	script: HTMLScriptElement,
	timeout?: number
): Promise< void > {
	return new Promise( ( resolve, reject ) => {
		let timeoutHandle: ReturnType< typeof setTimeout >;

		/**
		 * Wraps a callback to clear the pending timeout before running it, so
		 * only the first of `load`, `error`, or the timeout wins.
		 *
		 * @since 1.187.0
		 *
		 * @param {Function} fn The callback to wrap.
		 * @return {Function} The wrapped callback.
		 */
		function settle< Args extends unknown[] >(
			fn: ( ...args: Args ) => void
		) {
			return ( ...args: Args ) => {
				clearTimeout( timeoutHandle );
				fn( ...args );
			};
		}

		script.addEventListener(
			'load',
			settle( () => resolve() ),
			{
				once: true,
			}
		);
		script.addEventListener(
			'error',
			settle( () =>
				reject(
					new Error(
						'Site Kit: failed to load the Vimeo Player SDK script.'
					)
				)
			),
			{ once: true }
		);

		if ( timeout !== undefined ) {
			timeoutHandle = setTimeout(
				settle( () =>
					reject(
						new Error(
							'Site Kit: timed out waiting for the Vimeo Player SDK script to load.'
						)
					)
				),
				timeout
			);
		}
	} );
}

/**
 * Loads the Vimeo Player SDK script, reusing one already on the page.
 *
 * @since 1.187.0
 *
 * @return {Promise<void>} Resolves once the SDK script has loaded.
 */
async function loadVimeoSDK(): Promise< void > {
	// eslint-disable-next-line sitekit/acronym-case
	const existingScript = global.document.querySelector< HTMLScriptElement >(
		`script[src^="${ VIMEO_SDK_SRC }"]`
	);

	if (
		existingScript &&
		! existingScript.hasAttribute( OWN_SCRIPT_MARKER )
	) {
		// A pre-existing script commonly already loaded (or failed) before this
		// ran, so the timeout below stands in for an `error` event that fired
		// too early to catch.
		await waitForScript( existingScript, EXISTING_SCRIPT_LOAD_TIMEOUT );
		return;
	}

	// Nothing on the page yet, or only our own script from a previous failed
	// attempt: a dead script never fires another `load`/`error` event, so
	// remove it and inject a fresh one to actually retry the network request.
	existingScript?.remove();

	const script = global.document.createElement( 'script' );
	script.src = VIMEO_SDK_SRC;
	script.setAttribute( OWN_SCRIPT_MARKER, '' );
	const loaded = waitForScript( script );
	global.document.head.appendChild( script );
	await loaded;
}

let loadPromise: Promise< VimeoPlayerConstructor > | null = null;

/**
 * Ensures the Vimeo Player SDK is loaded and returns its player constructor.
 *
 * A Vimeo embed is a bare `<iframe>` — WordPress oEmbed does not include the SDK the
 * embed needs to report playback events. But the SDK may already be on the page: Vimeo's
 * own copy-paste embed code includes it, and some themes/plugins ship it. This loads it
 * from the CDN only when it is not already present, reusing an in-flight script tag
 * rather than injecting a second one, and memoises the in-flight promise so repeat calls
 * in the same page view do not re-fetch it. A failed load resets the cache so a later
 * call can retry.
 *
 * @since 1.187.0
 *
 * @return {Promise<VimeoPlayerConstructor>} Resolves with the `Vimeo.Player` constructor.
 */
export default function ensureVimeoSDKLoaded(): Promise< VimeoPlayerConstructor > {
	const vimeo = getVimeo();

	if ( typeof vimeo?.Player === 'function' ) {
		return Promise.resolve( vimeo.Player );
	}

	if ( ! loadPromise ) {
		loadPromise = loadVimeoSDK()
			.then( () => {
				const player = getVimeo()?.Player;

				if ( typeof player !== 'function' ) {
					throw new Error(
						'Site Kit: the Vimeo Player SDK script did not expose Vimeo.Player.'
					);
				}

				return player;
			} )
			.catch( ( error ) => {
				// Reset so a subsequent call can retry after a transient failure.
				loadPromise = null;
				throw error;
			} );
	}

	return loadPromise;
}
