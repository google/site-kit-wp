/**
 * `modules/analytics-4` data store: site goals breakdown tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getPreviousDate } from '@/js/util';
import { createTestRegistry, untilResolved } from '@tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';
import { ReportOptions } from './types';

describe( 'modules/analytics-4 site goals breakdown', () => {
	let registry: WPDataRegistry;

	const formMetadataEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/form-metadata'
	);

	function metadata( title: string | null, plugin: string | null = null ) {
		return { title, plugin };
	}

	// `untilResolved` types its proxy selectors as zero-argument, but the runtime
	// forwards args; cast so resolver args (slugs, form IDs) can be passed.
	function resolved() {
		return untilResolved( registry, MODULES_ANALYTICS_4 ) as Record<
			string,
			( ...args: unknown[] ) => Promise< unknown >
		>;
	}

	// The tab structure is discovered over a fixed 90-day window ending at the
	// reference date, independent of the selected dashboard date range.
	function getDiscoveryDates() {
		const endDate = registry.select( CORE_USER ).getReferenceDate();

		return { startDate: getPreviousDate( endDate, 90 ), endDate };
	}

	function getDiscoveryReportOptions(
		customDimensionSlug: string,
		eventNames: string[] = []
	): ReportOptions {
		const dates = getDiscoveryDates();
		const dimension = `customEvent:${ customDimensionSlug }`;

		return {
			...dates,
			dimensions: [ dimension ],
			dimensionFilters: {
				[ dimension ]: {
					filterType: 'emptyFilter',
					notExpression: true,
				},
				...( eventNames.length
					? {
							eventName: {
								filterType: 'inListFilter',
								value: eventNames,
							},
					  }
					: {} ),
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [ { metric: { metricName: 'eventCount' }, desc: true } ],
			reportID: `analytics-4_site-goals-breakdown_values_${ customDimensionSlug }`,
		} as ReportOptions;
	}

	function seedDiscoveryReport(
		customDimensionSlug: string,
		values: string[],
		eventNames: string[] = []
	) {
		const options = getDiscoveryReportOptions(
			customDimensionSlug,
			eventNames
		);

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: values.map( ( value, index ) => ( {
					dimensionValues: [ { value } ],
					metricValues: [ { value: String( 100 - index ) } ],
				} ) ),
			},
			{ options }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	describe( 'getBreakdownValues', () => {
		it( 'returns distinct non-empty values from the discovery report', async () => {
			seedDiscoveryReport( 'googlesitekit_event_provider', [
				'woocommerce',
				'easy-digital-downloads',
				'woocommerce',
				'(not set)',
				'',
			] );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBreakdownValues( 'googlesitekit_event_provider' );

			await resolved().getBreakdownValues(
				'googlesitekit_event_provider'
			);

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBreakdownValues( 'googlesitekit_event_provider' )
			).toEqual( [ 'woocommerce', 'easy-digital-downloads' ] );
		} );

		it( 'returns an empty array when no custom dimension values exist', async () => {
			seedDiscoveryReport( 'googlesitekit_form_id', [] );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBreakdownValues( 'googlesitekit_form_id' );

			await resolved().getBreakdownValues( 'googlesitekit_form_id' );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBreakdownValues( 'googlesitekit_form_id' )
			).toEqual( [] );
		} );

		it( 'scopes the discovered values to the provided event names', async () => {
			// Discovery scoped to ecommerce events surfaces only those providers.
			seedDiscoveryReport(
				'googlesitekit_event_provider',
				[ 'woocommerce' ],
				[ 'purchase', 'add_to_cart' ]
			);

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBreakdownValues( 'googlesitekit_event_provider', [
					'purchase',
					'add_to_cart',
				] );

			await resolved().getBreakdownValues(
				'googlesitekit_event_provider',
				[ 'purchase', 'add_to_cart' ]
			);

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBreakdownValues( 'googlesitekit_event_provider', [
						'purchase',
						'add_to_cart',
					] )
			).toEqual( [ 'woocommerce' ] );
		} );

		it( 'returns undefined while the report is loading', () => {
			const options = getDiscoveryReportOptions(
				'googlesitekit_form_id'
			);
			// Mark the report resolution as in progress so the selector returns
			// undefined without triggering a network request.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [ options ] );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBreakdownValues( 'googlesitekit_form_id' )
			).toBeUndefined();
		} );
	} );

	describe( 'getFormMetadata', () => {
		it( 'returns resolved metadata mapped by form ID', async () => {
			fetchMock.getOnce( formMetadataEndpoint, {
				body: {
					5: metadata( 'Contact', 'WPForms' ),
					12: metadata( 'Newsletter signup', 'Ninja Forms' ),
				},
				status: 200,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getFormMetadata( [ '5', '12' ] );
			await resolved().getFormMetadata( [ '5', '12' ] );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getFormMetadata( [ '5', '12' ] )
			).toEqual( {
				5: metadata( 'Contact', 'WPForms' ),
				12: metadata( 'Newsletter signup', 'Ninja Forms' ),
			} );
		} );

		it( 'resolves IDs the server omits to a null-metadata entry instead of hanging', async () => {
			// '0' is dropped server-side by absint, so it's absent from the body.
			fetchMock.getOnce( formMetadataEndpoint, {
				body: { 5: metadata( 'Contact', 'WPForms' ) },
				status: 200,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getFormMetadata( [ '5', '0' ] );
			await resolved().getFormMetadata( [ '5', '0' ] );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getFormMetadata( [ '5', '0' ] )
			).toEqual( {
				5: metadata( 'Contact', 'WPForms' ),
				0: metadata( null ),
			} );
		} );

		it( 'caches results and does not re-fetch for the same IDs', async () => {
			fetchMock.getOnce( formMetadataEndpoint, {
				body: { 5: metadata( 'Contact', 'WPForms' ) },
				status: 200,
			} );

			registry.select( MODULES_ANALYTICS_4 ).getFormMetadata( [ '5' ] );
			await resolved().getFormMetadata( [ '5' ] );

			// A second call for the same ID reads from the cache; a re-fetch would
			// miss the `getOnce` mock and surface as a console error.
			registry.select( MODULES_ANALYTICS_4 ).getFormMetadata( [ '5' ] );

			expect( fetchMock ).toHaveFetchedTimes( 1, formMetadataEndpoint );
		} );
	} );

	describe( 'getFormTitles', () => {
		it( 'computes quoted title labels from the resolved metadata', async () => {
			fetchMock.getOnce( formMetadataEndpoint, {
				body: {
					5: metadata( 'Contact', 'WPForms' ),
					12: metadata( 'Newsletter signup' ),
				},
				status: 200,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getFormTitles( [ '5', '12' ] );
			await resolved().getFormMetadata( [ '5', '12' ] );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getFormTitles( [ '5', '12' ] )
			).toEqual( {
				5: '“Contact” form',
				12: '“Newsletter signup” form',
			} );
		} );

		it( 'applies the fallback label when the title is null', async () => {
			fetchMock.getOnce( formMetadataEndpoint, {
				body: { 5: metadata( null ) },
				status: 200,
			} );

			registry.select( MODULES_ANALYTICS_4 ).getFormTitles( [ '5' ] );
			await resolved().getFormMetadata( [ '5' ] );

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getFormTitles( [ '5' ] )
			).toEqual( { 5: 'Form #5' } );
		} );

		it( 'renders a real title of "0" rather than the fallback', async () => {
			fetchMock.getOnce( formMetadataEndpoint, {
				body: { 7: metadata( '0' ) },
				status: 200,
			} );

			registry.select( MODULES_ANALYTICS_4 ).getFormTitles( [ '7' ] );
			await resolved().getFormMetadata( [ '7' ] );

			expect(
				registry.select( MODULES_ANALYTICS_4 ).getFormTitles( [ '7' ] )
			).toEqual( { 7: '“0” form' } );
		} );
	} );

	describe( 'getFormPagePaths', () => {
		const FORM_SLUG = 'googlesitekit_form_id';

		function seedFormPagesReport(
			rows: Array< [ formID: string, pagePath: string, count: number ] >
		) {
			const dates = getDiscoveryDates();
			const dimension = `customEvent:${ FORM_SLUG }`;
			const options = {
				...dates,
				dimensions: [ dimension, 'pagePath' ],
				dimensionFilters: {
					[ dimension ]: {
						filterType: 'inListFilter',
						value: [ '5', '12' ],
					},
				},
				metrics: [ { name: 'eventCount' } ],
				orderby: [
					{ metric: { metricName: 'eventCount' }, desc: true },
				],
				reportID: `analytics-4_site-goals-breakdown_form-pages_${ FORM_SLUG }`,
			} as ReportOptions;

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
				{
					rows: rows.map( ( [ formID, pagePath, count ] ) => ( {
						dimensionValues: [
							{ value: formID },
							{ value: pagePath },
						],
						metricValues: [ { value: String( count ) } ],
					} ) ),
				},
				{ options }
			);
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ options ] );
		}

		it( 'groups pages per form, busiest first', async () => {
			seedFormPagesReport( [
				[ '5', '/contact', 80 ],
				[ '5', '/about', 20 ],
				[ '12', '/newsletter', 5 ],
			] );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getFormPagePaths( FORM_SLUG, [ '5', '12' ] );
			await resolved().getFormPagePaths( FORM_SLUG, [ '5', '12' ] );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getFormPagePaths( FORM_SLUG, [ '5', '12' ] )
			).toEqual( {
				5: [ '/contact', '/about' ],
				12: [ '/newsletter' ],
			} );
		} );

		it( 'returns an empty object without querying when no form IDs are given', () => {
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getFormPagePaths( FORM_SLUG, [] )
			).toEqual( {} );
		} );

		it( 'omits forms that appear on no pages', async () => {
			seedFormPagesReport( [ [ '5', '/contact', 80 ] ] );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getFormPagePaths( FORM_SLUG, [ '5', '12' ] );
			await resolved().getFormPagePaths( FORM_SLUG, [ '5', '12' ] );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getFormPagePaths( FORM_SLUG, [ '5', '12' ] )
			).toEqual( { 5: [ '/contact' ] } );
		} );
	} );

	describe( 'getUnattributedEventCounts', () => {
		const FORM_SLUG = 'googlesitekit_form_id';
		const LEAD_EVENTS = [ 'generate_lead' ];

		function seedTotalsReport( attributed: boolean, current: number ) {
			const dates = registry
				.select( CORE_USER )
				.getDateRangeDates( { compare: true } );
			const dimension = `customEvent:${ FORM_SLUG }`;
			const options = {
				...dates,
				metrics: [ { name: 'eventCount' } ],
				dimensionFilters: {
					eventName: {
						filterType: 'inListFilter',
						value: LEAD_EVENTS,
					},
					...( attributed
						? {
								[ dimension ]: {
									filterType: 'inListFilter',
									value: [ '5', '12' ],
								},
						  }
						: {} ),
				},
				reportID: `analytics-4_site-goals-breakdown_other-sources-${
					attributed ? 'attributed' : 'all'
				}_${ FORM_SLUG }`,
			} as ReportOptions;

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
				{
					totals: [
						{
							dimensionValues: [ { value: 'date_range_0' } ],
							metricValues: [ { value: String( current ) } ],
						},
						{
							dimensionValues: [ { value: 'date_range_1' } ],
							metricValues: [ { value: '0' } ],
						},
					],
				},
				{ options }
			);
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ options ] );
		}

		it( 'returns all minus attributed events as the unattributed count', async () => {
			seedTotalsReport( false, 100 );
			seedTotalsReport( true, 90 );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getUnattributedEventCounts( FORM_SLUG, LEAD_EVENTS, [
					'5',
					'12',
				] );
			await resolved().getUnattributedEventCounts(
				FORM_SLUG,
				LEAD_EVENTS,
				[ '5', '12' ]
			);

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getUnattributedEventCounts( FORM_SLUG, LEAD_EVENTS, [
						'5',
						'12',
					] )
			).toEqual( { currentCount: 10, previousCount: 0 } );
		} );

		it( 'returns zero counts when there are no attributed values', () => {
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getUnattributedEventCounts( FORM_SLUG, LEAD_EVENTS, [] )
			).toEqual( { currentCount: 0, previousCount: 0 } );
		} );
	} );

	describe( 'hasUnattributedEvents', () => {
		const FORM_SLUG = 'googlesitekit_form_id';
		const LEAD_EVENTS = [ 'generate_lead' ];

		// Seeds a single-range totals report over the fixed discovery window.
		function seedDiscoveryTotalsReport(
			attributed: boolean,
			total: number
		) {
			const dimension = `customEvent:${ FORM_SLUG }`;
			const options = {
				...getDiscoveryDates(),
				metrics: [ { name: 'eventCount' } ],
				dimensionFilters: {
					eventName: {
						filterType: 'inListFilter',
						value: LEAD_EVENTS,
					},
					...( attributed
						? {
								[ dimension ]: {
									filterType: 'inListFilter',
									value: [ '5' ],
								},
						  }
						: {} ),
				},
				reportID: `analytics-4_site-goals-breakdown_other-sources-${
					attributed ? 'attributed' : 'all'
				}_${ FORM_SLUG }`,
			} as ReportOptions;

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
				{
					totals: [
						{ metricValues: [ { value: String( total ) } ] },
					],
				},
				{ options }
			);
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ options ] );
		}

		it( 'returns true when the discovery window has more events than the attributed total', async () => {
			seedDiscoveryTotalsReport( false, 110 );
			seedDiscoveryTotalsReport( true, 100 );

			registry
				.select( MODULES_ANALYTICS_4 )
				.hasUnattributedEvents( FORM_SLUG, LEAD_EVENTS, [ '5' ] );
			await resolved().hasUnattributedEvents( FORM_SLUG, LEAD_EVENTS, [
				'5',
			] );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.hasUnattributedEvents( FORM_SLUG, LEAD_EVENTS, [ '5' ] )
			).toBe( true );
		} );

		it( 'returns false when all events in the discovery window are attributed', async () => {
			seedDiscoveryTotalsReport( false, 100 );
			seedDiscoveryTotalsReport( true, 100 );

			registry
				.select( MODULES_ANALYTICS_4 )
				.hasUnattributedEvents( FORM_SLUG, LEAD_EVENTS, [ '5' ] );
			await resolved().hasUnattributedEvents( FORM_SLUG, LEAD_EVENTS, [
				'5',
			] );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.hasUnattributedEvents( FORM_SLUG, LEAD_EVENTS, [ '5' ] )
			).toBe( false );
		} );
	} );
} );
