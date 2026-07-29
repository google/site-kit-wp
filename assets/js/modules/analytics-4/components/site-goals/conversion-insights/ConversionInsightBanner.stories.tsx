/**
 * ConversionInsightBanner stories.
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
import { Story } from '@/js/types/Story';
import { provideModules, provideUserAuthentication } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import ConversionInsightBanner from './ConversionInsightBanner';
import {
	assembleConversionInsightEvents,
	buildConversionInsightReportOptions,
	getConversionInsightDateRanges,
} from './preprocess';
import { ConversionInsight } from './types';

const goalType = GOAL_TYPES.LEAD;
const keyEventName = 'submit_lead_form';
const keyEventNames = [ keyEventName ];
const referenceDate = '2026-05-15';

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

const events = assembleConversionInsightEvents( referenceDate, keyEventNames, {
	siteWideReport,
	eventReport,
	yoyReport,
} );

function seedReports( registry: WPDataRegistry ) {
	provideUserAuthentication( registry );
	provideModules( registry, [
		{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
	] );
	registry.dispatch( CORE_USER ).setReferenceDate( referenceDate );
	registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

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

function seedInsight( registry: WPDataRegistry, insight: ConversionInsight ) {
	seedReports( registry );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetConversionInsights( { insights: [ insight ] }, { events } );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getConversionInsights', [ events ] );
}

function Template( {
	setupRegistry,
}: {
	setupRegistry: ( registry: WPDataRegistry ) => void;
} ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div style={ { maxWidth: 900 } }>
				<ConversionInsightBanner
					goalType={ goalType }
					keyEventNames={ keyEventNames }
				/>
			</div>
		</WithRegistrySetup>
	);
}

export const Growth = Template.bind( {} ) as Story;
Growth.storyName = 'Growth';
Growth.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		seedInsight( registry, {
			// eslint-disable-next-line camelcase
			key_event_name: keyEventName,
			code: 'GROWTH_VOL_UP_CR_UP_NOT_SEASONAL',
			text: 'Form completions are up 12.1% for the last 7 days thanks to a spike in new visitors. In the last 7 days you had 376 new visitors, 34% more than the previous 7 days.',
			// eslint-disable-next-line camelcase
			actionable_recommendation:
				'Identify which traffic sources drove these new conversions and lean into them.',
		} ),
};

export const Decline = Template.bind( {} ) as Story;
Decline.storyName = 'Decline';
Decline.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		seedInsight( registry, {
			// eslint-disable-next-line camelcase
			key_event_name: keyEventName,
			code: 'DECLINE_VOL_DOWN_CR_DOWN_NOT_SEASONAL',
			text: 'Form completions dipped 8% this period. Fewer visitors converted than in the previous period.',
			// eslint-disable-next-line camelcase
			actionable_recommendation:
				'Review recent changes to your highest-converting pages.',
		} ),
};

export const Seasonal = Template.bind( {} ) as Story;
Seasonal.storyName = 'Seasonal';
Seasonal.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		seedInsight( registry, {
			// eslint-disable-next-line camelcase
			key_event_name: keyEventName,
			code: 'DECLINE_VOL_DOWN_SEASONAL',
			text: 'Form completions dropped 10% this period — similar to the seasonal dip seen at this time last year.',
			// eslint-disable-next-line camelcase
			actionable_recommendation:
				'This looks like a normal seasonal pattern; no action is needed.',
		} ),
};

export const Loading = Template.bind( {} ) as Story;
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		seedReports( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getConversionInsights', [ events ] );
	},
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/ConversionInsightBanner',
	component: ConversionInsightBanner,
};
