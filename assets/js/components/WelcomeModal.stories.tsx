/**
 * WelcomeModal stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import {
	CORE_USER,
	WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
} from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { Story } from '@/js/types/Story';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import WelcomeModal from './WelcomeModal';

function Template( {
	setupRegistry,
}: {
	setupRegistry: ( registry: WPDataRegistry ) => void;
} ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WelcomeModal />
		</WithRegistrySetup>
	);
}

export const DataAvailable = Template.bind( {} ) as Story;
DataAvailable.storyName = 'Data Available';
DataAvailable.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsGatheringData( false );
	},
};
DataAvailable.scenario = {};

export const GatheringData = Template.bind( {} ) as Story;
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsGatheringData( true );
	},
};
GatheringData.scenario = {};

export const DataGatheringComplete = Template.bind( {} ) as Story;
DataGatheringComplete.storyName = 'Data Gathering Complete';
DataGatheringComplete.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsGatheringData( false );

		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
			] );
	},
};
DataGatheringComplete.scenario = {};

export default {
	title: 'Components/WelcomeModal',
	component: WelcomeModal,
};
