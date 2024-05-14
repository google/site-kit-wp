/**
 * ConversionTrackingToggle Component Stories.
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
import ConversionTrackingToggle from './ConversionTrackingToggle';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { WithTestRegistry } from '../../../../tests/js/utils';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import fetchMock from 'fetch-mock';

function Template() {
	return <ConversionTrackingToggle />;
}

export const Enabled = Template.bind( {} );
Enabled.storyName = 'Enabled';
Enabled.title = 'Components/Conversion Tracking/ConversionTrackingToggle';
Enabled.parameters = {
	features: [ 'conversionInfra' ],
};
Enabled.decorators = [
	( Story, { parameters } ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( CORE_SITE )
				.receiveGetConversionTrackingSettings( { enabled: true } );

			fetchMock.postOnce(
				new RegExp(
					'google-site-kit/v1/core/site/data/conversion-tracking'
				),
				{
					body: { enabled: true },
					status: 200,
				}
			);
		};
		return (
			<WithRegistrySetup
				func={ setupRegistry }
				features={ parameters.features || [] }
			>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const Default = Template.bind( {} );
Default.storyName = 'Default Disabled';
Default.parameters = {
	features: [ 'conversionInfra' ],
};
Default.decorators = [
	( Story, { parameters } ) => {
		return (
			<WithTestRegistry features={ parameters.features || [] }>
				<Story />
			</WithTestRegistry>
		);
	},
];

export default {
	title: 'Components/Conversion Tracking/ConversionTrackingToggle',
	component: ConversionTrackingToggle,
};
