/**
 * PlaceholderTile Component Stories.
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
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { availableAudiences } from '../../../../datastore/__fixtures__';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import PlaceholderTile from './PlaceholderTile';

const WidgetWithComponentProps =
	withWidgetComponentProps( 'placeholderTile' )( PlaceholderTile );

function Template( { setupRegistry = () => {}, ...args } ) {
	function setupRegistryCallback( registry ) {
		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [],
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: availableAudiences.reduce( ( acc, { name } ) => {
					acc[ name ] = 20201220;
					return acc;
				}, {} ),
				customDimension: {},
				property: {},
			} );

		setupRegistry( registry );
	}

	return (
		<WithRegistrySetup func={ setupRegistryCallback }>
			<WidgetWithComponentProps { ...args } />
		</WithRegistrySetup>
	);
}

export const WithConfigurableNonDefaultAudiences = Template.bind( {} );
WithConfigurableNonDefaultAudiences.storyName =
	'WithConfigurableNonDefaultAudiences';
WithConfigurableNonDefaultAudiences.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			availableAudiences,
		} );
	},
};
WithConfigurableNonDefaultAudiences.scenario = {};

export const WithoutConfigurableNonDefaultAudiences = Template.bind( {} );
WithoutConfigurableNonDefaultAudiences.storyName =
	'WithoutConfigurableNonDefaultAudiences';
WithoutConfigurableNonDefaultAudiences.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			availableAudiences: availableAudiences.filter(
				( { audienceType } ) => audienceType === 'DEFAULT_AUDIENCE'
			),
		} );
	},
};
WithoutConfigurableNonDefaultAudiences.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/PlaceholderTile',
	component: PlaceholderTile,
};
