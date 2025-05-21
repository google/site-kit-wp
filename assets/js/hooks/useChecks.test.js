/**
 * `useChecks` hook tests.
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
import { renderHook, actHook as act } from '../../../tests/js/test-utils';
import { muteFetch } from '../../../tests/js/utils';
import { useChecks } from './useChecks';

describe( 'useChecks', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	it( 'should return { complete:true, error: undefined } successful check runs.', async () => {
		const checks = [ () => Promise.resolve() ];
		let result;
		await act( async () => {
			( { result } = await renderHook( () => useChecks( checks ) ) );
		} );

		expect( result.current ).toStrictEqual( {
			complete: true,
			error: undefined,
		} );
	} );

	it( 'should return { complete:true, error: undefined } with no checks to run.', async () => {
		const checks = [];
		let result;
		await act( async () => {
			( { result } = await renderHook( () => useChecks( checks ) ) );
		} );

		expect( result.current ).toStrictEqual( {
			complete: true,
			error: undefined,
		} );
	} );

	it( 'returns the first error thrown by a check', async () => {
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/connection' )
		);
		const checks = [
			() => true,
			() => {
				setTimeout( () => {
					throw 'error1';
				}, 1 );
			},
			() => {
				throw 'error2';
			},
		];
		const { result, waitForValueToChange } = renderHook( () =>
			useChecks( checks )
		);

		expect( result.current ).toStrictEqual( {
			complete: false,
			error: undefined,
		} );

		await waitForValueToChange( () => result.current.complete );

		expect( result.current ).toStrictEqual( {
			complete: true,
			error: 'error2',
		} );
	} );
} );
