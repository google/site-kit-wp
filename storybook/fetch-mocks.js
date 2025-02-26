/**
 * Fetch Mocks for use in Storybook.
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
import fetchMock from 'fetch-mock';

export function bootstrapFetchMocks() {
	// Reset first to prevent errors when hot reloading.
	fetchMock.reset();
	fetchMockSaveSettings();
	fetchMockSaveDataAvailable();
	fetchMockGetModules();
	fetchMockCatchAll();
}

export function fetchMockGetModules() {
	fetchMock.get( new RegExp( '/google-site-kit/v1/core/modules/data/list' ), {
		body: [],
		status: 200,
	} );
}

export function fetchMockSaveSettings() {
	fetchMock.post(
		new RegExp( '/google-site-kit/v1/modules/[\\w-]+/data/settings' ),
		( url, opts ) => {
			const { data } = JSON.parse( opts.body );
			return {
				status: 200,
				body: JSON.stringify( data ),
			};
		}
	);
}

export function fetchMockSaveDataAvailable() {
	fetchMock.post(
		new RegExp( '/google-site-kit/v1/modules/[\\w-]+/data/data-available' ),
		() => {
			return {
				status: 200,
				body: true,
			};
		}
	);
}

// Catch-all mock to log any other requests.
export function fetchMockCatchAll() {
	fetchMock.catch( ( url, opts ) => {
		global.console.warn( 'fetch', opts.method, url, opts );

		if (
			url.startsWith(
				'/google-site-kit/v1/modules/search-console/data/searchanalytics'
			) ||
			url.startsWith(
				'/google-site-kit/v1/modules/analytics-4/data/report'
			)
		) {
			return {
				status: 200,
				body: '[]',
			};
		}

		return {
			status: 200,
			body: '{}',
		};
	} );
}
