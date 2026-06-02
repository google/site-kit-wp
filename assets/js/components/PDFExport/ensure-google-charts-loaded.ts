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

const GOOGLE_CHARTS_LOADER_SRC = 'https://www.gstatic.com/charts/loader.js';

interface GoogleChartsGlobal {
	charts?: {
		load?: (
			version: string,
			options: { packages: string[] }
		) => Promise< void >;
	};
	visualization?: {
		DataTable?: unknown;
	};
}

/**
 * Reads the (untyped) `google` global as the narrow slice this loader needs.
 *
 * @since n.e.x.t
 *
 * @return {Object|undefined} The `google` global, when present.
 */
function getGoogle(): GoogleChartsGlobal | undefined {
	return ( global as unknown as { google?: GoogleChartsGlobal } ).google;
}

/**
 * Injects the Google Charts CDN loader script into the document head.
 *
 * @since n.e.x.t
 *
 * @return {Promise<void>} Resolves on the script's `load` event, rejects on `error`.
 */
function injectLoaderScript(): Promise< void > {
	return new Promise( ( resolve, reject ) => {
		const script = global.document.createElement( 'script' );
		script.src = GOOGLE_CHARTS_LOADER_SRC;
		script.onload = () => resolve();
		script.onerror = () =>
			reject(
				new Error(
					'Site Kit: failed to load the Google Charts loader script.'
				)
			);
		global.document.head.appendChild( script );
	} );
}

/**
 * Loads the CDN loader (if needed) and the `corechart` package.
 *
 * @since n.e.x.t
 *
 * @return {Promise<void>} Resolves once Google Charts is ready to draw.
 */
async function loadGoogleCharts(): Promise< void > {
	const google = getGoogle();

	// Another plugin may have loaded an incompatible build of Google Charts that
	// does not expose `charts.load`. Fail loudly rather than silently no-op.
	if ( google?.charts && typeof google.charts.load !== 'function' ) {
		throw new Error(
			'Site Kit: Google Charts is already present on the page but `google.charts.load` is not a function (possible version collision with another plugin).'
		);
	}

	// Inject the CDN loader unless `google.charts.load` is already available.
	if ( typeof google?.charts?.load !== 'function' ) {
		await injectLoaderScript();
	}

	const loadedGoogle = getGoogle();
	if ( typeof loadedGoogle?.charts?.load !== 'function' ) {
		throw new Error(
			'Site Kit: the Google Charts loader script did not expose `google.charts.load`.'
		);
	}

	await loadedGoogle.charts.load( CHART_VERSION, {
		packages: [ 'corechart' ],
	} );
}

let loadPromise: Promise< void > | null = null;

/**
 * Ensures the Google Charts library is loaded and ready to draw charts.
 *
 * `@react-pdf/renderer` runs without access to the dashboard's already-loaded
 * charts, so chart-bearing PDF widgets rasterise charts offscreen with Google
 * Charts. This loads the same CDN library the dashboard uses, memoising the
 * in-flight promise so repeat exports in the same session do not re-fetch the
 * loader script. A failed load resets the cache so a later attempt can retry.
 *
 * @since n.e.x.t
 *
 * @return {Promise<void>} Resolves once `google.visualization` is ready.
 */
export default function ensureGoogleChartsLoaded(): Promise< void > {
	if ( getGoogle()?.visualization?.DataTable ) {
		return Promise.resolve();
	}

	if ( ! loadPromise ) {
		loadPromise = loadGoogleCharts().catch( ( error ) => {
			// Reset so a subsequent call can retry after a transient failure.
			loadPromise = null;
			throw error;
		} );
	}

	return loadPromise;
}
