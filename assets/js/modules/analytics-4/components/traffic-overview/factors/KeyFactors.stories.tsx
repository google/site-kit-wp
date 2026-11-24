/**
 * KeyFactors stories.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { KEY_FACTORS } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { BenchmarkingKeyFactor } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { Story } from '@/js/types/Story';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import KeyFactors from './KeyFactors';
import { PLACEHOLDER_KEY_FACTORS_INSIGHT } from './placeholderKeyFactors';

const REFERENCE_SITE_URL = 'https://example.com';

/**
 * Puts the site info in the store, whose admin URL a landing page's link is
 * built on, and `2025-02-05` as today, which the notice of `noPreviousPeriod`
 * compares its day with.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to set up.
 * @return {void}
 */
function setupRegistry( registry: WPDataRegistry ) {
	provideSiteInfo( registry );
	registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
}

/**
 * Cards whose names and values are longer than a card is wide.
 */
const LONG_KEY_FACTORS: BenchmarkingKeyFactor[] = [
	{
		kind: 'CHANNEL',
		label: 'Organic Search',
		current: 1480,
		previous: 230,
		sharePct: 71.4,
		attributes: [
			{
				kind: 'SEARCH_KEYWORD',
				label: 'how long does homemade ice cream last in the freezer',
				current: 310,
				previous: 90,
				sharePct: 12.7,
			},
			{
				kind: 'LANDING_PAGE',
				label: '/the-complete-guide-to-making-ice-cream-at-home-without-a-machine/',
				current: 960,
				previous: 120,
				sharePct: 67.2,
			},
		],
	},
	{
		kind: 'CONTENT',
		label: 'The complete guide to making ice cream at home without a machine, from custard bases to sorbets',
		current: 250,
		previous: 0,
		sharePct: 82.6,
		attributes: [],
	},
	{
		kind: 'CHANNEL',
		label: 'Organic Social',
		current: 101,
		previous: 100,
		sharePct: 0.1,
		attributes: [],
	},
];

/**
 * The cards of a steady period: the channels with the most visits, each with
 * its share of the site's visits and its own small change.
 */
const STEADY_KEY_FACTORS: BenchmarkingKeyFactor[] = [
	{
		kind: 'CHANNEL',
		label: 'Organic Search',
		current: 2140,
		previous: 2118,
		sharePct: 52.3,
		attributes: [
			{
				kind: 'LANDING_PAGE',
				label: '/how-long-does-homemade-ice-cream-last/',
				current: 312,
				previous: 290,
				sharePct: 9.6,
			},
		],
	},
	{
		kind: 'CHANNEL',
		label: 'Direct',
		current: 1095,
		previous: 1110,
		sharePct: 26.8,
		attributes: [],
	},
	{
		kind: 'CHANNEL',
		label: 'Referral',
		current: 512,
		previous: 506,
		sharePct: 12.5,
		attributes: [],
	},
];

/**
 * Cards whose shares need more than a share of their card's change: a
 * referring site that took its channel's card, a channel whose device moved
 * further than it because its other device moved the other way, and the paid
 * channels as one group.
 */
const SHARES_KEY_FACTORS: BenchmarkingKeyFactor[] = [
	{
		kind: 'REFERRING_SITE',
		label: 'news.example',
		current: 220,
		previous: 0,
		sharePct: 73.3,
		shareBasis: 'PARENT_CHANNEL',
		parentChannel: { label: 'Referral', change: 300 },
		attributes: [],
	},
	{
		kind: 'CHANNEL',
		label: 'Direct',
		current: 3280,
		previous: 2000,
		sharePct: 64.5,
		shareBasis: 'GROSS_CHANGE',
		attributes: [
			{
				kind: 'DEVICE',
				label: 'desktop',
				current: 2643,
				previous: 1000,
				sharePct: 0,
				oversized: true,
			},
			{
				kind: 'DEVICE',
				label: 'mobile',
				current: 638,
				previous: 1000,
				sharePct: 0,
			},
		],
	},
	{
		kind: 'CHANNEL_GROUP',
		label: 'Paid traffic',
		current: 455,
		previous: 350,
		sharePct: 5.3,
		shareBasis: 'GROSS_CHANGE',
		attributes: [
			{
				kind: 'TRAFFIC_CHANNEL',
				label: 'Paid Search',
				current: 300,
				previous: 100,
				sharePct: 65.6,
			},
			{
				kind: 'TRAFFIC_CHANNEL',
				label: 'Paid Social',
				current: 100,
				previous: 200,
				sharePct: 32.8,
			},
		],
	},
];

/**
 * A card whose change was spread across many pages, beside a card with the
 * page that carried most of its change. On oi.ie, Organic Search rose across
 * 233 pages, none of them by more than 5 visits.
 */
const SPREAD_KEY_FACTORS: BenchmarkingKeyFactor[] = [
	{
		kind: 'CHANNEL',
		label: 'Organic Search',
		current: 1420,
		previous: 1251,
		sharePct: 71.6,
		shareBasis: 'GROSS_CHANGE',
		spreadAcrossPages: true,
		attributes: [],
	},
	{
		kind: 'CHANNEL',
		label: 'Referral',
		current: 210,
		previous: 143,
		sharePct: 28.4,
		shareBasis: 'GROSS_CHANGE',
		attributes: [
			{
				kind: 'LANDING_PAGE',
				label: '/how-long-does-homemade-ice-cream-last/',
				current: 80,
				previous: 30,
				sharePct: 74.6,
			},
		],
	},
];

interface KeyFactorsStoryProps {
	/** The key factor cards to show. */
	keyFactors: BenchmarkingKeyFactor[];
	/** Whether traffic was steady, when the cards show their shares of the site's visits. */
	steady?: boolean;
	/** Whether the selected date range is too short for the key factors. */
	rangeTooShort?: boolean;
	/** Whether the site's recorded traffic doesn't cover the period before the selected date range yet. */
	noPreviousPeriod?: boolean;
	/** The last day of the first date range of this length with the key factors. */
	keyFactorsAvailableFrom?: string | null;
	/** The number of days in the selected date range. */
	daysInSelectedRange?: number;
	/** Whether the key factors have arrived. */
	loaded?: boolean;
	/** The generated summary of the cards. */
	insight?: string;
	/** Whether to pause the placeholders' pulse animation for the visual check. */
	pauseAnimation?: boolean;
}

function Template( {
	keyFactors,
	steady,
	rangeTooShort,
	noPreviousPeriod,
	keyFactorsAvailableFrom,
	daysInSelectedRange = 28,
	loaded,
	insight,
	pauseAnimation = false,
}: KeyFactorsStoryProps ) {
	// The section's styles are scoped to the widget and the panel, so the
	// story renders inside both. The placeholders' color comes from their
	// pulse animation, which the VRT build only keeps when paused.
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div
				className={ classnames(
					'googlesitekit-widget--analyticsTrafficOverview',
					{ 'googlesitekit-vrt-animation-paused': pauseAnimation }
				) }
			>
				<div className="googlesitekit-traffic-overview__panel googlesitekit-traffic-overview__panel--typical-traffic">
					<KeyFactors
						keyFactors={ keyFactors }
						steady={ steady }
						rangeTooShort={ rangeTooShort }
						noPreviousPeriod={ noPreviousPeriod }
						keyFactorsAvailableFrom={ keyFactorsAvailableFrom }
						loaded={ loaded }
						insight={ insight }
						daysInSelectedRange={ daysInSelectedRange }
						referenceSiteURL={ REFERENCE_SITE_URL }
					/>
				</div>
			</div>
		</WithRegistrySetup>
	);
}

export const Default = Template.bind( {} ) as Story< KeyFactorsStoryProps >;
Default.storyName = 'Default';
Default.args = {
	keyFactors: KEY_FACTORS,
	insight: PLACEHOLDER_KEY_FACTORS_INSIGHT,
};
Default.scenario = {};

// `WithoutInsight` runs no visual check, because it only leaves out the
// notice of `Default`.
export const WithoutInsight = Template.bind(
	{}
) as Story< KeyFactorsStoryProps >;
WithoutInsight.storyName = 'Without Insight';
WithoutInsight.args = {
	keyFactors: KEY_FACTORS,
};

// `NoNotableChange` has no insight: a summary would take the place of the
// notice the story shows.
export const NoNotableChange = Template.bind(
	{}
) as Story< KeyFactorsStoryProps >;
NoNotableChange.storyName = 'No Notable Change';
NoNotableChange.args = {
	keyFactors: [],
};
NoNotableChange.scenario = {};

// On a steady period, the notice sits above the summary and the channels
// that hold the site's traffic up, each with its share of the site's visits.
export const SteadyTraffic = Template.bind(
	{}
) as Story< KeyFactorsStoryProps >;
SteadyTraffic.storyName = 'Steady Traffic';
SteadyTraffic.args = {
	keyFactors: STEADY_KEY_FACTORS,
	steady: true,
	insight: PLACEHOLDER_KEY_FACTORS_INSIGHT,
};

// `RangeTooShort` runs no visual check, because it only changes the notice
// text of `NoNotableChange`.
export const RangeTooShort = Template.bind(
	{}
) as Story< KeyFactorsStoryProps >;
RangeTooShort.storyName = 'Range Too Short';
RangeTooShort.args = {
	keyFactors: [],
	rangeTooShort: true,
	daysInSelectedRange: 3,
};

// `NoPreviousPeriod` runs no visual check, because it only changes the
// notice text of `NoNotableChange`.
export const NoPreviousPeriod = Template.bind(
	{}
) as Story< KeyFactorsStoryProps >;
NoPreviousPeriod.storyName = 'No Previous Period';
NoPreviousPeriod.args = {
	keyFactors: [],
	noPreviousPeriod: true,
	keyFactorsAvailableFrom: '2025-02-25',
};

export const LongLabels = Template.bind( {} ) as Story< KeyFactorsStoryProps >;
LongLabels.storyName = 'Long Labels';
LongLabels.args = {
	keyFactors: LONG_KEY_FACTORS,
};
LongLabels.scenario = {};

// A card that took its channel's place names the channel under its title, a
// row larger than its card says it is more than the channel's net change, and
// the paid channels' rows are shares of their movement.
export const Shares = Template.bind( {} ) as Story< KeyFactorsStoryProps >;
Shares.storyName = 'Shares';
Shares.args = {
	keyFactors: SHARES_KEY_FACTORS,
};
Shares.scenario = {};

// A card whose change was spread across many pages says so in place of its
// attributes.
export const SpreadAcrossPages = Template.bind(
	{}
) as Story< KeyFactorsStoryProps >;
SpreadAcrossPages.storyName = 'Spread Across Pages';
SpreadAcrossPages.args = {
	keyFactors: SPREAD_KEY_FACTORS,
};
SpreadAcrossPages.scenario = {};

export const Loading = Template.bind( {} ) as Story< KeyFactorsStoryProps >;
Loading.storyName = 'Loading';
Loading.args = {
	keyFactors: [],
	loaded: false,
	pauseAnimation: true,
};
Loading.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/KeyFactors',
	component: KeyFactors,
};
