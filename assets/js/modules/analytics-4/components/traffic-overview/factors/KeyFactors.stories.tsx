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
 * Internal dependencies
 */
import { KEY_FACTORS } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { BenchmarkingKeyFactor } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { Story } from '@/js/types/Story';
import KeyFactors from './KeyFactors';
import { PLACEHOLDER_KEY_FACTORS_INSIGHT } from './placeholderKeyFactors';

const REFERENCE_SITE_URL = 'https://example.com';

/**
 * Cards whose names and values are longer than a card is wide.
 */
const LONG_KEY_FACTORS: BenchmarkingKeyFactor[] = [
	{
		kind: 'CAMPAIGN',
		label: 'spring-sale-newsletter-subscribers-europe-and-north-america',
		current: 1480,
		previous: 230,
		sharePct: 71.4,
		attributes: [
			{
				kind: 'LANDING_PAGE',
				label: '/the-complete-guide-to-making-ice-cream-at-home-without-a-machine/',
				current: 960,
				previous: 120,
				sharePct: 48.3,
			},
			{
				kind: 'TRAFFIC_CHANNEL',
				label: 'Email',
				current: 1350,
				previous: 210,
				sharePct: 65.6,
			},
		],
	},
	{
		kind: 'SEARCH_KEYWORD',
		label: 'how long does homemade ice cream last in the freezer',
		current: 310,
		previous: 90,
		sharePct: 12.7,
		attributes: [
			{
				kind: 'LANDING_PAGE',
				label: '/how-long-does-homemade-ice-cream-last/',
				current: 250,
				previous: 60,
				sharePct: 10.9,
			},
		],
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

interface KeyFactorsStoryProps {
	/** The key factor cards to show. */
	keyFactors: BenchmarkingKeyFactor[];
	/** Whether the key factors have arrived. */
	loaded?: boolean;
	/** The generated summary of the cards. */
	insight?: string;
	/** Whether to pause the placeholders' pulse animation for the visual check. */
	pauseAnimation?: boolean;
}

function Template( {
	keyFactors,
	loaded,
	insight,
	pauseAnimation = false,
}: KeyFactorsStoryProps ) {
	// The section's styles are scoped to the widget and the panel, so the
	// story renders inside both. The placeholders' color comes from their
	// pulse animation, which the VRT build only keeps when paused.
	return (
		<div
			className={ classnames(
				'googlesitekit-widget--analyticsTrafficOverview',
				{ 'googlesitekit-vrt-animation-paused': pauseAnimation }
			) }
		>
			<div className="googlesitekit-traffic-overview__panel">
				<KeyFactors
					keyFactors={ keyFactors }
					loaded={ loaded }
					insight={ insight }
					daysInSelectedRange={ 28 }
					referenceSiteURL={ REFERENCE_SITE_URL }
				/>
			</div>
		</div>
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

export const LongLabels = Template.bind( {} ) as Story< KeyFactorsStoryProps >;
LongLabels.storyName = 'Long Labels';
LongLabels.args = {
	keyFactors: LONG_KEY_FACTORS,
};
LongLabels.scenario = {};

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
