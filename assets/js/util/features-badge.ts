/**
 * Feature count cache and menu badge utilities.
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
import { __, _n, sprintf } from '@wordpress/i18n';

export const FEATURE_COUNT_CACHE_KEY = 'googlesitekit::feature-count';
export const FEATURE_COUNT_CHANNEL_NAME = 'googlesitekit::feature-count';
export const FEATURE_COUNT_CHANNEL_MESSAGES = { UPDATED: 'updated' };

export interface FeatureCountFingerprint {
	connectedModules: string[];
	pluginVersion: string;
	userID: number;
}

export interface FeatureCountCache extends FeatureCountFingerprint {
	count: number;
}

/**
 * Posts a message that the feature count has been updated.
 *
 * @since n.e.x.t
 *
 * @return {void}
 */
function postFeatureCountUpdatedMessage(): void {
	try {
		const channel = new BroadcastChannel( FEATURE_COUNT_CHANNEL_NAME );

		try {
			channel.postMessage( FEATURE_COUNT_CHANNEL_MESSAGES.UPDATED );
		} finally {
			channel.close();
		}
	} catch ( error ) {
		global.console.warn(
			'Encountered an unexpected broadcast channel error:',
			error
		);
	}
}

/**
 * Validates a cached feature count.
 *
 * @since n.e.x.t
 *
 * @param {unknown} value Value to validate.
 * @return {boolean} Whether the value is a feature count cache.
 */
export function isFeatureCountCache(
	value: unknown
): value is FeatureCountCache {
	if ( ! value || typeof value !== 'object' ) {
		return false;
	}

	const cache = value as FeatureCountCache;

	const hasConnectedModules =
		Array.isArray( cache.connectedModules ) &&
		cache.connectedModules.every( ( slug ) => typeof slug === 'string' );

	const hasCount = Number.isInteger( cache.count ) && cache.count >= 0;
	const hasPluginVersion = typeof cache.pluginVersion === 'string';
	const hasUserID = Number.isInteger( cache.userID ) && cache.userID > 0;

	return hasConnectedModules && hasCount && hasPluginVersion && hasUserID;
}

/**
 * Gets the cached feature count from local storage.
 *
 * @since n.e.x.t
 *
 * @return {FeatureCountCache | null} The feature cache count.
 */
function getFeatureCountCache(): FeatureCountCache | null {
	try {
		const value: unknown = JSON.parse(
			localStorage.getItem( FEATURE_COUNT_CACHE_KEY ) || 'null'
		);

		return isFeatureCountCache( value ) ? value : null;
	} catch ( error ) {
		global.console.warn(
			'Encountered an unexpected storage error:',
			error
		);

		return null;
	}
}

/**
 * Clears the cached count and notifies open admin tabs.
 *
 * @since n.e.x.t
 *
 * @return {void}
 */
export function clearFeatureCountCache(): void {
	try {
		localStorage.removeItem( FEATURE_COUNT_CACHE_KEY );
	} catch ( error ) {
		global.console.warn(
			'Encountered an unexpected storage error:',
			error
		);
	}

	postFeatureCountUpdatedMessage();
}

/**
 * Stores the count and notifies open admin tabs.
 *
 * @since n.e.x.t
 *
 * @param {FeatureCountCache} featureCountCache Count and its fingerprint.
 * @return {void}
 */
export function setFeatureCountCache(
	featureCountCache: FeatureCountCache
): void {
	if ( ! isFeatureCountCache( featureCountCache ) ) {
		return;
	}

	try {
		localStorage.setItem(
			FEATURE_COUNT_CACHE_KEY,
			JSON.stringify( featureCountCache )
		);
	} catch ( error ) {
		global.console.warn(
			'Encountered an unexpected storage error:',
			error
		);

		return;
	}

	postFeatureCountUpdatedMessage();
}

/**
 * Renders a count or dot using WordPress menu count styling.
 *
 * @since n.e.x.t
 *
 * @param {number}  count             Number of unread features.
 * @param {Object}  options           Badge rendering options.
 * @param {boolean} options.showCount Whether to show the number.
 * @return {void}
 */
export function renderFeaturesBadge(
	count: number,
	{
		showCount,
	}: {
		showCount: boolean;
	}
): void {
	const badge = document.querySelector( '.googlesitekit-features-badge' );

	if ( ! badge ) {
		return;
	}

	const countElement = badge.querySelector( '.count' );
	const screenReaderText = badge.querySelector( '.screen-reader-text' );

	if ( ! countElement || ! screenReaderText ) {
		return;
	}

	countElement.textContent = showCount ? String( count ) : '';

	badge.classList.forEach( ( className ) => {
		if ( className.startsWith( 'count-' ) ) {
			badge.classList.remove( className );
		}
	} );

	badge.classList.add( `count-${ count }` );

	screenReaderText.textContent = showCount
		? sprintf(
				// translators: %d: Number of new features.
				_n(
					'%d new feature',
					'%d new features',
					count,
					'google-site-kit'
				),
				count
		  )
		: __( 'new features', 'google-site-kit' );
}

/**
 * Renders the remembered count, hiding numbers with an outdated fingerprint.
 *
 * @since n.e.x.t
 *
 * @param {FeatureCountFingerprint} fingerprint Cache fingerprint.
 * @return {void}
 */
export function renderFeaturesBadgeFromCache(
	fingerprint: FeatureCountFingerprint
): void {
	const cache = getFeatureCountCache();

	if ( ! cache ) {
		renderFeaturesBadge( 0, { showCount: false } );
		return;
	}

	if ( fingerprint.userID !== cache.userID ) {
		renderFeaturesBadge( 0, { showCount: false } );
		return;
	}

	const showCount =
		fingerprint.pluginVersion === cache.pluginVersion &&
		fingerprint.connectedModules.length === cache.connectedModules.length &&
		fingerprint.connectedModules.every( ( slug ) =>
			cache.connectedModules.includes( slug )
		);

	renderFeaturesBadge( cache.count, { showCount } );
}
