/**
 * Enhanced Conversions Playwright utilities.
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
import { type Page, expect } from '@playwright/test';

/**
 * Internal dependencies
 */
import type { WordPress } from '../../wordpress';

export type GTagEventPayload = Record< string, unknown >;

/**
 * Enables or disables conversion tracking through the test REST endpoint.
 *
 * @since n.e.x.t
 *
 * @param wp      The WordPress test instance.
 * @param enabled Whether conversion tracking should be enabled.
 * @return A promise that resolves when the setting is updated.
 */
export async function setConversionTrackingEnabled(
	wp: WordPress,
	enabled: boolean
): Promise< void > {
	await wp.restRequest(
		'POST',
		'google-site-kit/v1/core/site/data/conversion-tracking',
		{
			body: JSON.stringify( { data: { settings: { enabled } } } ),
			headers: { 'Content-Type': 'application/json' },
		}
	);
}

/**
 * Returns the payload for a named gtag event in the data layer.
 *
 * @since n.e.x.t
 *
 * @param page      The page whose data layer should be inspected.
 * @param eventName The gtag event name.
 * @return The event payload, or null when the event has not fired.
 */
export function getGTagEvent(
	page: Page,
	eventName: string
): Promise< GTagEventPayload | null > {
	return page.evaluate( ( name ) => {
		const dataLayer =
			( window as Window & { dataLayer?: unknown[] } ).dataLayer || [];

		for ( const entry of dataLayer ) {
			const record = entry as Record< number, unknown >;

			if ( record[ 0 ] !== 'event' || record[ 1 ] !== name ) {
				continue;
			}

			const payload = record[ 2 ];

			return payload && typeof payload === 'object'
				? ( payload as GTagEventPayload )
				: null;
		}

		return null;
	}, eventName );
}

/**
 * Waits for a named gtag event and returns its payload.
 *
 * @since n.e.x.t
 *
 * @param page      The page whose data layer should be inspected.
 * @param eventName The gtag event name.
 * @return The event payload.
 */
export async function waitForGTagEvent(
	page: Page,
	eventName: string
): Promise< GTagEventPayload > {
	await expect.poll( () => getGTagEvent( page, eventName ) ).not.toBeNull();

	return ( await getGTagEvent( page, eventName ) ) as GTagEventPayload;
}
