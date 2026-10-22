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
 * External dependencies
 */
import type { Download, Request } from '@playwright/test';

/**
 * Internal dependencies
 */
import { expect, test } from '../../playwright';
import {
	asUser,
	withConnectedModules,
	withDataAvailable,
	withFixtures,
	withKeyMetrics,
	withPlugins,
	withReferenceDate,
} from '../../wordpress';
import { PDFGenerationPage } from '../pdf-generation/pdf-generation-page';

/**
 * Dates found by counting back from the reference date must be whole calendar
 * days before it in the browser's timezone, including the days after the
 * clocks move forward, when one day has only 23 hours.
 *
 * The e2e module-activation plugin provides these settings via `pre_option`,
 * which bypasses the module's default merge (so every setting the module reads
 * must be present or it emits an undefined-index notice).
 *
 * This mirrors the module's `get_default()` with connected identifiers filled
 * in.
 */
const analytics4Module = {
	slug: 'analytics-4',
	settings: {
		ownerID: 1,
		accountID: '12345678',
		adsConversionID: '',
		propertyID: '123456789',
		webDataStreamID: '1234567890',
		measurementID: 'G-A1B2C3D4E5',
		trackingDisabled: [ 'loggedinUsers' ],
		useSnippet: true,
		googleTagID: '',
		googleTagAccountID: '',
		googleTagContainerID: '',
		googleTagContainerDestinationIDs: null,
		googleTagLastSyncedAtMs: 0,
		// The Top recent trending pages widget requires this custom dimension,
		// and listing it here also skips the unmocked custom dimension sync.
		availableCustomDimensions: [ 'googlesitekit_post_date' ],
		propertyCreateTime: 0,
		adSenseLinked: false,
		adSenseLinkedLastSyncedAt: 0,
		adsLinked: false,
		adsLinkedLastSyncedAt: 0,
		detectedEvents: [],
		newConversionEventsLastUpdateAt: 0,
		lostConversionEventsLastUpdateAt: 0,
	},
};

const REPORT_PATH = 'google-site-kit/v1/modules/analytics-4/data/report';
const POST_DATE_FILTER =
	'dimensionFilters[customEvent:googlesitekit_post_date][value]';

/**
 * Gets the query parameters of an Analytics report request, or `null` for any
 * other request.
 *
 * @since n.e.x.t
 *
 * @param {Request} request The request.
 * @return {Object|null} The report request's query parameters, keyed by name.
 */
function getReportParams( request: Request ): Record< string, string > | null {
	const url = new URL( request.url() );
	const restRoute = url.searchParams.get( 'rest_route' ) ?? url.pathname;

	return restRoute.includes( REPORT_PATH )
		? Object.fromEntries( url.searchParams )
		: null;
}

test.describe(
	'Dates counted back from the reference date',
	{
		annotation: [
			asUser( 'admin' ),
			withPlugins( 'proxy-auth.php' ),
			withConnectedModules( analytics4Module ),
		],
	},
	() => {
		const pdfCases = [
			{
				label: 'after the clocks move forward in New York',
				timezone: 'America/New_York',
				referenceDate: '2026-03-09',
				period: 'Feb 9, 2026 - Mar 8, 2026',
				dates: {
					startDate: '2026-02-09',
					endDate: '2026-03-08',
					compareStartDate: '2026-01-12',
					compareEndDate: '2026-02-08',
				},
			},
			{
				label: 'after the clocks move forward in Sydney',
				timezone: 'Australia/Sydney',
				referenceDate: '2026-10-05',
				period: 'Sep 7, 2026 - Oct 4, 2026',
				dates: {
					startDate: '2026-09-07',
					endDate: '2026-10-04',
					compareStartDate: '2026-08-10',
					compareEndDate: '2026-09-06',
				},
			},
			{
				label: 'in UTC',
				timezone: 'UTC',
				referenceDate: '2026-03-09',
				period: 'Feb 9, 2026 - Mar 8, 2026',
				dates: {
					startDate: '2026-02-09',
					endDate: '2026-03-08',
					compareStartDate: '2026-01-12',
					compareEndDate: '2026-02-08',
				},
			},
			{
				label: 'after the clocks move back in New York',
				timezone: 'America/New_York',
				referenceDate: '2026-11-02',
				period: 'Oct 5, 2026 - Nov 1, 2026',
				dates: {
					startDate: '2026-10-05',
					endDate: '2026-11-01',
					compareStartDate: '2026-09-07',
					compareEndDate: '2026-10-04',
				},
			},
		];

		for ( const {
			label,
			timezone,
			referenceDate,
			period,
			dates,
		} of pdfCases ) {
			test.describe( `PDF report ${ label }`, () => {
				// eslint-disable-next-line sitekit/acronym-case
				test.use( { timezoneId: timezone } );

				// Generating the PDF is heavy and can push past the default 30s
				// timeout on slower runners; see `pdf-generation.spec.ts`.
				test.describe.configure( { timeout: 90_000 } );

				test(
					`covers ${ period } for a reference date of ${ referenceDate }`,
					{
						annotation: [
							withReferenceDate( referenceDate ),
							// Serves the Speed section's PageSpeed report,
							// which does not depend on the dates, so the
							// export completes with the period in its header.
							withFixtures( 'pdf-generation/full' ),
							withKeyMetrics( [
								'kmAnalyticsNewVisitors',
								'kmAnalyticsReturningVisitors',
							] ),
						],
					},
					async ( { wp } ) => {
						const pageObject = new PDFGenerationPage( wp.page );

						const reportParams: Record< string, string >[] = [];
						wp.page.on( 'request', ( request ) => {
							const params = getReportParams( request );
							if ( params ) {
								reportParams.push( params );
							}
						} );

						await wp.step( 'Open the dashboard', async () => {
							await wp.visitDashboard();
						} );

						let download!: Download;
						await wp.step( 'Download the report', async () => {
							await pageObject.openPanel();
							// The Key Metrics section requests Analytics reports
							// with the comparison period, and the Speed section
							// completes the export.
							await pageObject.deselectAllExcept( [
								'mainDashboardKeyMetrics',
								'mainDashboardSpeed',
							] );
							download = await pageObject.download();
						} );

						await wp.step(
							'Check the report and comparison periods',
							async () => {
								expect(
									await pageObject.readPDFFirstPageText(
										download
									)
								).toContain( period );

								// The dashboard's own reports end on the
								// reference date, so only the PDF report's
								// requests end on the day before it.
								const requestedDates = reportParams
									.filter(
										( params ) =>
											'compareStartDate' in params
									)
									.map(
										( {
											startDate,
											endDate,
											compareStartDate,
											compareEndDate,
										} ) => ( {
											startDate,
											endDate,
											compareStartDate,
											compareEndDate,
										} )
									);

								expect( requestedDates ).toContainEqual(
									dates
								);
							}
						);
					}
				);
			} );
		}

		test.describe( 'Top recent trending pages widget', () => {
			// eslint-disable-next-line sitekit/acronym-case
			test.use( { timezoneId: 'America/New_York' } );

			const widgetCases = [
				{
					referenceDate: '2026-03-09',
					startDate: '2026-03-06',
					endDate: '2026-03-08',
					postDates: [ '20260308', '20260307', '20260306' ],
				},
				{
					referenceDate: '2026-03-10',
					startDate: '2026-03-07',
					endDate: '2026-03-09',
					postDates: [ '20260309', '20260308', '20260307' ],
				},
				{
					referenceDate: '2026-03-11',
					startDate: '2026-03-08',
					endDate: '2026-03-10',
					postDates: [ '20260310', '20260309', '20260308' ],
				},
			];

			for ( const {
				referenceDate,
				startDate,
				endDate,
				postDates,
			} of widgetCases ) {
				test(
					`requests pages published from ${ startDate } to ${ endDate } for a reference date of ${ referenceDate }`,
					{
						annotation: [
							withReferenceDate( referenceDate ),
							// A single selected metric falls back to the
							// default metrics, so select a second one.
							withKeyMetrics( [
								'kmAnalyticsTopRecentTrendingPages',
								'kmAnalyticsNewVisitors',
							] ),
							// Otherwise the widget shows that Analytics is
							// gathering data and requests no report.
							withDataAvailable( {
								modules: [ 'analytics-4' ],
								customDimensions: [ 'googlesitekit_post_date' ],
							} ),
						],
					},
					async ( { wp } ) => {
						const reportRequest = wp.page.waitForRequest(
							( request ) =>
								`${ POST_DATE_FILTER }[0]` in
								( getReportParams( request ) ?? {} )
						);

						await wp.step( 'Open the dashboard', async () => {
							await wp.visitDashboard();
						} );

						await wp.step( 'Scroll to the widget', async () => {
							// The widget requests its report once it is in view.
							await wp.page
								.getByText( 'Top recent trending pages', {
									exact: true,
								} )
								.scrollIntoViewIfNeeded();
						} );

						await wp.step(
							'Check the widget report request',
							async () => {
								const params = getReportParams(
									await reportRequest
								) as Record< string, string >;

								expect( params.startDate ).toBe( startDate );
								expect( params.endDate ).toBe( endDate );
								expect(
									postDates.map(
										( _postDate, index ) =>
											params[
												`${ POST_DATE_FILTER }[${ index }]`
											]
									)
								).toEqual( postDates );
							}
						);
					}
				);
			}
		} );
	}
);
