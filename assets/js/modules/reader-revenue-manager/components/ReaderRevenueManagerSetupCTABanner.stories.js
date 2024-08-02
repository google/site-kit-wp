/**
 * Reader Revenue Manager Setup CTA Banner Component Stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { provideModules } from '../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import ReaderRevenueManagerSetupCTABanner from './ReaderRevenueManagerSetupCTABanner';
import { READER_REVENUE_MANAGER_MODULE_SLUG } from '../datastore/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

const WidgetWithComponentProps = withWidgetComponentProps(
	'readerRevenueManagerSetupCTABanner'
)( ReaderRevenueManagerSetupCTABanner );

function Template() {
	return <WidgetWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Components/Dashboard/ReaderRevenueManagerSetupCTABanner',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: READER_REVENUE_MANAGER_MODULE_SLUG,
						active: false,
					},
				] );

				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
