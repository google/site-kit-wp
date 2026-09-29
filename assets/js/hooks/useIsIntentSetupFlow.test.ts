/**
 * `useIsIntentSetupFlow` hook tests.
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
import useIsIntentSetupFlow from './useIsIntentSetupFlow';

describe( 'useIsIntentSetupFlow', () => {
	// The hook reads a query arg, which jsdom will not let tests change without
	// a writable `location`.
	mockLocation();

	it( 'should return true when the URL has `purpose=intent`', () => {
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-splash&purpose=intent';

		const { result } = renderHook( () => useIsIntentSetupFlow() );

		expect( result.current ).toBe( true );
	} );

	it( 'should return false when the URL has no `purpose`', () => {
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-splash';

		const { result } = renderHook( () => useIsIntentSetupFlow() );

		expect( result.current ).toBe( false );
	} );

	it( 'should return false when the URL has a `purpose` other than `intent`', () => {
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-splash&purpose=something-else';

		const { result } = renderHook( () => useIsIntentSetupFlow() );

		expect( result.current ).toBe( false );
	} );
} );
