/**
 * IntroModal component stories.
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
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import { provideUserAuthentication } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import IntroModal, { SITE_GOALS_INTRO_MODAL_BANNER } from './index';

const NotificationWithComponentProps = withNotificationComponentProps(
	SITE_GOALS_INTRO_MODAL_BANNER
)( IntroModal );

function Template( {
	setupRegistry,
}: {
	setupRegistry?: ( registry: WPDataRegistry ) => void;
} ) {
	function setupBaseRegistry( registry: WPDataRegistry ) {
		// An authenticated user only sees the modal when the Analytics
		// access check returns true, so the stories provide that state.
		provideUserAuthentication( registry );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: true },
				{ slug: MODULE_SLUG_ANALYTICS_4 }
			);
		// Both widget categories are active, so each story's detected events
		// alone decide which variant shows.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSiteGoalsSettings( {
			activeWidgets: [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ],
		} );

		setupRegistry?.( registry );
	}

	return (
		<WithRegistrySetup func={ setupBaseRegistry }>
			{ /* The modal waits for the element the tour points to first
			before it shows. Add that element here so the modal shows in
			the stories. */ }
			<div className="googlesitekit-site-goals-primary-action" />
			<NotificationWithComponentProps />
		</WithRegistrySetup>
	);
}

export const Ecommerce = Template.bind( {} ) as Story;
Ecommerce.storyName = 'Ecommerce Only';
Ecommerce.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
	},
};

export const Lead = Template.bind( {} ) as Story;
Lead.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );
	},
};

export const EcommerceAndLead = Template.bind( {} ) as Story;
EcommerceAndLead.storyName = 'Ecommerce And Lead';
EcommerceAndLead.scenario = {};
EcommerceAndLead.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.CONTACT,
			] );
	},
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/Notifications/IntroModal',
	component: IntroModal,
};
