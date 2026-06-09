/**
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
import { CHART_VERSION } from '@/js/components/GoogleChart/constants';

const LOADER_SELECTOR =
	'script[src="https://www.gstatic.com/charts/loader.js"]';

type EnsureGoogleChartsLoaded =
	typeof import('./ensure-google-charts-loaded').default;

function setGoogle( value: unknown ) {
	( global as unknown as { google?: unknown } ).google = value;
}

function getLoaderScript(): Element | null {
	return global.document.head.querySelector( LOADER_SELECTOR );
}

describe( 'ensureGoogleChartsLoaded', () => {
	let ensureGoogleChartsLoaded: EnsureGoogleChartsLoaded;

	beforeEach( async () => {
		// The loader memoises an in-flight promise at module scope, so reset the
		// module registry between tests to start from a clean cache each time.
		jest.resetModules();
		ensureGoogleChartsLoaded = (
			await import( './ensure-google-charts-loaded' )
		 ).default;
		setGoogle( undefined );
	} );

	afterEach( () => {
		getLoaderScript()?.remove();
		setGoogle( undefined );
	} );

	it( 'should resolve immediately when Google Charts is already available', async () => {
		setGoogle( { visualization: { DataTable: function DataTable() {} } } );

		await expect( ensureGoogleChartsLoaded() ).resolves.toBeUndefined();

		expect( getLoaderScript() ).toBeNull();
	} );

	it( 'should inject the loader script and load the corechart package when not present', async () => {
		const load = jest.fn( () => Promise.resolve() );

		const promise = ensureGoogleChartsLoaded();

		const script = getLoaderScript();
		expect( script ).not.toBeNull();

		// Simulate the CDN loader becoming available, then fire the load event.
		setGoogle( { charts: { load } } );
		script?.dispatchEvent( new Event( 'load' ) );

		await expect( promise ).resolves.toBeUndefined();
		expect( load ).toHaveBeenCalledWith( CHART_VERSION, {
			packages: [ 'corechart' ],
		} );
	} );

	it( 'should reuse a single in-flight promise across repeat calls', async () => {
		const load = jest.fn( () => Promise.resolve() );

		const first = ensureGoogleChartsLoaded();
		const second = ensureGoogleChartsLoaded();

		// Same promise reference and only one script injected.
		expect( first ).toBe( second );
		expect(
			global.document.head.querySelectorAll( LOADER_SELECTOR )
		).toHaveLength( 1 );

		setGoogle( { charts: { load } } );
		getLoaderScript()?.dispatchEvent( new Event( 'load' ) );

		await Promise.all( [ first, second ] );
		expect( load ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should reject when the loader script fails to load', async () => {
		const promise = ensureGoogleChartsLoaded();

		const script = getLoaderScript();
		expect( script ).not.toBeNull();

		script?.dispatchEvent( new Event( 'error' ) );

		await expect( promise ).rejects.toThrow(
			/failed to load the Google Charts loader script/i
		);
	} );

	it( 'should throw when an incompatible Google Charts version is already present', async () => {
		// `google.charts` exists but `load` is not a function — another plugin's
		// incompatible build.
		setGoogle( { charts: {} } );

		await expect( ensureGoogleChartsLoaded() ).rejects.toThrow(
			/google\.charts\.load/i
		);

		expect( getLoaderScript() ).toBeNull();
	} );
} );
