/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
import createDedupeMiddleware from './deduplication';

describe( 'api > middleware > deduplication', () => {
	it( 'detects when the same request is made more than once, before the first has finished', () => {
		const onDuplicate = jest.fn();

		const middleware = createDedupeMiddleware( { onDuplicate } );
		const options = {
			method: 'GET',
			path: '/test',
		};
		// The next middleware will emulate a request of unknown duration.
		const next = jest.fn( () => new Promise( () => {} ) );

		middleware( options, next );

		expect( next ).toHaveBeenCalled();
		expect( onDuplicate ).not.toHaveBeenCalled();

		// Calling the middleware again will simulate a second request.
		middleware( options, next );
		// The next middleware should not be called since this would result in a duplicate request.
		expect( next ).toHaveBeenCalledTimes( 1 );
		expect( onDuplicate ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'returns the same promise for duplicate calls', () => {
		const onDuplicate = jest.fn();

		const middleware = createDedupeMiddleware( { onDuplicate } );
		const options = {
			method: 'GET',
			path: '/test',
		};
		// The next middleware will emulate a request of unknown duration
		// that will generate a new promise every time.
		const next = jest.fn( () => new Promise( () => {} ) );

		const responsePromiseA = middleware( options, next );

		expect( next ).toHaveBeenCalled();

		// Calling the middleware again will simulate a second request.
		const responsePromiseB = middleware( options, next );

		expect( responsePromiseA ).toBe( responsePromiseB );
		// A duplicate request will only result in a single call to next.
		expect( next ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'only deduplicates requests that are in progress', async () => {
		const onDuplicate = jest.fn();

		const middleware = createDedupeMiddleware( { onDuplicate } );
		const options = {
			method: 'GET',
			path: '/test',
		};
		// Return a response that we can resolve later.
		let counter = 0;
		// eslint-disable-next-line sitekit/function-declaration-consistency
		let resolveLastResponse: () => void = () => {};
		function newResponse() {
			return new Promise( ( resolve ) => {
				const valueToReturn = ++counter;
				resolveLastResponse = () => resolve( valueToReturn );
			} );
		}
		const next = jest.fn( newResponse );

		// The first time, no requests are in progress, so next is called.
		const responseA = middleware( options, next );
		expect( onDuplicate ).not.toHaveBeenCalled();
		expect( next ).toHaveBeenCalledTimes( 1 );
		resolveLastResponse();
		await expect( responseA ).resolves.toBe( 1 );
		// The first request is completed and so the same request can be made again.

		// Calling the middleware again will simulate a second request which will call next (no deduplication).
		const responseB = middleware( options, next );
		expect( responseB ).not.toBe( responseA );
		resolveLastResponse();
		await expect( responseB ).resolves.toBe( 2 );

		expect( onDuplicate ).not.toHaveBeenCalled();
		expect( next ).toHaveBeenCalledTimes( 2 );
	} );
} );
