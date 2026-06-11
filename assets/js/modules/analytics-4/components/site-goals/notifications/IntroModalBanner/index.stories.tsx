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
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import { provideUserAuthentication } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import IntroModal from './index';

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

		setupRegistry?.( registry );
	}

	return (
		<WithRegistrySetup func={ setupBaseRegistry }>
			<IntroModal />
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
