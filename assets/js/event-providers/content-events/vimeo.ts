/**
 * Vimeo embed engagement event tracking.
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
import ensureVimeoSDKLoaded, { VimeoPlayer } from './ensure-vimeo-sdk-loaded';

export const VIMEO_IFRAME_SELECTOR = 'iframe[src*="player.vimeo.com"]';

export const VIMEO_PROGRESS_THRESHOLDS = [ 10, 25, 50, 75 ];

interface VimeoEventBaseParams {
	video_provider: 'vimeo'; // eslint-disable-line camelcase
	video_title: string; // eslint-disable-line camelcase
	video_url: string; // eslint-disable-line camelcase
	video_instance_index: number; // eslint-disable-line camelcase
}

/**
 * Wires up engagement event tracking for a single Vimeo player.
 *
 * Listeners are registered synchronously, before the video's title/URL are
 * fetched, so a `play` that fires immediately (autoplay, or an instant click
 * on a click-to-play thumbnail) is never missed while those requests are
 * in flight. Each event's emission simply waits for that data to resolve.
 *
 * @since n.e.x.t
 *
 * @param {VimeoPlayer} player        Vimeo player instance.
 * @param {number}      instanceIndex This player's index among the page's Vimeo embeds.
 * @return {Promise<void>} Resolves once the video's title and URL are fetched.
 */
async function trackPlayer(
	player: VimeoPlayer,
	instanceIndex: number
): Promise< void > {
	const baseParamsPromise: Promise< VimeoEventBaseParams > = Promise.all( [
		player.getVideoTitle(),
		player.getVideoUrl(), // eslint-disable-line sitekit/acronym-case
	] ).then( ( [ videoTitle, videoLink ] ) => ( {
		video_provider: 'vimeo',
		video_title: videoTitle,
		video_url: videoLink,
		video_instance_index: instanceIndex,
	} ) );

	// Logged once here rather than in `emit()` below, since every `play`/
	// `timeupdate`/`ended` event reuses this same (by then already-rejected)
	// promise and would otherwise each log the same failure again.
	baseParamsPromise.catch( ( error ) => {
		// eslint-disable-next-line no-console
		console.error(
			'Site Kit: failed to fetch this Vimeo video’s title/URL; its engagement events will not be tracked.',
			error
		);
	} );

	/**
	 * Emits a video engagement event once the video's title/URL are known.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} name    Event name.
	 * @param {number} percent Video watch percentage for this event.
	 * @return {void}
	 */
	function emit( name: string, percent: number ) {
		baseParamsPromise
			.then( ( baseParams ) => {
				global._googlesitekit?.gtagEvent?.( name, {
					...baseParams,
					video_percent: percent,
				} );
			} )
			.catch( () => {} );
	}

	let started = false;
	let completed = false;
	const sentThresholds = new Set< number >();

	player.on( 'play', () => {
		if ( started ) {
			return;
		}

		started = true;
		emit( 'video_start', 0 );
	} );

	player.on( 'timeupdate', ( data ) => {
		if ( sentThresholds.size === VIMEO_PROGRESS_THRESHOLDS.length ) {
			return;
		}

		const percent = Math.floor( data.percent * 100 );

		VIMEO_PROGRESS_THRESHOLDS.forEach( ( threshold ) => {
			if ( percent >= threshold && ! sentThresholds.has( threshold ) ) {
				sentThresholds.add( threshold );
				emit( 'video_progress', threshold );
			}
		} );
	} );

	player.on( 'ended', () => {
		if ( completed ) {
			return;
		}

		completed = true;
		emit( 'video_complete', 100 );
	} );

	await baseParamsPromise;
}

/**
 * Initializes engagement event tracking for every Vimeo embed on the page.
 *
 * Only runs when `config.hasVimeoEmbed` is true — see the `$has_vimeo_embed`
 * property docblock in `Content_Events.php` for what it does and doesn't detect.
 *
 * Never rejects: a missing SDK, a player that fails to initialize, or a rejected
 * `getVideoTitle()`/`getVideoUrl()` call silently results in no events for that
 * player, rather than surfacing an error to the caller.
 *
 * @since n.e.x.t
 *
 * @param {ContentEventsConfig} config Content events configuration.
 * @return {Promise<void>} Resolves once tracking has been wired up for every embed.
 */
export async function initializeVimeo(
	config: ContentEventsConfig
): Promise< void > {
	if ( ! config.hasVimeoEmbed ) {
		return;
	}

	const iframes = global.document.querySelectorAll< HTMLIFrameElement >(
		VIMEO_IFRAME_SELECTOR
	);

	if ( ! iframes.length ) {
		return;
	}

	try {
		const Player = await ensureVimeoSDKLoaded();

		// allSettled, not all: one player failing to track shouldn't stop the
		// others on the same page from finishing their own setup.
		await Promise.allSettled(
			Array.from( iframes ).map( async ( iframe, instanceIndex ) => {
				await trackPlayer( new Player( iframe ), instanceIndex );
			} )
		);
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error(
			'Site Kit: failed to load the Vimeo Player SDK; video engagement events will not be tracked on this page.',
			error
		);
	}
}
