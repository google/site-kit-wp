/**
 * createPreloadingMiddleware tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import createPreloadingMiddleware from './preloading';

describe( 'Preloading Middleware', () => {
	it( 'should return the preloaded data if provided', () => {
		const body = {
			status: 'this is the preloaded response',
		};

		const requestURI = addQueryArgs( 'google-site-kit/v1/core/user/authentication', { timestamp: Date.now() } );

		const preloadedData = {
			[ requestURI ]: {
				body,
			},
		};
		const preloadingMiddleware = createPreloadingMiddleware(
			preloadedData
		);
		const requestOptions = {
			method: 'GET',
			path: requestURI,
		};

		const response = preloadingMiddleware( requestOptions );
		return response.then( ( value ) => {
			expect( value ).toEqual( body );
		} );
	} );
} );
