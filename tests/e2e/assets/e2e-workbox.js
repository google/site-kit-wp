/**
 * E2E Workbox.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// Cache CSS, JS, and Web Worker requests with a Stale While Revalidate strategy
registerRoute(
	// Check to see if the request's destination is style for stylesheets, script for JavaScript, or worker for web worker
	( { request } ) =>
		request.destination === 'style' ||
		request.destination === 'script' ||
		request.destination === 'worker',
	// Use a Stale While Revalidate caching strategy
	new CacheFirst( {
		// Put all cached files in a cache named 'assets'
		cacheName: 'assets',
		plugins: [
			// Ensure that only requests that result in a 200 status are cached
			new CacheableResponsePlugin( {
				statuses: [ 200 ],
			} ),
		],
	} ),
);

// Cache images with a Cache First strategy
registerRoute(
	// Check to see if the request's destination is style for an image
	( { request } ) => request.destination === 'image',
	// Use a Cache First caching strategy
	new CacheFirst( {
		// Put all cached files in a cache named 'images'
		cacheName: 'images',
		plugins: [
			// Ensure that only requests that result in a 200 status are cached
			new CacheableResponsePlugin( {
				statuses: [ 200 ],
			} ),
			// Don't cache more than 50 items, and expire them after 30 days
			new ExpirationPlugin( {
				maxEntries: 50,
				maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
			} ),
		],
	} ),
);
