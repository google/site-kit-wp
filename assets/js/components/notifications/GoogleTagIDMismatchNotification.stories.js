/**
 * GoogleTagIDMismatchNotification Component stories.
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
import { provideModules } from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import * as fixtures from '../../modules/analytics-4/datastore/__fixtures__';
import GoogleTagIDMismatchNotification from './GoogleTagIDMismatchNotification';

function Template( { ...args } ) {
	return <GoogleTagIDMismatchNotification { ...args } />;
}

export const NoMismatchedTag = Template.bind( {} );
NoMismatchedTag.storyName = 'No Mismatched Tag';

export const MismatchedTag = Template.bind( {} );
MismatchedTag.storyName = 'Mismatched Tag';

export default {
	title: 'Components/GoogleTagIDMismatchNotification',
	component: GoogleTagIDMismatchNotification,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				const gtmAccountID = '6065484567';
				const gtmContainerID = '98369876';
				const containerDestinationsMock =
					fixtures.containerDestinations[ gtmAccountID ][
						gtmContainerID
					];

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setGoogleTagAccountID( gtmAccountID );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setGoogleTagContainerID( gtmContainerID );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetGoogleTagContainerDestinations(
						containerDestinationsMock,
						{
							gtmAccountID,
							gtmContainerID,
						}
					);
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
