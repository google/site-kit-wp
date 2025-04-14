/**
 * AudienceCreationNotice Component Stories.
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
import { provideUserAuthentication } from '../../../../../../../../tests/js/utils';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '../../../../datastore/constants';
import { availableAudiences } from '../../../../datastore/__fixtures__';
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import AudienceCreationNotice from './AudienceCreationNotice';

function Template( {} ) {
	return (
		<div
			className="googlesitekit-audience-selection-panel"
			style={ { padding: '40px 20px', backgroundColor: '#fff' } }
		>
			<AudienceCreationNotice />
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const WithOneAudience = Template.bind( {} );
WithOneAudience.storyName = 'WithOneAudience';
WithOneAudience.args = {
	setupRegistry: ( registry ) => {
		const availableAudiencesWithoutNewVisitors = availableAudiences.filter(
			( audience ) => audience.name !== 'properties/12345/audiences/3' // New Visitors.
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiencesWithoutNewVisitors );
		registry
			.dispatch( CORE_USER )
			.setConfiguredAudiences(
				availableAudiencesWithoutNewVisitors.map( ( { name } ) => name )
			);
	},
};

export const WithMissingScopeNotice = Template.bind( {} );
WithMissingScopeNotice.storyName = 'WithMissingScopeNotice';
WithMissingScopeNotice.scenario = {};
WithMissingScopeNotice.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry, {
			grantedScopes: [],
		} );
	},
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceCreationNotice',
	component: AudienceCreationNotice,
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry, {
					grantedScopes: [ EDIT_SCOPE ],
				} );

				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: availableAudiences.reduce(
							( acc, { name } ) => {
								acc[ name ] = 20201220;
								return acc;
							},
							{}
						),
						customDimension: {},
						property: {},
					} );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					accountID: '12345',
					propertyID: '34567',
					measurementID: '56789',
					webDataStreamID: '78901',
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( {
						availableAudiences: [],
					} );

				args?.setupRegistry?.( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
