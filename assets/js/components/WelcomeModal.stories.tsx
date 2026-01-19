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
 * Internal dependencies
 */
import WelcomeModal, {
	GATHERING_DATA_DISMISSED_ITEM_SLUG,
} from './WelcomeModal';
import WithRegistrySetup from '../../../tests/js/WithRegistrySetup';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/data` is not typed yet.
type Registry = any;

function Template( {
	setupRegistry,
}: {
	setupRegistry: ( registry: Registry ) => void;
} ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WelcomeModal />
		</WithRegistrySetup>
	);
}

export const DataAvailable = Template.bind( {} );
DataAvailable.storyName = 'Data Available';
DataAvailable.args = {
	setupRegistry: ( registry: Registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsGatheringData( false );
	},
};
DataAvailable.scenario = {};

export const GatheringData = Template.bind( {} );
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	setupRegistry: ( registry: Registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsGatheringData( true );
	},
};
GatheringData.scenario = {};

export const DataGatheringComplete = Template.bind( {} );
DataGatheringComplete.storyName = 'Data Gathering Complete';
DataGatheringComplete.args = {
	setupRegistry: ( registry: Registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsGatheringData( false );

		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ GATHERING_DATA_DISMISSED_ITEM_SLUG ] );
	},
};
DataGatheringComplete.scenario = {};

export default {
	title: 'Components/WelcomeModal',
	component: WelcomeModal,
};
