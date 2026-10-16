/**
 * Recent traffic breakdown rows helper tests.
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
import {
	getTopChannelsReportOptions,
	getTopPostsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import {
	createBreakdownReport,
	createSiteTotalsReport,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { getPlainPermalinkPost } from './getPlainPermalinkPost';
import {
	getRecentTrafficBreakdownRows,
	getSiteTotal,
} from './getRecentTrafficBreakdownRows';

describe( 'getRecentTrafficBreakdownRows', () => {
	it( "should show each row's count and its share of the site's total", () => {
		const report = createBreakdownReport( [
			[ 'Direct', 50 ],
			[ 'Organic Search', 30 ],
			[ 'Referral', 10 ],
		] );

		expect( getRecentTrafficBreakdownRows( report, 120 ) ).toEqual( [
			{ label: 'Direct', value: '50', secondaryValue: '(41.7%)' },
			{ label: 'Organic Search', value: '30', secondaryValue: '(25%)' },
			{ label: 'Referral', value: '10', secondaryValue: '(8.3%)' },
		] );
	} );

	it( "should divide a row's count by the site's total, not by the total of the row's own report", () => {
		// The report of referrals counts the 12 visits from other sites, and
		// the site had 120 visits.
		const report = {
			...createBreakdownReport( [
				[ 'news.example.com', 8 ],
				[ 'forum.example.com', 4 ],
			] ),
			totals: [ { metricValues: [ { value: '12' } ] } ],
		};

		expect(
			getRecentTrafficBreakdownRows( report, 120 ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(6.7%)', '(3.3%)' ] );
	} );

	it( 'should add the missing tenth of a percent to the share with the largest remainder', () => {
		// 96, 41, and 17 of 157 visits are 61.15%, 26.11%, and 10.83%, and the
		// other 3 visits are 1.91%. Their whole tenths add up to 99.9%, and
		// 61.15% has the largest remainder.
		const report = createBreakdownReport( [
			[ 'Direct', 96 ],
			[ 'Organic Search', 41 ],
			[ 'Organic Social', 17 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report, 157 ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(61.2%)', '(26.1%)', '(10.8%)' ] );
	} );

	it( 'should show shares that add up to 100% when the rows count the whole total', () => {
		const report = createBreakdownReport( [
			[ 'Direct', 1 ],
			[ 'Organic Search', 1 ],
			[ 'Referral', 1 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report, 3 ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(33.4%)', '(33.3%)', '(33.3%)' ] );
	} );

	it( 'should show "<0.1%" for a share under a tenth of a percent when the rest of the total gets the missing tenth', () => {
		// 5,000 and 1 of 10,000 views are 50% and 0.01%, and the other 4,999
		// views are 49.99%.
		const report = createBreakdownReport( [
			[ '/?p=12', 5000 ],
			[ '/?p=34', 1 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report, 10000 ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(50%)', '(<0.1%)' ] );
	} );

	it( 'should show "99.9%" rather than "100%" for a row below the total, and add the missing tenth to another row', () => {
		const report = createBreakdownReport( [
			[ 'Direct', 2999 ],
			[ 'Email', 1 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report, 3000 ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(99.9%)', '(0.1%)' ] );
	} );

	it( 'should show 100% for a row with the whole total', () => {
		const report = createBreakdownReport( [ [ 'Direct', 40 ] ] );

		expect( getRecentTrafficBreakdownRows( report, 40 ) ).toEqual( [
			{ label: 'Direct', value: '40', secondaryValue: '(100%)' },
		] );
	} );

	it( 'should stop a share at 100% when a row counts more than the total', () => {
		const report = createBreakdownReport( [ [ 'Direct', 101 ] ] );

		expect( getRecentTrafficBreakdownRows( report, 100 ) ).toEqual( [
			{ label: 'Direct', value: '101', secondaryValue: '(100%)' },
		] );
	} );

	it( "should divide the rows' sum, so the shares add up to 100%, when the rows count more than the total", () => {
		const report = createBreakdownReport( [
			[ 'Direct', 60 ],
			[ 'Organic Search', 50 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report, 100 ).map(
				( { secondaryValue } ) => secondaryValue
			)
		).toEqual( [ '(54.5%)', '(45.5%)' ] );
	} );

	it( 'should show a count of a thousand or more in the short form the dashboard uses, such as "12K"', () => {
		const report = createBreakdownReport( [ [ 'Direct', 12345 ] ] );

		expect( getRecentTrafficBreakdownRows( report, 12345 ) ).toEqual( [
			{ label: 'Direct', value: '12K', secondaryValue: '(100%)' },
		] );
	} );

	it( 'should add up the rows that `getRowLabel` returns the same label for, and leave out the rows it returns no label for', () => {
		const report = createBreakdownReport( [
			[ '/', 50 ],
			[ '/?p=12', 30 ],
			[ '/?p=34', 20 ],
			[ '/?p=12&utm_source=newsletter', 15 ],
		] );

		expect(
			getRecentTrafficBreakdownRows(
				report,
				115,
				( pagePath ) =>
					getPlainPermalinkPost( pagePath, 'http://example.com' )
						?.path
			)
		).toEqual( [
			{ label: '/?p=12', value: '45', secondaryValue: '(39.1%)' },
			{ label: '/?p=34', value: '20', secondaryValue: '(17.4%)' },
		] );
	} );

	it( 'should leave out the values with no count', () => {
		const report = createBreakdownReport( [
			[ 'Direct', 5 ],
			[ 'Paid Search', 0 ],
			[ 'Referral', 3 ],
		] );

		expect( getRecentTrafficBreakdownRows( report, 8 ) ).toEqual( [
			{ label: 'Direct', value: '5', secondaryValue: '(62.5%)' },
			{ label: 'Referral', value: '3', secondaryValue: '(37.5%)' },
		] );
	} );

	it( 'should not return a row when no value in the report has a count', () => {
		const report = createBreakdownReport( [
			[ 'Direct', 0 ],
			[ 'Referral', 0 ],
		] );

		expect( getRecentTrafficBreakdownRows( report, 0 ) ).toEqual( [] );
	} );

	it( "should not show a share when there is no site's total", () => {
		const report = createBreakdownReport( [ [ 'Direct', 5 ] ] );

		expect( getRecentTrafficBreakdownRows( report ) ).toEqual( [
			{ label: 'Direct', value: '5', secondaryValue: undefined },
		] );
	} );

	it( "should not show a share when the site's total is zero", () => {
		const report = createBreakdownReport( [ [ 'Direct', 5 ] ] );

		expect( getRecentTrafficBreakdownRows( report, 0 ) ).toEqual( [
			{ label: 'Direct', value: '5', secondaryValue: undefined },
		] );
	} );

	it( 'should sort the rows by count, most first', () => {
		const report = createBreakdownReport( [
			[ 'blog.example.com', 1 ],
			[ 'news.example.com', 5 ],
			[ 'forum.example.com', 3 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { label } ) => label
			)
		).toEqual( [
			'news.example.com',
			'forum.example.com',
			'blog.example.com',
		] );
	} );

	it( 'should keep the order of the report for values with the same count', () => {
		const report = createBreakdownReport( [
			[ 'forum.example.com', 2 ],
			[ 'blog.example.com', 2 ],
			[ 'news.example.com', 2 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { label } ) => label
			)
		).toEqual( [
			'forum.example.com',
			'blog.example.com',
			'news.example.com',
		] );
	} );

	it( 'should show at most three rows, picked after the sort', () => {
		const report = createBreakdownReport( [
			[ '/a/', 1 ],
			[ '/b/', 2 ],
			[ '/c/', 3 ],
			[ '/d/', 4 ],
		] );

		expect(
			getRecentTrafficBreakdownRows( report ).map(
				( { label } ) => label
			)
		).toEqual( [ '/d/', '/c/', '/b/' ] );
	} );

	it( 'should keep the dimension value as the label, exactly as the report returned it', () => {
		const report = createBreakdownReport( [ [ '(not set)', 4 ] ] );

		expect( getRecentTrafficBreakdownRows( report, 4 ) ).toEqual( [
			{ label: '(not set)', value: '4', secondaryValue: '(100%)' },
		] );
	} );

	it( 'should not return a row for a report whose `rows` is an empty array', () => {
		expect(
			getRecentTrafficBreakdownRows( createBreakdownReport( [] ) )
		).toEqual( [] );
	} );

	it( 'should not return a row for a report with no `rows`', () => {
		expect( getRecentTrafficBreakdownRows( {} ) ).toEqual( [] );
	} );

	it( 'should not return a row when there is no report', () => {
		expect( getRecentTrafficBreakdownRows() ).toEqual( [] );
	} );
} );

describe( 'getSiteTotal', () => {
	const dateRange = { startDate: '2025-02-03', endDate: '2025-02-05' };

	it( "should return the site's visits for the report of a column that counts visits", () => {
		expect(
			getSiteTotal(
				createSiteTotalsReport( { visits: 157, views: 268 } ),
				getTopChannelsReportOptions( dateRange )
			)
		).toBe( 157 );
	} );

	it( "should return the site's views for the report of a column that counts views", () => {
		expect(
			getSiteTotal(
				createSiteTotalsReport( { visits: 157, views: 268 } ),
				getTopPostsReportOptions( dateRange, {
					usingPlainPermalinks: false,
				} )
			)
		).toBe( 268 );
	} );

	it( "should return `0` for the report of a column that counts a metric the report of the site's totals doesn't have", () => {
		expect(
			getSiteTotal(
				createSiteTotalsReport( { visits: 157, views: 268 } ),
				{
					...getTopChannelsReportOptions( dateRange ),
					metrics: [ { name: 'totalUsers' } ],
				}
			)
		).toBe( 0 );
	} );

	it( "should return `0` when there is no report of the site's totals", () => {
		expect(
			getSiteTotal( undefined, getTopChannelsReportOptions( dateRange ) )
		).toBe( 0 );
	} );

	it( "should return `0` when the report of the site's totals has no `totals`", () => {
		expect(
			getSiteTotal( {}, getTopChannelsReportOptions( dateRange ) )
		).toBe( 0 );
	} );

	it( "should return `0` before the options of the column's report can be built", () => {
		expect(
			getSiteTotal(
				createSiteTotalsReport( { visits: 157, views: 268 } ),
				undefined
			)
		).toBe( 0 );
	} );
} );
