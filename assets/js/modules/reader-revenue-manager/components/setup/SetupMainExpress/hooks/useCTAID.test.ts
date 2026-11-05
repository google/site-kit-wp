/**
 * Reader Revenue Manager express setup `useCTAID` hook tests.
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
import { Registry } from '@/js/googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { EXPRESS_SETUP_CTA_ID_UI_KEY } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	actHook as act,
	createTestRegistry,
	renderHook,
} from '@tests/js/test-utils';
import useCTAID from './useCTAID';

describe( 'useCTAID', () => {
	mockLocation();

	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	it( 'should use the ctaID query argument as the initial value', () => {
		global.location.href =
			'http://example.com/?cta=newsletter-signup&ctaID=a1b2c3';

		const { result } = renderHook( () => useCTAID(), { registry } );

		expect( result.current[ 0 ] ).toBe( 'a1b2c3' );
	} );

	it( 'should be undefined when there is no ctaID query argument', () => {
		global.location.href = 'http://example.com/?cta=newsletter-signup';

		const { result } = renderHook( () => useCTAID(), { registry } );

		expect( result.current[ 0 ] ).toBeUndefined();
	} );

	it( 'should reactively update the value, the UI value and the query argument when set', () => {
		global.location.href = 'http://example.com/?cta=newsletter-signup';

		const { result } = renderHook( () => useCTAID(), { registry } );

		act( () => {
			result.current[ 1 ]( 'a1b2c3' );
		} );

		expect( result.current[ 0 ] ).toBe( 'a1b2c3' );
		expect(
			registry.select( CORE_UI ).getValue( EXPRESS_SETUP_CTA_ID_UI_KEY )
		).toBe( 'a1b2c3' );
		expect( global.location.href ).toContain( 'ctaID=a1b2c3' );
	} );

	it.each( [
		[ 'is missing', 'http://example.com/' ],
		[ 'is not supported', 'http://example.com/?cta=unsupported' ],
	] )(
		'should not set the ctaID when the cta query argument %s',
		( _, url ) => {
			global.location.href = url;

			const { result } = renderHook( () => useCTAID(), { registry } );

			act( () => {
				result.current[ 1 ]( 'a1b2c3' );
			} );

			expect( result.current[ 0 ] ).toBeUndefined();
			expect(
				registry
					.select( CORE_UI )
					.getValue( EXPRESS_SETUP_CTA_ID_UI_KEY )
			).toBeUndefined();
			expect( global.location.href ).not.toContain( 'ctaID' );
		}
	);
} );
