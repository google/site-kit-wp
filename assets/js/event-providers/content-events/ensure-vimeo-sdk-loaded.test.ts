/**
 * Vimeo Player SDK loader tests.
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

const SDK_SELECTOR = 'script[src^="https://player.vimeo.com/api/player.js"]';

type EnsureVimeoSDKLoadedModule = typeof import('./ensure-vimeo-sdk-loaded');
type EnsureVimeoSDKLoaded = EnsureVimeoSDKLoadedModule[ 'default' ];

function setVimeo( value: unknown ) {
	( global as unknown as { Vimeo?: unknown } ).Vimeo = value;
}

function getSDKScripts(): NodeListOf< Element > {
	return global.document.head.querySelectorAll( SDK_SELECTOR );
}

describe( 'ensureVimeoSDKLoaded', () => {
	let ensureVimeoSDKLoaded: EnsureVimeoSDKLoaded;
	let existingScriptLoadTimeout: number;

	beforeEach( async () => {
		// The loader memoises an in-flight promise at module scope, so reset the
		// module registry between tests to start from a clean cache each time.
		jest.resetModules();
		const loaderModule: EnsureVimeoSDKLoadedModule = await import(
			'./ensure-vimeo-sdk-loaded'
		);
		ensureVimeoSDKLoaded = loaderModule.default;
		existingScriptLoadTimeout = loaderModule.EXISTING_SCRIPT_LOAD_TIMEOUT;
		setVimeo( undefined );
	} );

	afterEach( () => {
		jest.useRealTimers();
		getSDKScripts().forEach( ( script ) => script.remove() );
		setVimeo( undefined );
	} );

	it( 'should resolve immediately when Vimeo.Player is already available', async () => {
		function Player() {}
		setVimeo( { Player } );

		await expect( ensureVimeoSDKLoaded() ).resolves.toBe( Player );

		expect( getSDKScripts() ).toHaveLength( 0 );
	} );

	it( 'should inject the SDK script and resolve with Vimeo.Player once it loads', async () => {
		function Player() {}

		const promise = ensureVimeoSDKLoaded();

		const scripts = getSDKScripts();
		expect( scripts ).toHaveLength( 1 );

		setVimeo( { Player } );
		scripts[ 0 ].dispatchEvent( new Event( 'load' ) );

		await expect( promise ).resolves.toBe( Player );
	} );

	it( 'should reuse an existing SDK script instead of injecting a duplicate', async () => {
		function Player() {}

		const existingScript = global.document.createElement( 'script' );
		existingScript.src = 'https://player.vimeo.com/api/player.js';
		global.document.head.appendChild( existingScript );

		const promise = ensureVimeoSDKLoaded();

		expect( getSDKScripts() ).toHaveLength( 1 );

		setVimeo( { Player } );
		existingScript.dispatchEvent( new Event( 'load' ) );

		await expect( promise ).resolves.toBe( Player );
	} );

	it( 'should reuse a single in-flight promise across repeat calls', async () => {
		function Player() {}

		const first = ensureVimeoSDKLoaded();
		const second = ensureVimeoSDKLoaded();

		// Same promise reference and only one script injected.
		expect( first ).toBe( second );
		expect( getSDKScripts() ).toHaveLength( 1 );

		setVimeo( { Player } );
		getSDKScripts()[ 0 ].dispatchEvent( new Event( 'load' ) );

		await Promise.all( [ first, second ] );
		expect( getSDKScripts() ).toHaveLength( 1 );
	} );

	it( 'should reject when the SDK script fails to load', async () => {
		const promise = ensureVimeoSDKLoaded();

		const scripts = getSDKScripts();
		expect( scripts ).toHaveLength( 1 );

		scripts[ 0 ].dispatchEvent( new Event( 'error' ) );

		await expect( promise ).rejects.toThrow(
			/failed to load the vimeo player sdk script/i
		);
	} );

	it( 'should reject when the script loads without exposing Vimeo.Player', async () => {
		const promise = ensureVimeoSDKLoaded();

		const scripts = getSDKScripts();
		scripts[ 0 ].dispatchEvent( new Event( 'load' ) );

		await expect( promise ).rejects.toThrow(
			/did not expose vimeo\.player/i
		);
	} );

	it( 'should reject a pre-existing script that already failed before this ran, instead of hanging forever', async () => {
		jest.useFakeTimers();

		// This script already errored (e.g. blocked by an ad-blocker), so it
		// won't fire another `error` event for a freshly attached listener.
		const existingScript = global.document.createElement( 'script' );
		existingScript.src = 'https://player.vimeo.com/api/player.js';
		global.document.head.appendChild( existingScript );

		const promise = ensureVimeoSDKLoaded();

		await Promise.all( [
			expect( promise ).rejects.toThrow(
				/timed out waiting for the vimeo player sdk script/i
			),
			jest.advanceTimersByTimeAsync( existingScriptLoadTimeout ),
		] );
	} );

	it( 'should allow a retry after a rejected load', async () => {
		function Player() {}

		const failed = ensureVimeoSDKLoaded();
		getSDKScripts()[ 0 ].dispatchEvent( new Event( 'error' ) );
		await expect( failed ).rejects.toThrow();

		const retried = ensureVimeoSDKLoaded();
		const scripts = getSDKScripts();
		expect( scripts ).toHaveLength( 1 );

		setVimeo( { Player } );
		scripts[ 0 ].dispatchEvent( new Event( 'load' ) );

		await expect( retried ).resolves.toBe( Player );
	} );

	it( 'should replace its own dead script with a fresh one on retry, instead of waiting out the existing-script timeout', async () => {
		function Player() {}

		const failed = ensureVimeoSDKLoaded();
		const firstScript = getSDKScripts()[ 0 ];
		firstScript.dispatchEvent( new Event( 'error' ) );
		await expect( failed ).rejects.toThrow(
			/failed to load the vimeo player sdk script/i
		);

		const retried = ensureVimeoSDKLoaded();
		const scripts = getSDKScripts();

		// A fresh script element, not the dead one reused: the dead script
		// never fires another event, so reusing it would just hang or, with
		// the existing-script timeout, wait out the full timeout instead of
		// actually retrying the network request.
		expect( scripts ).toHaveLength( 1 );
		expect( scripts[ 0 ] ).not.toBe( firstScript );
		expect( global.document.contains( firstScript ) ).toBe( false );

		setVimeo( { Player } );
		scripts[ 0 ].dispatchEvent( new Event( 'load' ) );

		await expect( retried ).resolves.toBe( Player );
	} );
} );
