/**
 * Vimeo embed engagement event tracking tests.
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
import ensureVimeoSDKLoaded, {
	VimeoPlayer,
	VimeoPlayerConstructor,
} from './ensure-vimeo-sdk-loaded';
import { initializeVimeo } from './vimeo';

jest.mock( './ensure-vimeo-sdk-loaded', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockEnsureVimeoSDKLoaded = ensureVimeoSDKLoaded as jest.MockedFunction<
	typeof ensureVimeoSDKLoaded
>;

class FakePlayer implements VimeoPlayer {
	handlers: Record< string, Array< ( data: { percent: number } ) => void > > =
		{};

	getVideoTitle = jest.fn( () => Promise.resolve( 'My Video' ) );
	// eslint-disable-next-line sitekit/acronym-case
	getVideoUrl = jest.fn( () => Promise.resolve( 'https://vimeo.com/123' ) );

	on( event: string, callback: ( data: { percent: number } ) => void ) {
		( this.handlers[ event ] ??= [] ).push( callback );
	}

	trigger( event: string, data: { percent: number } = { percent: 0 } ) {
		( this.handlers[ event ] || [] ).forEach( ( callback ) =>
			callback( data )
		);
	}
}

function baseConfig(
	overrides: Partial< ContentEventsConfig > = {}
): ContentEventsConfig {
	return {
		postID: 1,
		isSinglePost: true,
		hasVimeoEmbed: true,
		wordCount: 0,
		estimatedReadTimeSeconds: 0,
		isFinalPage: true,
		readTimeThresholdPercent: 85,
		minimumReadTimeSeconds: 5,
		...overrides,
	};
}

function appendVimeoIframe(): HTMLIFrameElement {
	const iframe = global.document.createElement( 'iframe' );
	iframe.src = 'https://player.vimeo.com/video/123';
	global.document.body.appendChild( iframe );
	return iframe;
}

// A macrotask tick drains the microtask queue first, so a deferred
// `gtagEvent` call (behind `baseParamsPromise.then()` in `emit()`) has
// landed by the time this resolves.
function flushPendingWork(): Promise< void > {
	return new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
}

describe( 'initializeVimeo', () => {
	let gtagEventMock: jest.Mock;
	let instances: FakePlayer[];
	let PlayerConstructor: jest.Mock;

	beforeEach( () => {
		instances = [];
		PlayerConstructor = jest.fn( () => {
			const player = new FakePlayer();
			instances.push( player );
			return player;
		} );

		gtagEventMock = jest.fn();
		global._googlesitekit = { gtagEvent: gtagEventMock };

		mockEnsureVimeoSDKLoaded.mockResolvedValue(
			PlayerConstructor as unknown as VimeoPlayerConstructor
		);
	} );

	afterEach( () => {
		global.document.body.innerHTML = '';
		delete ( global as { _googlesitekit?: unknown } )._googlesitekit;
		jest.clearAllMocks();
	} );

	it( 'should do nothing when hasVimeoEmbed is false', async () => {
		appendVimeoIframe();

		await initializeVimeo( baseConfig( { hasVimeoEmbed: false } ) );

		expect( mockEnsureVimeoSDKLoaded ).not.toHaveBeenCalled();
		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'should do nothing when there are no Vimeo iframes on the page', async () => {
		await initializeVimeo( baseConfig() );

		expect( mockEnsureVimeoSDKLoaded ).not.toHaveBeenCalled();
		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'should emit video_start once on play, and not again on a later play', async () => {
		appendVimeoIframe();

		await initializeVimeo( baseConfig() );

		instances[ 0 ].trigger( 'play' );
		instances[ 0 ].trigger( 'play' );
		await flushPendingWork();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith( 'video_start', {
			video_provider: 'vimeo',
			video_title: 'My Video',
			video_url: 'https://vimeo.com/123',
			video_percent: 0,
			video_instance_index: 0,
		} );
	} );

	it( 'should register listeners before the video title/URL requests resolve, so an immediate play is not missed', async () => {
		appendVimeoIframe();

		// Don't let getVideoTitle()/getVideoUrl() resolve yet, simulating a
		// `play` that fires while those requests are still in flight.
		function noop() {
			// Reassigned below once the Promise executor runs.
		}
		let resolveTitle: ( title: string ) => void = noop;
		PlayerConstructor.mockImplementationOnce( () => {
			const player = new FakePlayer();
			player.getVideoTitle = jest.fn(
				() => new Promise( ( resolve ) => ( resolveTitle = resolve ) )
			);
			instances.push( player );
			return player;
		} );

		const initialized = initializeVimeo( baseConfig() );
		// Let the player get constructed and its listeners registered, without
		// waiting for the still-unresolved getVideoTitle() call.
		await flushPendingWork();

		instances[ 0 ].trigger( 'play' );
		resolveTitle( 'My Video' );
		await initialized;
		await flushPendingWork();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith(
			'video_start',
			expect.objectContaining( { video_percent: 0 } )
		);
	} );

	it( 'should emit video_progress once per threshold, including a jump past several at once', async () => {
		appendVimeoIframe();

		await initializeVimeo( baseConfig() );

		instances[ 0 ].trigger( 'timeupdate', { percent: 0.6 } );
		await flushPendingWork();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 3 );
		expect( gtagEventMock ).toHaveBeenNthCalledWith(
			1,
			'video_progress',
			expect.objectContaining( { video_percent: 10 } )
		);
		expect( gtagEventMock ).toHaveBeenNthCalledWith(
			2,
			'video_progress',
			expect.objectContaining( { video_percent: 25 } )
		);
		expect( gtagEventMock ).toHaveBeenNthCalledWith(
			3,
			'video_progress',
			expect.objectContaining( { video_percent: 50 } )
		);
	} );

	it( 'should not fire a threshold before it is actually reached', async () => {
		appendVimeoIframe();

		await initializeVimeo( baseConfig() );

		// 9.6% actually watched should not count as having reached 10%.
		instances[ 0 ].trigger( 'timeupdate', { percent: 0.096 } );
		await flushPendingWork();

		expect( gtagEventMock ).not.toHaveBeenCalled();

		instances[ 0 ].trigger( 'timeupdate', { percent: 0.1 } );
		await flushPendingWork();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not re-emit a threshold when playback goes back below it', async () => {
		appendVimeoIframe();

		await initializeVimeo( baseConfig() );

		instances[ 0 ].trigger( 'timeupdate', { percent: 0.3 } );
		await flushPendingWork();
		gtagEventMock.mockClear();

		instances[ 0 ].trigger( 'timeupdate', { percent: 0.05 } );
		instances[ 0 ].trigger( 'timeupdate', { percent: 0.3 } );
		await flushPendingWork();

		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'should emit video_complete once on ended', async () => {
		appendVimeoIframe();

		await initializeVimeo( baseConfig() );

		instances[ 0 ].trigger( 'ended' );
		instances[ 0 ].trigger( 'ended' );
		await flushPendingWork();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith( 'video_complete', {
			video_provider: 'vimeo',
			video_title: 'My Video',
			video_url: 'https://vimeo.com/123',
			video_percent: 100,
			video_instance_index: 0,
		} );
	} );

	it( 'should track multiple embeds independently, tagged with distinct instance indexes', async () => {
		appendVimeoIframe();
		appendVimeoIframe();

		await initializeVimeo( baseConfig() );

		expect( instances ).toHaveLength( 2 );

		instances[ 0 ].trigger( 'play' );
		await flushPendingWork();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith(
			'video_start',
			expect.objectContaining( { video_instance_index: 0 } )
		);

		instances[ 1 ].trigger( 'play' );
		await flushPendingWork();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 2 );
		expect( gtagEventMock ).toHaveBeenCalledWith(
			'video_start',
			expect.objectContaining( { video_instance_index: 1 } )
		);
	} );

	it( 'should resolve without emitting when the SDK fails to load, logging the failure', async () => {
		// Mock console.error since this test intentionally triggers it.
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		appendVimeoIframe();
		mockEnsureVimeoSDKLoaded.mockRejectedValue(
			new Error( 'failed to load' )
		);

		await expect(
			initializeVimeo( baseConfig() )
		).resolves.toBeUndefined();

		expect( gtagEventMock ).not.toHaveBeenCalled();
		expect( consoleErrorSpy ).toHaveBeenCalledWith(
			expect.stringContaining( 'failed to load the Vimeo Player SDK' ),
			expect.any( Error )
		);

		consoleErrorSpy.mockRestore();
	} );

	it( 'should resolve without emitting when a player fails to initialize, logging the failure', async () => {
		// Mock console.error since this test intentionally triggers it.
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		appendVimeoIframe();
		instances = [];
		PlayerConstructor = jest.fn( () => {
			const player = new FakePlayer();
			player.getVideoTitle = jest.fn( () =>
				Promise.reject( new Error( 'not ready' ) )
			);
			instances.push( player );
			return player;
		} );
		mockEnsureVimeoSDKLoaded.mockResolvedValue(
			PlayerConstructor as unknown as VimeoPlayerConstructor
		);

		await expect(
			initializeVimeo( baseConfig() )
		).resolves.toBeUndefined();

		expect( gtagEventMock ).not.toHaveBeenCalled();
		expect( consoleErrorSpy ).toHaveBeenCalledWith(
			expect.stringContaining( 'title/URL' ),
			expect.any( Error )
		);

		consoleErrorSpy.mockRestore();
	} );

	it( 'should still track the other embeds when the Player constructor throws synchronously for one iframe', async () => {
		appendVimeoIframe();
		appendVimeoIframe();
		instances = [];
		let callCount = 0;
		PlayerConstructor = jest.fn( () => {
			callCount += 1;
			if ( callCount === 1 ) {
				throw new Error( 'invalid embed element' );
			}
			const player = new FakePlayer();
			instances.push( player );
			return player;
		} );
		mockEnsureVimeoSDKLoaded.mockResolvedValue(
			PlayerConstructor as unknown as VimeoPlayerConstructor
		);

		await expect(
			initializeVimeo( baseConfig() )
		).resolves.toBeUndefined();

		expect( instances ).toHaveLength( 1 );
		instances[ 0 ].trigger( 'play' );
		await flushPendingWork();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not let a rejected title/URL fetch produce an unhandled rejection when an event already fired', async () => {
		// Mock console.error since this test intentionally triggers it.
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		appendVimeoIframe();
		function rejectNoop() {}
		let rejectTitle: ( error: Error ) => void = rejectNoop;
		PlayerConstructor.mockImplementationOnce( () => {
			const player = new FakePlayer();
			player.getVideoTitle = jest.fn(
				() =>
					new Promise< string >(
						( _resolve, reject ) => ( rejectTitle = reject )
					)
			);
			instances.push( player );
			return player;
		} );

		const initialized = initializeVimeo( baseConfig() );
		await flushPendingWork();

		// Trigger an event before the title/URL fetch settles, then reject it.
		instances[ 0 ].trigger( 'play' );
		rejectTitle( new Error( 'not ready' ) );

		await expect( initialized ).resolves.toBeUndefined();
		await flushPendingWork();

		expect( gtagEventMock ).not.toHaveBeenCalled();
		expect( consoleErrorSpy ).toHaveBeenCalledWith(
			expect.stringContaining( 'title/URL' ),
			expect.any( Error )
		);

		consoleErrorSpy.mockRestore();
	} );
} );
