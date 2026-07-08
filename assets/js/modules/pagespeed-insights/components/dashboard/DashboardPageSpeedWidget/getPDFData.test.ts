/**
 * `getPDFData` unit tests.
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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import * as fixtures from '@/js/modules/pagespeed-insights/datastore/__fixtures__';
import {
	STRATEGY_DESKTOP,
	STRATEGY_MOBILE,
} from '@/js/modules/pagespeed-insights/datastore/constants';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
} from '@tests/js/test-utils';
import getPDFData, { GetPDFDataParams } from './getPDFData';

const REFERENCE_URL = fixtures.pagespeedMobile.loadingExperience.id;

// Regex matching any PSI pagespeed endpoint regardless of strategy.
const PSI_ENDPOINT = new RegExp(
	'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
);

/**
 * Matches a mobile-strategy PageSpeed request, so the fetch mock can serve
 * mobile and desktop different fixtures.
 *
 * @since n.e.x.t
 *
 * @param url The request URL the fetch mock checks.
 * @return Whether the URL requests the mobile report.
 */
function MOBILE_ENDPOINT( url: string ) {
	return (
		url.includes( '/data/pagespeed' ) &&
		url.includes( `strategy=${ STRATEGY_MOBILE }` )
	);
}
/**
 * Matches a desktop-strategy PageSpeed request, so the fetch mock can serve
 * mobile and desktop different fixtures.
 *
 * @since n.e.x.t
 *
 * @param url The request URL the fetch mock checks.
 * @return Whether the URL requests the desktop report.
 */
function DESKTOP_ENDPOINT( url: string ) {
	return (
		url.includes( '/data/pagespeed' ) &&
		url.includes( `strategy=${ STRATEGY_DESKTOP }` )
	);
}

const API_ERROR_BODY = {
	code: 'internal_server_error',
	message: 'Internal server error',
	data: { status: 500 },
};

/**
 * Creates a test registry with site info and modules provided, typed as the
 * registry shape `getPDFData` expects.
 *
 * @since n.e.x.t
 *
 * @return The test registry to pass to `getPDFData`.
 */
function buildRegistry(): GetPDFDataParams[ 'registry' ] {
	const registry = createTestRegistry();
	provideSiteInfo( registry, { referenceSiteURL: REFERENCE_URL } );
	provideModules( registry );
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- WPDataRegistry type does not include resolveSelect in its declarations, but the runtime registry does.
	return registry as any;
}

describe( 'getPDFData', () => {
	it( 'resolves the reference URL via CORE_SITE.getCurrentReferenceURL', async () => {
		fetchMock.get( PSI_ENDPOINT, {
			body: fixtures.pagespeedMobile,
			status: 200,
		} );
		const registry = buildRegistry();
		const resolveSelectSpy = jest.spyOn( registry, 'resolveSelect' );

		await getPDFData( {
			registry,
			dates: undefined,
			signal: new AbortController().signal,
		} );

		expect( resolveSelectSpy ).toHaveBeenCalledWith( CORE_SITE );
	} );

	it( 'returns lab and field data for both strategies from the fixture reports', async () => {
		fetchMock.get( MOBILE_ENDPOINT, {
			body: fixtures.pagespeedMobile,
			status: 200,
		} );
		fetchMock.get( DESKTOP_ENDPOINT, {
			body: fixtures.pagespeedDesktop,
			status: 200,
		} );
		const registry = buildRegistry();

		const result = await getPDFData( {
			registry,
			dates: undefined,
			signal: new AbortController().signal,
		} );

		expect( result.data ).not.toBeNull();
		expect( result.data?.mobile ).not.toBeNull();
		expect( result.data?.desktop ).not.toBeNull();
		// Lab: LCP display value from fixture.
		// Lighthouse uses U+00A0 (no-break space) between the number and unit.
		expect(
			result.data?.mobile?.lab.largestContentfulPaint.displayValue
		).toBe( '1.5\xa0s' );
		// Field: LCP converted from percentile in ms (regular space, not NBSP).
		expect(
			result.data?.mobile?.field?.largestContentfulPaint?.displayValue
		).toBe( '2.6 s' );
		// Field: INP percentile in ms.
		expect(
			result.data?.mobile?.field?.interactionToNextPaint?.displayValue
		).toBe( '295 ms' );
	} );

	it( 'sets only the failing strategy to null when one strategy fails', async () => {
		fetchMock.get( MOBILE_ENDPOINT, {
			body: API_ERROR_BODY,
			status: 500,
		} );
		fetchMock.get( DESKTOP_ENDPOINT, {
			body: fixtures.pagespeedDesktop,
			status: 200,
		} );
		const registry = buildRegistry();

		const result = await getPDFData( {
			registry,
			dates: undefined,
			signal: new AbortController().signal,
		} );

		expect( result.data ).not.toBeNull();
		expect( result.data?.mobile ).toBeNull();
		expect( result.data?.desktop ).not.toBeNull();
		// The API layer logs an error when a fetch fails.
		expect( console ).toHaveErrored();
	} );

	it( 'throws when both strategies fail', async () => {
		fetchMock.get( PSI_ENDPOINT, { body: API_ERROR_BODY, status: 500 } );
		const registry = buildRegistry();

		await expect(
			getPDFData( {
				registry,
				dates: undefined,
				signal: new AbortController().signal,
			} )
		).rejects.toThrow();

		// The API layer logs an error for each failing strategy.
		expect( console ).toHaveErrored();
	} );

	it( 're-fetches on a second export after the first one failed', async () => {
		fetchMock.get( PSI_ENDPOINT, { body: API_ERROR_BODY, status: 500 } );
		const registry = buildRegistry();

		await expect(
			getPDFData( {
				registry,
				dates: undefined,
				signal: new AbortController().signal,
			} )
		).rejects.toThrow();
		expect( console ).toHaveErrored();

		// Second export with a fresh signal and successful responses.
		fetchMock.mockReset();
		fetchMock.get( PSI_ENDPOINT, {
			body: fixtures.pagespeedMobile,
			status: 200,
		} );

		const result = await getPDFData( {
			registry,
			dates: undefined,
			signal: new AbortController().signal,
		} );

		expect( result.data ).not.toBeNull();
		expect( result.data?.mobile ).not.toBeNull();
		expect( result.data?.desktop ).not.toBeNull();
	} );

	it( 'returns early without fetching when signal is already aborted', async () => {
		const registry = buildRegistry();
		const controller = new AbortController();
		controller.abort();

		const result = await getPDFData( {
			registry,
			dates: undefined,
			signal: controller.signal,
		} );

		// Null data tells the report document to skip the widget, so the PDF
		// holds no empty section.
		expect( result ).toEqual( { data: null } );
	} );
} );
