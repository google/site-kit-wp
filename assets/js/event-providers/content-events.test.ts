/**
 * Content events provider tests.
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

type SiteKitGlobal = typeof global._googlesitekit;

const mockInitializeVimeo = jest.fn();

jest.mock( './content-events/vimeo', () => ( {
	__esModule: true,
	initializeVimeo: ( ...args: unknown[] ) => mockInitializeVimeo( ...args ),
} ) );

function deleteSiteKitGlobal() {
	delete ( global as { _googlesitekit?: SiteKitGlobal } )._googlesitekit;
}

describe( 'content-events', () => {
	let addEventListenerSpy: jest.SpyInstance;
	let gtagEventMock: jest.Mock;

	beforeEach( () => {
		addEventListenerSpy = jest.spyOn( global.document, 'addEventListener' );
		gtagEventMock = jest.fn();
		deleteSiteKitGlobal();
		jest.resetModules();
		mockInitializeVimeo.mockReset();
		mockInitializeVimeo.mockResolvedValue( undefined );
	} );

	afterEach( () => {
		addEventListenerSpy.mockRestore();
	} );

	it( 'imports cleanly when global._googlesitekit is undefined and returns default config', async () => {
		deleteSiteKitGlobal();

		const { getContentEventsConfig } = await import( './content-events' );

		expect( getContentEventsConfig() ).toEqual( {
			postID: 0,
			isSinglePost: false,
			hasVimeoEmbed: false,
		} );
		expect( addEventListenerSpy ).not.toHaveBeenCalled();
		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'imports cleanly when global._googlesitekit is present without contentEvents key and returns default config', async () => {
		global._googlesitekit = {
			gtagEvent: gtagEventMock,
		};

		const { getContentEventsConfig } = await import( './content-events' );

		expect( getContentEventsConfig() ).toEqual( {
			postID: 0,
			isSinglePost: false,
			hasVimeoEmbed: false,
		} );
		expect( addEventListenerSpy ).not.toHaveBeenCalled();
		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'returns published config values when contentEvents is provided', async () => {
		global._googlesitekit = {
			contentEvents: {
				postID: 42,
				isSinglePost: true,
				hasVimeoEmbed: true,
			},
			gtagEvent: gtagEventMock,
		};

		const { getContentEventsConfig } = await import( './content-events' );

		expect( getContentEventsConfig() ).toEqual( {
			postID: 42,
			isSinglePost: true,
			hasVimeoEmbed: true,
		} );
		expect( addEventListenerSpy ).not.toHaveBeenCalled();
		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'should invoke the Vimeo initializer with the resolved config on import', async () => {
		global._googlesitekit = {
			contentEvents: {
				postID: 42,
				isSinglePost: true,
				hasVimeoEmbed: true,
			},
		};

		await import( './content-events' );
		// Flush the microtask queue so the fire-and-forget call resolves.
		await Promise.resolve();

		expect( mockInitializeVimeo ).toHaveBeenCalledWith( {
			postID: 42,
			isSinglePost: true,
			hasVimeoEmbed: true,
		} );
	} );
} );
