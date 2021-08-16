/**
 * `useQueryArg` hook tests.
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
 * Internal dependencies
 */
import { renderHook, actHook } from '../../../tests/js/test-utils';
import useQueryArg from './useQueryArg';

describe( 'useQueryArg', () => {
	let mockGlobal;
	const historyReplaceStateMock = jest.fn();

	beforeAll( () => {
		mockGlobal = {
			location: {
				href: 'http://example.com/path?page=demo',
			},
			history: {
				replaceState: historyReplaceStateMock,
			},
		};
	} );

	afterEach( () => {
		historyReplaceStateMock.mockClear();
	} );

	it( 'should return initial query param by default', () => {
		const { result } = renderHook( () =>
			useQueryArg( 'page', '', mockGlobal )
		);
		const [ query ] = result.current;

		expect( query ).toBe( 'demo' );
	} );

	it( 'should push a new state to history when setQuery is called', () => {
		const { result } = renderHook( () =>
			useQueryArg( 'page', '', mockGlobal )
		);
		const [ , setQuery ] = result.current;

		actHook( () => {
			setQuery( 'prod' );
		} );

		const updatedURL = 'http://example.com/path?page=prod';
		expect( historyReplaceStateMock ).toHaveBeenCalledWith(
			null,
			'',
			updatedURL
		);
	} );

	it( 'should push a new state to history when setQuery is called with url encodable value', () => {
		const { result } = renderHook( () =>
			useQueryArg( 'page', '', mockGlobal )
		);
		const [ , setQuery ] = result.current;

		actHook( () => {
			setQuery( 'p%$^rod' );
		} );

		const updatedURL = 'http://example.com/path?page=p%25%24%5Erod';
		expect( historyReplaceStateMock ).toHaveBeenCalledWith(
			null,
			'',
			updatedURL
		);
	} );
} );
