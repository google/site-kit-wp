/**
 * `useQueryString` hook tests.
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
 * Internal dependencies
 */
import { renderHook, actHook } from '../../../tests/js/test-utils';
import useQueryString from './useQueryString';

describe( 'useQueryString', () => {
	let oldLocation;
	let oldHistory;
	const historyPushMock = jest.fn();

	beforeAll( () => {
		oldLocation = global.location;
		oldHistory = global.history;
		delete global.location;
		delete global.history;
		global.location = {
			protocol: 'http:',
			host: 'example.com',
			pathname: 'path',
			search: '?page=demo',
		};
		global.history = {
			replaceState: historyPushMock,
		};
	} );

	afterAll( () => {
		global.location = oldLocation;
		global.history = oldHistory;
	} );

	it( 'should return initial query param by default', () => {
		const { result: { current: [ query ] } } = renderHook( ( ) => useQueryString( 'page' ) );

		expect( query ).toBe( 'demo' );
	} );

	it( 'should push a new state to history when setQuery is called', () => {
		const { result: { current: [ , setQuery ] } } = renderHook( ( ) => useQueryString( 'page' ) );

		actHook( () => {
			setQuery( 'prod' );
		} );

		const updatedURL = 'path?page=prod';
		expect( historyPushMock ).toHaveBeenCalledWith( {
			path: updatedURL,
		}, '', updatedURL );
	} );
} );
