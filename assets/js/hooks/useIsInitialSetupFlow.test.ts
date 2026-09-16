/**
 * `useIsInitialSetupFlow` hook tests.
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
import { mockLocation } from '@tests/js/mock-browser-utils';
import { renderHook } from '@tests/js/test-utils';
import useIsInitialSetupFlow from './useIsInitialSetupFlow';

describe( 'useIsInitialSetupFlow', () => {
	// The hook reads a query arg, which jsdom will not let tests change without
	// a writable `location`.
	mockLocation();

	function setQueryString( queryString: string ) {
		global.location.href = `http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard${ queryString }`;
	}

	it( 'is true when the feature is enabled and the flow marks the screen', () => {
		setQueryString( '&showProgress=true' );

		const { result } = renderHook( () => useIsInitialSetupFlow(), {
			features: [ 'setupFlowRefresh' ],
		} );

		expect( result.current ).toBe( true );
	} );

	it( 'is false when the feature is disabled', () => {
		setQueryString( '&showProgress=true' );

		const { result } = renderHook( () => useIsInitialSetupFlow() );

		expect( result.current ).toBe( false );
	} );

	it( 'is false when the screen is not part of the flow', () => {
		setQueryString( '' );

		const { result } = renderHook( () => useIsInitialSetupFlow(), {
			features: [ 'setupFlowRefresh' ],
		} );

		expect( result.current ).toBe( false );
	} );

	it( 'is false for a `showProgress` value other than "true"', () => {
		setQueryString( '&showProgress=false' );

		const { result } = renderHook( () => useIsInitialSetupFlow(), {
			features: [ 'setupFlowRefresh' ],
		} );

		expect( result.current ).toBe( false );
	} );
} );
