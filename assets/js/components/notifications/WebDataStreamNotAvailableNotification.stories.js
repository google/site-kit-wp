/**
 * WebDataStreamNotAvailableNotification Component stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import WebDataStreamNotAvailableNotification from './WebDataStreamNotAvailableNotification';

function Template( { ...args } ) {
	return <WebDataStreamNotAvailableNotification { ...args } />;
}

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setMeasurementID( 'G-2B7M8YQ1K6' );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
Default.scenario = {
	label: 'Global/WebDataStreamNotAvailableNotification/Default',
};

export default {
	title: 'Components/WebDataStreamNotAvailableNotification',
	component: WebDataStreamNotAvailableNotification,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setIsWebDataStreamAvailable( false );

				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {} );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
