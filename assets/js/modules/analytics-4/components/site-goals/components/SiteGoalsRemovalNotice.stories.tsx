/**
 * Site Goals removal notice stories.
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
import { Story } from '@/js/types/Story';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import SiteGoalsRemovalNotice, {
	SiteGoalsRemovalNoticeProps,
} from './SiteGoalsRemovalNotice';

function Template( { goalType }: SiteGoalsRemovalNoticeProps ) {
	return (
		<WithRegistrySetup
			func={ ( registry: WPDataRegistry ) => provideSiteInfo( registry ) }
		>
			<SiteGoalsRemovalNotice goalType={ goalType } />
		</WithRegistrySetup>
	);
}

export const OnlineStore = Template.bind(
	{}
) as Story< SiteGoalsRemovalNoticeProps >;
OnlineStore.storyName = 'Ecommerce widget removed';
OnlineStore.args = {
	goalType: GOAL_TYPES.ECOMMERCE,
};
OnlineStore.scenario = {
	viewport: 'large',
};

export const LeadGeneration = Template.bind(
	{}
) as Story< SiteGoalsRemovalNoticeProps >;
LeadGeneration.storyName = 'Lead generation widget removed';
LeadGeneration.args = {
	goalType: GOAL_TYPES.LEAD,
};
LeadGeneration.scenario = {
	viewport: 'large',
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/Components/SiteGoalsRemovalNotice',
	component: SiteGoalsRemovalNotice,
};
