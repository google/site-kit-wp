/**
 * "Powered By" Component Stories.
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
import { ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import PoweredByModule, {
	PoweredByModuleProps,
} from '@/js/components/PoweredByModule';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { Story } from '@/js/types/Story';
import { provideModuleRegistrations, provideModules } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';

function Template( args: PoweredByModuleProps ) {
	return <PoweredByModule { ...args } />;
}

export const ReaderRevenueManager = Template.bind(
	{}
) as Story< PoweredByModuleProps >;
ReaderRevenueManager.storyName = 'Reader Revenue Manager';
ReaderRevenueManager.args = {
	slug: MODULE_SLUG_READER_REVENUE_MANAGER,
};

export default {
	title: 'Components/PoweredByModule',
	component: PoweredByModule,
	decorators: [
		( StoryComponent: () => ReactElement ) => {
			function setupRegistry( registry: WPDataRegistry ) {
				provideModules( registry );
				provideModuleRegistrations( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<StoryComponent />
				</WithRegistrySetup>
			);
		},
	],
};
