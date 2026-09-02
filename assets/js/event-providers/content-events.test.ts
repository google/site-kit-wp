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
const mockInitializePagination = jest.fn();
const mockInitializeReadArticle = jest.fn();

jest.mock( './content-events/vimeo', () => ( {
	__esModule: true,
	initializeVimeo: ( ...args: unknown[] ) => mockInitializeVimeo( ...args ),
} ) );

jest.mock( './content-events/pagination', () => ( {
	__esModule: true,
	initializePagination: ( ...args: unknown[] ) =>
		mockInitializePagination( ...args ),
} ) );

jest.mock( './content-events/read-article', () => ( {
	__esModule: true,
	initializeReadArticle: ( ...args: unknown[] ) =>
		mockInitializeReadArticle( ...args ),
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
		mockInitializePagination.mockReset();
		mockInitializeReadArticle.mockReset();
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
			wordCount: 0,
			estimatedReadTimeSeconds: 0,
			isLastPageOfMultiPagePost: false,
			readTimeThresholdPercent: 85,
			minimumReadTimeSeconds: 5,
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
			wordCount: 0,
			estimatedReadTimeSeconds: 0,
			isLastPageOfMultiPagePost: false,
			readTimeThresholdPercent: 85,
			minimumReadTimeSeconds: 5,
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
				wordCount: 476,
				estimatedReadTimeSeconds: 120,
				isLastPageOfMultiPagePost: true,
				readTimeThresholdPercent: 70,
				minimumReadTimeSeconds: 9,
			},
			gtagEvent: gtagEventMock,
		};

		const { getContentEventsConfig } = await import( './content-events' );

		expect( getContentEventsConfig() ).toEqual( {
			postID: 42,
			isSinglePost: true,
			hasVimeoEmbed: true,
			wordCount: 476,
			estimatedReadTimeSeconds: 120,
			isLastPageOfMultiPagePost: true,
			readTimeThresholdPercent: 70,
			minimumReadTimeSeconds: 9,
		} );
		expect( addEventListenerSpy ).not.toHaveBeenCalled();
		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'returns the defaults for the keys a configuration from an older release omits', async () => {
		// A page cached by an older release has these three keys and nothing
		// else.
		global._googlesitekit = {
			contentEvents: {
				postID: 42,
				isSinglePost: true,
				hasVimeoEmbed: true,
			},
		};

		const { getContentEventsConfig } = await import( './content-events' );

		expect( getContentEventsConfig() ).toEqual( {
			postID: 42,
			isSinglePost: true,
			hasVimeoEmbed: true,
			wordCount: 0,
			estimatedReadTimeSeconds: 0,
			isLastPageOfMultiPagePost: false,
			readTimeThresholdPercent: 85,
			minimumReadTimeSeconds: 5,
		} );
	} );

	it( 'should invoke the Vimeo initializer with the resolved config on import', async () => {
		global._googlesitekit = {
			contentEvents: {
				postID: 42,
				isSinglePost: true,
				hasVimeoEmbed: true,
				wordCount: 476,
				estimatedReadTimeSeconds: 120,
				isLastPageOfMultiPagePost: true,
				readTimeThresholdPercent: 70,
				minimumReadTimeSeconds: 9,
			},
		};

		await import( './content-events' );
		// Flush the microtask queue so the fire-and-forget call resolves.
		await Promise.resolve();

		expect( mockInitializeVimeo ).toHaveBeenCalledWith( {
			postID: 42,
			isSinglePost: true,
			hasVimeoEmbed: true,
			wordCount: 476,
			estimatedReadTimeSeconds: 120,
			isLastPageOfMultiPagePost: true,
			readTimeThresholdPercent: 70,
			minimumReadTimeSeconds: 9,
		} );
	} );

	it( 'should invoke the pagination initializer with the resolved config on import', async () => {
		global._googlesitekit = {
			contentEvents: {
				postID: 42,
				isSinglePost: true,
				hasVimeoEmbed: true,
				wordCount: 476,
				estimatedReadTimeSeconds: 120,
				isLastPageOfMultiPagePost: true,
				readTimeThresholdPercent: 70,
				minimumReadTimeSeconds: 9,
			},
		};

		await import( './content-events' );

		expect( mockInitializePagination ).toHaveBeenCalledWith( {
			postID: 42,
			isSinglePost: true,
			hasVimeoEmbed: true,
			wordCount: 476,
			estimatedReadTimeSeconds: 120,
			isLastPageOfMultiPagePost: true,
			readTimeThresholdPercent: 70,
			minimumReadTimeSeconds: 9,
		} );
	} );

	it( 'invokes the read article initializer with the resolved configuration on import', async () => {
		global._googlesitekit = {
			contentEvents: {
				postID: 42,
				isSinglePost: true,
				hasVimeoEmbed: true,
				wordCount: 476,
				estimatedReadTimeSeconds: 120,
				isLastPageOfMultiPagePost: true,
				readTimeThresholdPercent: 70,
				minimumReadTimeSeconds: 9,
			},
		};

		await import( './content-events' );

		expect( mockInitializeReadArticle ).toHaveBeenCalledWith( {
			postID: 42,
			isSinglePost: true,
			hasVimeoEmbed: true,
			wordCount: 476,
			estimatedReadTimeSeconds: 120,
			isLastPageOfMultiPagePost: true,
			readTimeThresholdPercent: 70,
			minimumReadTimeSeconds: 9,
		} );
	} );

	it( 'should not let a throw from the pagination initializer propagate out of the module', async () => {
		// Mock console.error since this test intentionally triggers it.
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		mockInitializePagination.mockImplementation( () => {
			throw new Error( 'boom' );
		} );

		await expect( import( './content-events' ) ).resolves.toBeDefined();

		expect( consoleErrorSpy ).toHaveBeenCalledWith(
			'Site Kit: failed to initialize pagination click tracking.',
			expect.any( Error )
		);

		consoleErrorSpy.mockRestore();
	} );

	it( 'logs the error instead of crashing when the read article initializer throws', async () => {
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		mockInitializeReadArticle.mockImplementation( () => {
			throw new Error( 'boom' );
		} );

		await expect( import( './content-events' ) ).resolves.toBeDefined();

		expect( consoleErrorSpy ).toHaveBeenCalledWith(
			'Site Kit: failed to initialize read article tracking.',
			expect.any( Error )
		);

		consoleErrorSpy.mockRestore();
	} );

	it( 'should still initialize read article tracking when the pagination initializer throws', async () => {
		// `initializeSafely()` reports the throw, and the spy keeps that report
		// out of the test output.
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		mockInitializePagination.mockImplementation( () => {
			throw new Error( 'boom' );
		} );

		await import( './content-events' );

		expect( mockInitializeReadArticle ).toHaveBeenCalledTimes( 1 );

		consoleErrorSpy.mockRestore();
	} );
} );
