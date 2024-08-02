/**
 * Audience Selection Panel AudienceCreationNotice tests.
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
import {
	render,
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
	provideUserInfo,
} from '../../../../../../../../tests/js/test-utils';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import AudienceCreationNotice from './AudienceCreationNotice';
import { AUDIENCE_CREATION_NOTICE_SLUG } from './constants';
import { availableAudiences } from '../../../../datastore/__fixtures__';

describe( 'AudienceCreationNotice', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserInfo( registry );
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
		] );
		provideModuleRegistrations( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	it( 'should render null if no audiences are available', () => {
		const { container } = render( <AudienceCreationNotice />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render null if the user has dismissed the notice', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ AUDIENCE_CREATION_NOTICE_SLUG ] );

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

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID: '12345',
			propertyID: '34567',
			measurementID: '56789',
			webDataStreamID: '78901',
			availableAudiences,
		} );

		const { container, waitForRegistry } = render(
			<AudienceCreationNotice />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render the notice if the user has not dismissed the notice and there are 2 available audiences', async () => {
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

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID: '12345',
			propertyID: '34567',
			measurementID: '56789',
			webDataStreamID: '78901',
			availableAudiences: [],
		} );

		const { container, waitForRegistry } = render(
			<AudienceCreationNotice />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the notice if the user has not dismissed the notice and there is 1 available audience', async () => {
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

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID: '12345',
			propertyID: '34567',
			measurementID: '56789',
			webDataStreamID: '78901',
			availableAudiences: availableAudiences.filter(
				( { displayName } ) => displayName !== 'Returning visitors'
			),
		} );

		const { container, waitForRegistry } = render(
			<AudienceCreationNotice />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );
} );
