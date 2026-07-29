/**
 * ConversionInsightBanner tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { fireEvent, render, waitFor } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
} from '@tests/js/utils';
import ConversionInsightBanner from './ConversionInsightBanner';
import {
	assembleConversionInsightEvents,
	buildConversionInsightReportOptions,
	getConversionInsightDateRanges,
} from './preprocess';

const goalType = GOAL_TYPES.LEAD;
const keyEventName = 'submit_lead_form';
const keyEventNames = [ keyEventName ];
const referenceDate = '2026-05-15';
const dismissSlug = `site-goals-conversion-insight-${ goalType }`;

const dateRanges = getConversionInsightDateRanges( referenceDate );
const { siteWideOptions, eventOptions, yoyOptions } =
	buildConversionInsightReportOptions( dateRanges, keyEventNames );

const siteWideReport = {
	totals: [
		{
			dimensionValues: [ { value: 'date_range_0' } ],
			metricValues: [ { value: '0.66' }, { value: '6000' } ],
		},
		{
			dimensionValues: [ { value: 'date_range_1' } ],
			metricValues: [ { value: '0.60' }, { value: '5000' } ],
		},
	],
};

const eventReport = {
	rows: [
		{
			dimensionValues: [
				{ value: keyEventName },
				{ value: 'date_range_0' },
			],
			metricValues: [ { value: '150' }, { value: '120' } ],
		},
		{
			dimensionValues: [
				{ value: keyEventName },
				{ value: 'date_range_1' },
			],
			metricValues: [ { value: '100' }, { value: '90' } ],
		},
	],
};

const yoyReport = { rows: [] };

// The exact payload the hook assembles from the reports seeded below.
const events = assembleConversionInsightEvents( referenceDate, keyEventNames, {
	siteWideReport,
	eventReport,
	yoyReport,
} );

const insight = {
	// eslint-disable-next-line camelcase
	key_event_name: keyEventName,
	code: 'GROWTH_VOL_UP_CR_UP_NOT_SEASONAL',
	text: 'Leads were up 50% in May! You had more visitors, and they were more likely to convert.',
	// eslint-disable-next-line camelcase
	actionable_recommendation:
		'Identify which traffic sources drove these conversions.',
};

function renderBanner( registry: WPDataRegistry ) {
	return render(
		<ConversionInsightBanner
			goalType={ goalType }
			keyEventNames={ keyEventNames }
		/>,
		{ registry }
	);
}

describe( 'ConversionInsightBanner', () => {
	let registry: WPDataRegistry;

	function seedReports() {
		[
			[ siteWideOptions, siteWideReport ],
			[ eventOptions, eventReport ],
			[ yoyOptions, yoyReport ],
		].forEach( ( [ options, report ] ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( report, { options } );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ options ] );
		} );
	}

	function seedInsights( insights: unknown[] ) {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetConversionInsights( { insights }, { events } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getConversionInsights', [ events ] );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );
		registry.dispatch( CORE_USER ).setReferenceDate( referenceDate );
		// Not dismissed by default.
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	it( 'renders the generated insight text', () => {
		seedReports();
		seedInsights( [ insight ] );

		const { getByText } = renderBanner( registry );

		expect( getByText( insight.text ) ).toBeInTheDocument();
	} );

	it( 'exposes the scenario code for conditional styling', () => {
		seedReports();
		seedInsights( [ insight ] );

		const { container } = renderBanner( registry );

		expect(
			container.querySelector( '.googlesitekit-conversion-insight' )
		).toHaveAttribute( 'data-scenario', insight.code );
	} );

	it( 'renders nothing when there is no insight for the event', () => {
		seedReports();
		seedInsights( [] );

		const { container } = renderBanner( registry );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing (fails soft) when a report request errors', () => {
		// Seed the site-wide and YoY reports, but fail the per-event report — so
		// no payload assembles and the insight request is never made.
		[
			[ siteWideOptions, siteWideReport ],
			[ yoyOptions, yoyReport ],
		].forEach( ( [ options, report ] ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( report, { options } );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ options ] );
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector(
				{ code: 500, message: 'boom', data: { status: 500 } },
				'getReport',
				[ eventOptions ]
			);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ eventOptions ] );

		const { container } = renderBanner( registry );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when already dismissed', () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ dismissSlug ] );
		seedReports();
		seedInsights( [ insight ] );

		const { container } = renderBanner( registry );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'dismisses the insight when the dismiss button is clicked', async () => {
		fetchMock.postOnce( new RegExp( 'core/user/data/dismiss-item' ), {
			body: [ dismissSlug ],
			status: 200,
		} );

		seedReports();
		seedInsights( [ insight ] );

		const { getByRole, container } = renderBanner( registry );

		fireEvent.click( getByRole( 'button', { name: /dismiss insight/i } ) );

		await waitFor( () => {
			expect( container ).toBeEmptyDOMElement();
		} );

		expect( fetchMock ).toHaveFetched(
			new RegExp( 'core/user/data/dismiss-item' )
		);
	} );
} );
