/**
 * Site Goals insight notice stories.
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
import { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { conversionInsight } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import InsightNotice from './InsightNotice';

interface InsightNoticeStoryProps {
	/** The goal type of the widget the notice is in. */
	goalType: GoalType;
	/** Sets the registry state before the story renders. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
}

function Template( { goalType, setupRegistry }: InsightNoticeStoryProps ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<InsightNotice goalType={ goalType } tabID="" />
		</WithRegistrySetup>
	);
}

// Every story sets the reference date to 2026-11-25, so its insight covers
// the 28 days that end on 2026-11-24.
export const LeadGeneration = Template.bind(
	{}
) as Story< InsightNoticeStoryProps >;
LeadGeneration.storyName = 'Lead generation';
LeadGeneration.args = {
	goalType: GOAL_TYPES.LEAD,
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-11-25' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveConversionInsight(
			{
				...conversionInsight,
				text: 'Leads are up **60%** over the past 28 days.',
			},
			{ goalType: GOAL_TYPES.LEAD, tabID: '', endDate: '2026-11-24' }
		);
	},
};
LeadGeneration.scenario = {};

// This story runs no visual check, because only its text is different from
// `LeadGeneration`.
export const OnlineStore = Template.bind(
	{}
) as Story< InsightNoticeStoryProps >;
OnlineStore.storyName = 'Online store';
OnlineStore.args = {
	goalType: GOAL_TYPES.ECOMMERCE,
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-11-25' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveConversionInsight(
			{
				...conversionInsight,
				text: 'Purchases are down **18%** over the past 28 days.',
				actionableRecommendation:
					'Fewer visits from organic search led to fewer purchases, while the conversion rate stayed about the same.',
			},
			{
				goalType: GOAL_TYPES.ECOMMERCE,
				tabID: '',
				endDate: '2026-11-24',
			}
		);
	},
};

export const LongText = Template.bind( {} ) as Story< InsightNoticeStoryProps >;
LongText.storyName = 'Long text';
LongText.args = {
	goalType: GOAL_TYPES.LEAD,
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-11-25' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveConversionInsight(
			{
				...conversionInsight,
				text: 'Leads are up **60%** over the past 28 days, the highest number of form completions the site has had in a 28-day period since the forms were added.',
				actionableRecommendation:
					'Both an increase in overall site traffic, mostly from organic search and referrals, and a higher conversion rate on the pages that hold the forms contributed to this growth, while engagement stayed about the same.',
			},
			{ goalType: GOAL_TYPES.LEAD, tabID: '', endDate: '2026-11-24' }
		);
	},
};
LongText.scenario = {};

export const Loading = Template.bind( {} ) as Story< InsightNoticeStoryProps >;
Loading.storyName = 'Loading';
Loading.args = {
	goalType: GOAL_TYPES.LEAD,
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-11-25' );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getConversionInsight', [
				GOAL_TYPES.LEAD,
				'',
				'2026-11-24',
			] );
	},
};
Loading.decorators = [
	( StoryComponent: ComponentType ) => (
		// The placeholder's color comes from its pulse animation, which the
		// VRT build only keeps when paused.
		<div className="googlesitekit-vrt-animation-paused">
			<StoryComponent />
		</div>
	),
];
Loading.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/Components/InsightNotice',
	component: InsightNotice,
};
