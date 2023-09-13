/**
 * SuccessBanner Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { provideSiteInfo } from '../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import SuccessBanner from './SuccessBanner';

const Template = () => <SuccessBanner />;

export const Default = Template.bind( {} );
Default.storyName = 'SuccessBanner';

export const WithGA4ReportingEnabled = Template.bind( {} );
WithGA4ReportingEnabled.storyName = 'SuccessBanner with GA4 Reporting';
WithGA4ReportingEnabled.parameters = {};

export default {
	title: 'Modules/Analytics4/SuccessBanner',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
