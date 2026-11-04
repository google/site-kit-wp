/**
 * Feature count cache and menu badge utility tests.
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
import {
	FEATURE_COUNT_CACHE_KEY,
	FEATURE_COUNT_CHANNEL_MESSAGES,
	FEATURE_COUNT_CHANNEL_NAME,
	clearFeatureCountCache,
	isFeatureCountCache,
	renderFeaturesBadge,
	renderFeaturesBadgeFromCache,
	setFeatureCountCache,
} from './features-badge';

const fingerprint = {
	connectedModules: [ 'search-console', 'analytics-4' ],
	pluginVersion: '1.187.0',
	userID: 1,
};
const cache = { ...fingerprint, count: 3 };
const originalBroadcastChannel = global.BroadcastChannel;

describe( 'features badge', () => {
	const postMessage = jest.fn();
	const close = jest.fn();

	beforeEach( () => {
		global.BroadcastChannel = jest.fn( () => ( {
			postMessage,
			close,
		} ) ) as unknown as typeof BroadcastChannel;

		document.body.innerHTML =
			'<span class="menu-counter googlesitekit-features-badge count-0"><span aria-hidden="true" class="count"></span><span class="screen-reader-text"></span></span>';
	} );

	afterEach( () => {
		global.BroadcastChannel = originalBroadcastChannel;
		document.body.innerHTML = '';
		jest.clearAllMocks();
	} );

	it.each( [
		null,
		undefined,
		1,
		{},
		[],
		{ ...cache, count: -1 },
		{ ...cache, count: 1.5 },
		{ ...cache, count: Infinity },
		{ ...cache, count: '3' },
		{ ...cache, userID: '1' },
		{ ...cache, userID: 0 },
		{ ...cache, pluginVersion: 1 },
		{ ...cache, connectedModules: [ 1 ] },
		{ ...cache, connectedModules: {} },
	] )( 'should reject invalid cache %j', ( value ) => {
		expect( isFeatureCountCache( value ) ).toBe( false );
	} );

	it( 'should accept a valid cache including zero and no connected modules', () => {
		expect( isFeatureCountCache( cache ) ).toBe( true );

		expect(
			isFeatureCountCache( { ...cache, count: 0, connectedModules: [] } )
		).toBe( true );
	} );

	it( 'should store the count and broadcast an update, closing the sender', () => {
		setFeatureCountCache( cache );

		expect(
			JSON.parse( localStorage.getItem( FEATURE_COUNT_CACHE_KEY )! )
		).toEqual( cache );

		expect( global.BroadcastChannel ).toHaveBeenCalledWith(
			FEATURE_COUNT_CHANNEL_NAME
		);

		expect( postMessage ).toHaveBeenCalledWith(
			FEATURE_COUNT_CHANNEL_MESSAGES.UPDATED
		);

		expect( close ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should clear the count and broadcast an update', () => {
		localStorage.setItem(
			FEATURE_COUNT_CACHE_KEY,
			JSON.stringify( cache )
		);

		clearFeatureCountCache();

		expect( localStorage.getItem( FEATURE_COUNT_CACHE_KEY ) ).toBeNull();

		expect( postMessage ).toHaveBeenCalledWith(
			FEATURE_COUNT_CHANNEL_MESSAGES.UPDATED
		);
	} );

	it( 'should render a singular label for one new feature', () => {
		renderFeaturesBadge( 1, { showCount: true } );

		expect( document.querySelector( '.count' ) ).toHaveTextContent( '1' );

		expect(
			document.querySelector( '.screen-reader-text' )
		).toHaveTextContent( '1 new feature' );

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-1' );
	} );

	it( 'should render a plural label for multiple new features', () => {
		renderFeaturesBadge( 3, { showCount: true } );

		expect( document.querySelector( '.count' ) ).toHaveTextContent( '3' );

		expect(
			document.querySelector( '.screen-reader-text' )
		).toHaveTextContent( '3 new features' );

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-3' );
	} );

	it( 'should render a dot without a number when the count is stale', () => {
		renderFeaturesBadge( 3, { showCount: false } );

		expect( document.querySelector( '.count' ) ).toBeEmptyDOMElement();

		expect(
			document.querySelector( '.screen-reader-text' )
		).toHaveTextContent( 'new features' );

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-3' );
	} );

	it( 'should hide the badge when the count is zero', () => {
		renderFeaturesBadge( 0, { showCount: false } );

		expect( document.querySelector( '.count' ) ).toBeEmptyDOMElement();

		expect(
			document.querySelector( '.screen-reader-text' )
		).toHaveTextContent( 'new features' );

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-0' );
	} );

	it( 'should replace the old count class', () => {
		renderFeaturesBadge( 3, { showCount: true } );
		renderFeaturesBadge( 1, { showCount: true } );

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).not.toHaveClass( 'count-3', 'count-0' );
	} );

	it( 'should tolerate an absent menu item', () => {
		document.body.innerHTML = '';

		expect( () =>
			renderFeaturesBadge( 3, { showCount: true } )
		).not.toThrow();
	} );

	it( 'should render matching fingerprints regardless of module order', () => {
		setFeatureCountCache( cache );

		renderFeaturesBadgeFromCache( {
			...fingerprint,
			connectedModules: [ ...fingerprint.connectedModules ].reverse(),
		} );

		expect( document.querySelector( '.count' ) ).toHaveTextContent( '3' );
	} );

	it( 'should render a dot when the plugin version changes', () => {
		setFeatureCountCache( cache );

		renderFeaturesBadgeFromCache( {
			...fingerprint,
			pluginVersion: '1.188.0',
		} );

		expect( document.querySelector( '.count' ) ).toBeEmptyDOMElement();

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-3' );
	} );

	it( 'should render a dot when a module is disconnected', () => {
		setFeatureCountCache( cache );

		renderFeaturesBadgeFromCache( {
			...fingerprint,
			connectedModules: [ 'search-console' ],
		} );

		expect( document.querySelector( '.count' ) ).toBeEmptyDOMElement();

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-3' );
	} );

	it( 'should render a dot when the connected modules change without changing their count', () => {
		setFeatureCountCache( cache );

		renderFeaturesBadgeFromCache( {
			...fingerprint,
			connectedModules: [ 'search-console', 'adsense' ],
		} );

		expect( document.querySelector( '.count' ) ).toBeEmptyDOMElement();

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-3' );
	} );

	it( 'should keep a stale zero count hidden', () => {
		setFeatureCountCache( { ...cache, count: 0 } );

		renderFeaturesBadgeFromCache( {
			...fingerprint,
			pluginVersion: 'new-version',
		} );

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-0' );
	} );

	it( 'should hide the badge when the cache is missing', () => {
		renderFeaturesBadgeFromCache( fingerprint );

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-0' );
	} );

	it( 'should hide the badge when the cache is null', () => {
		localStorage.setItem( FEATURE_COUNT_CACHE_KEY, 'null' );

		renderFeaturesBadgeFromCache( fingerprint );

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-0' );
	} );

	it( 'should hide the badge when the cache is malformed JSON', () => {
		localStorage.setItem( FEATURE_COUNT_CACHE_KEY, '{' );

		renderFeaturesBadgeFromCache( fingerprint );

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-0' );
	} );

	it( 'should hide the badge when the cache is an empty object', () => {
		localStorage.setItem( FEATURE_COUNT_CACHE_KEY, '{}' );

		renderFeaturesBadgeFromCache( fingerprint );

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-0' );
	} );

	it( 'should hide the badge when the cache is missing its fingerprint', () => {
		localStorage.setItem( FEATURE_COUNT_CACHE_KEY, '{"count":3}' );

		renderFeaturesBadgeFromCache( fingerprint );

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-0' );
	} );

	it( 'should not write invalid cache data', () => {
		setFeatureCountCache( { ...cache, count: -1 } );

		expect( localStorage.getItem( FEATURE_COUNT_CACHE_KEY ) ).toBeNull();
		expect( postMessage ).not.toHaveBeenCalled();
	} );

	it( 'should fail silently when storage cannot be read, written, or cleared', () => {
		for ( const method of [
			'getItem',
			'setItem',
			'removeItem',
		] as const ) {
			( localStorage[ method ] as jest.Mock ).mockImplementationOnce(
				() => {
					throw new Error( 'Storage blocked' );
				}
			);
		}
		expect( () => setFeatureCountCache( cache ) ).not.toThrow();

		expect( () =>
			renderFeaturesBadgeFromCache( fingerprint )
		).not.toThrow();

		expect(
			document.querySelector( '.googlesitekit-features-badge' )
		).toHaveClass( 'count-0' );

		expect( () => clearFeatureCountCache() ).not.toThrow();
	} );

	it( 'should still store and render the cache when broadcasting is unavailable', () => {
		global.BroadcastChannel = jest.fn( () => {
			throw new Error( 'Unavailable' );
		} ) as unknown as typeof BroadcastChannel;

		expect( () => setFeatureCountCache( cache ) ).not.toThrow();

		renderFeaturesBadgeFromCache( fingerprint );

		expect( document.querySelector( '.count' ) ).toHaveTextContent( '3' );
		expect( () => clearFeatureCountCache() ).not.toThrow();
	} );
} );
