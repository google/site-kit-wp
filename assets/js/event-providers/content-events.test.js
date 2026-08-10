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

describe( 'content-events', () => {
	let addEventListenerSpy;
	let gtagEventMock;

	beforeEach( () => {
		addEventListenerSpy = jest.spyOn( global.document, 'addEventListener' );
		gtagEventMock = jest.fn();
		delete global._googlesitekit;
		jest.resetModules();
	} );

	afterEach( () => {
		addEventListenerSpy.mockRestore();
	} );

	it( 'imports cleanly when global._googlesitekit is undefined and returns default config', () => {
		delete global._googlesitekit;

		const { getContentEventsConfig } = require( './content-events' );

		expect( getContentEventsConfig() ).toEqual( {
			postID: 0,
			isSinglePost: false,
		} );
		expect( addEventListenerSpy ).not.toHaveBeenCalled();
		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'imports cleanly when global._googlesitekit is present without contentEvents key and returns default config', () => {
		global._googlesitekit = {
			gtagEvent: gtagEventMock,
		};

		const { getContentEventsConfig } = require( './content-events' );

		expect( getContentEventsConfig() ).toEqual( {
			postID: 0,
			isSinglePost: false,
		} );
		expect( addEventListenerSpy ).not.toHaveBeenCalled();
		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'returns published config values when contentEvents is provided', () => {
		global._googlesitekit = {
			contentEvents: {
				postID: 42,
				isSinglePost: true,
			},
			gtagEvent: gtagEventMock,
		};

		const { getContentEventsConfig } = require( './content-events' );

		expect( getContentEventsConfig() ).toEqual( {
			postID: 42,
			isSinglePost: true,
		} );
		expect( addEventListenerSpy ).not.toHaveBeenCalled();
		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );
} );
