/**
 * `useForwardableParams` hook tests.
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
import { renderHook } from '../../../tests/js/test-utils';
import useForwardableParams from './useForwardableParams';
import useQueryArg from './useQueryArg';

jest.mock( './useQueryArg', () => jest.fn() );

describe( 'useForwardableParams', () => {
	let queryArgs;

	beforeEach( () => {
		queryArgs = {};
		useQueryArg.mockImplementation( ( key ) => [ queryArgs[ key ] ] );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return only forwardable params that are present', () => {
		queryArgs = {
			notification: 'initial_setup_success',
			panel: 'email-reporting',
		};

		const { result } = renderHook( () => useForwardableParams() );

		expect( result.current ).toEqual( {
			notification: 'initial_setup_success',
			panel: 'email-reporting',
		} );
	} );

	it( 'should update returned params when query arg values change between renders', () => {
		queryArgs = {
			notification: 'reset_success',
		};

		const { result, rerender } = renderHook( () => useForwardableParams() );

		expect( result.current ).toEqual( {
			notification: 'reset_success',
		} );

		queryArgs = {
			panel: 'email-reporting',
		};
		rerender();

		expect( result.current ).toEqual( {
			panel: 'email-reporting',
		} );
	} );
} );
