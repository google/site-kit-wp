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
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * External dependencies
 */
import Data from 'googlesitekit-data';
import { get } from 'googlesitekit-api';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { DATE_RANGE_OFFSET } from '@/js/modules/analytics-4/datastore/constants';
import { numFmt } from '@/js/util/i18n';
import {
	chunkArray,
	parseRowsToPathMap,
	type ReportPayload,
} from './googlesitekit-admin-post-list-ga4-helpers';

const CHUNK_SIZE = 80;

/**
 * Inline config from PHP `Script_Data` (`googlesitekit-admin-post-list-ga4-data` → `_googlesitekitPostListGA4Data`).
 *
 * @since n.e.x.t
 */
export interface PostListGA4Config {
	metric?: string;
	dateRangeSlug?: string;
	moduleSlug?: string;
}

declare global {
	interface Window {
		_googlesitekitPostListGA4Data?: PostListGA4Config;
	}
}

function getConfig(): PostListGA4Config {
	if ( typeof window === 'undefined' ) {
		return {};
	}
	return window._googlesitekitPostListGA4Data ?? {};
}

function collectPaths(): string[] {
	const spans = document.querySelectorAll(
		'.googlesitekit-post-list-ga4-views[data-page-path]'
	);
	const paths = new Set< string >();
	spans.forEach( ( element ) => {
		const p = element.getAttribute( 'data-page-path' );
		if ( p ) {
			paths.add( p );
		}
	} );
	return Array.from( paths );
}

async function fetchReportForPaths(
	paths: string[],
	metric: string,
	startDate: string,
	endDate: string,
	moduleSlug: string
): Promise< Record< string, string > > {
	const merged: Record< string, string > = {};
	for ( const batch of chunkArray( paths, CHUNK_SIZE ) ) {
		if ( ! batch.length ) {
			continue;
		}
		const report = ( await get( 'modules', moduleSlug, 'report', {
			dimensions: [ { name: 'pagePathPlusQueryString' } ],
			metrics: [ { name: metric } ],
			dimensionFilters: {
				pagePathPlusQueryString: batch,
			},
			startDate,
			endDate,
			limit: Math.min( batch.length, 1000 ),
		} ) ) as ReportPayload;
		Object.assign( merged, parseRowsToPathMap( report ) );
	}
	return merged;
}

function applyValuesToDom( pathToValue: Record< string, string > ): void {
	document
		.querySelectorAll(
			'.googlesitekit-post-list-ga4-views[data-page-path]'
		)
		.forEach( ( element ) => {
			const path = element.getAttribute( 'data-page-path' );
			if ( ! path ) {
				return;
			}
			const raw = pathToValue[ path ];
			if ( raw === undefined ) {
				element.textContent = numFmt( 0 );
				return;
			}
			const num = parseFloat( raw );
			if ( Number.isNaN( num ) ) {
				element.textContent = String( raw );
			} else {
				element.textContent = numFmt( num );
			}
		} );
}

domReady( async () => {
	const cfg = getConfig();
	const { metric, dateRangeSlug, moduleSlug } = cfg;
	if ( ! metric || ! dateRangeSlug || ! moduleSlug ) {
		return;
	}

	const paths = collectPaths();
	if ( ! paths.length ) {
		return;
	}

	try {
		Data.dispatch( CORE_USER ).setDateRange( dateRangeSlug );
		const { startDate, endDate } = Data.select(
			CORE_USER
		).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } );

		const pathToValue = await fetchReportForPaths(
			paths,
			metric,
			startDate,
			endDate,
			moduleSlug
		);

		applyValuesToDom( pathToValue );
	} catch {
		// Keep loading placeholder on failure.
	}
} );
