/**
 * Latest content row joining utility tests.
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
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import {
	hasUniquePagePath,
	joinLatestContentRows,
} from './joinLatestContentRows';

function buildItem( id: number, publishedAt: string ): RecentContentItem {
	return {
		id,
		title: `Post ${ id }`,
		permalink: `https://example.com/post-${ id }/`,
		pagePath: `/post-${ id }/`,
		publishedAt,
		sitePublishedAt: publishedAt.replace( 'Z', '' ),
	};
}

function buildReportRow( pagePath: string, metrics: number[] ) {
	return {
		dimensionValues: [ { value: pagePath } ],
		metricValues: metrics.map( ( value ) => ( { value: `${ value }` } ) ),
	};
}

describe( 'joinLatestContentRows', () => {
	const newest = buildItem( 3, '2026-10-08T09:00:00Z' );
	const middle = buildItem( 2, '2026-10-07T09:00:00Z' );
	const oldest = buildItem( 1, '2026-10-01T09:00:00Z' );

	it( 'should keep a post with no report row and fill its metrics with zeros', () => {
		const rows = joinLatestContentRows( [ newest, oldest ], {
			rows: [ buildReportRow( '/post-1/', [ 120, 100, 0.8, 65.5 ] ) ],
		} );

		expect( rows ).toEqual( [
			{
				...newest,
				pageviews: 0,
				sessions: 0,
				engagementRate: 0,
				averageSessionDuration: 0,
			},
			{
				...oldest,
				pageviews: 120,
				sessions: 100,
				engagementRate: 0.8,
				averageSessionDuration: 65.5,
			},
		] );
	} );

	it( 'should keep the order of the posts regardless of traffic', () => {
		const rows = joinLatestContentRows( [ newest, middle, oldest ], {
			rows: [
				buildReportRow( '/post-1/', [ 900, 800, 0.7, 60 ] ),
				buildReportRow( '/post-2/', [ 500, 400, 0.6, 60 ] ),
				buildReportRow( '/post-3/', [ 5, 4, 0.5, 60 ] ),
			],
		} );

		expect( rows.map( ( { id } ) => id ) ).toEqual( [ 3, 2, 1 ] );
	} );

	it( 'should ignore a report row that matches no post', () => {
		const rows = joinLatestContentRows( [ newest ], {
			rows: [
				buildReportRow( '/post-3/', [ 10, 8, 0.6, 30 ] ),
				buildReportRow( '/unrelated/', [ 999, 999, 0.9, 999 ] ),
			],
		} );

		expect( rows ).toHaveLength( 1 );
		expect( rows[ 0 ] ).toMatchObject( {
			pagePath: '/post-3/',
			pageviews: 10,
		} );
	} );

	it( 'should zero-fill every post when the report is empty', () => {
		const zeroMetrics = {
			pageviews: 0,
			sessions: 0,
			engagementRate: 0,
			averageSessionDuration: 0,
		};

		expect( joinLatestContentRows( [ newest, oldest ], {} ) ).toEqual( [
			{ ...newest, ...zeroMetrics },
			{ ...oldest, ...zeroMetrics },
		] );
		expect( joinLatestContentRows( [ newest ], undefined ) ).toEqual( [
			{ ...newest, ...zeroMetrics },
		] );
	} );

	it( 'should not give the homepage row to posts with plain permalinks', () => {
		const plainPermalinkPosts = [ 1, 2 ].map( ( id ) => ( {
			...buildItem( id, '2026-10-08T09:00:00Z' ),
			permalink: `https://example.com/?p=${ id }`,
			pagePath: '/',
		} ) );

		const rows = joinLatestContentRows( plainPermalinkPosts, {
			rows: [ buildReportRow( '/', [ 5000, 4000, 0.5, 90 ] ) ],
		} );

		expect( rows ).toEqual(
			plainPermalinkPosts.map( ( post ) => ( {
				...post,
				pageviews: 0,
				sessions: 0,
				engagementRate: 0,
				averageSessionDuration: 0,
			} ) )
		);
	} );
} );

describe( 'hasUniquePagePath', () => {
	it( 'should return true for a pretty permalink', () => {
		expect(
			hasUniquePagePath( buildItem( 1, '2026-10-08T09:00:00Z' ) )
		).toBe( true );
	} );

	it( 'should return false for a plain permalink with a query string', () => {
		expect(
			hasUniquePagePath( {
				...buildItem( 1, '2026-10-08T09:00:00Z' ),
				permalink: 'https://example.com/?p=1',
				pagePath: '/',
			} )
		).toBe( false );
	} );
} );
