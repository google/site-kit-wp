/**
 * Site Goals EventProviderDeactivatedNotice stories.
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
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { Story } from '@/js/types/Story';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import EventProviderDeactivatedNotice from './EventProviderDeactivatedNotice';

interface EventProviderDeactivatedNoticeStoryProps {
	goalType: GoalType;
	providerSlug: string;
}

function Template( {
	goalType,
	providerSlug,
}: EventProviderDeactivatedNoticeStoryProps ) {
	return (
		<WithRegistrySetup
			func={ ( registry: WPDataRegistry ) =>
				// An empty activeConversionEventProviders list makes every slug
				// read as deactivated, so each story renders the notice for the
				// slug it passes in.
				provideSiteInfo( registry, {
					activeConversionEventProviders: [],
				} )
			}
		>
			<EventProviderDeactivatedNotice
				goalType={ goalType }
				providerSlug={ providerSlug }
			/>
		</WithRegistrySetup>
	);
}

export const OnlineStore = Template.bind(
	{}
) as Story< EventProviderDeactivatedNoticeStoryProps >;
OnlineStore.storyName = 'Online store plugin deactivated';
OnlineStore.args = {
	goalType: GOAL_TYPES.ECOMMERCE,
	providerSlug: 'woocommerce',
};
OnlineStore.scenario = {};

export const LeadForm = Template.bind(
	{}
) as Story< EventProviderDeactivatedNoticeStoryProps >;
LeadForm.storyName = 'Form plugin deactivated';
LeadForm.args = {
	goalType: GOAL_TYPES.LEAD,
	providerSlug: 'wpforms',
};
LeadForm.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/Components/EventProviderDeactivatedNotice',
	component: EventProviderDeactivatedNotice,
};
