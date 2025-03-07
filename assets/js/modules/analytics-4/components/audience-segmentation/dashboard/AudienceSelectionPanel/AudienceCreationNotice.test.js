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
	provideUserAuthentication,
	fireEvent,
	muteFetch,
	act,
} from '../../../../../../../../tests/js/test-utils';
import { availableAudiences } from '../../../../datastore/__fixtures__';
import * as tracking from '../../../../../../util/tracking';
import {
	AUDIENCE_CREATION_EDIT_SCOPE_NOTICE_SLUG,
	AUDIENCE_CREATION_NOTICE_SLUG,
	AUDIENCE_SELECTION_PANEL_OPENED_KEY,
} from './constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '../../../../datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../../googlesitekit/constants';
import AudienceCreationNotice from './AudienceCreationNotice';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'AudienceCreationNotice', () => {
	let registry;

	const createAudienceEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/create-audience'
	);
	const syncAvailableAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);
	const dismissItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserInfo( registry );
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
		] );
		provideModuleRegistrations( registry );

		registry
			.dispatch( CORE_UI )
			.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should render null if no audiences are available', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			availableAudiences: [
				availableAudiences[ 2 ],
				availableAudiences[ 3 ],
			],
		} );

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
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		// Verify the edit scope notice is not displayed.
		expect( container ).not.toHaveTextContent(
			'Creating these groups require more data tracking. You will be directed to update your Analytics property.'
		);

		expect( container ).toMatchSnapshot();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar-create-audiences`,
			'view_notice'
		);
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
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		// Verify the edit scope notice is not displayed.
		expect( container ).not.toHaveTextContent(
			'Creating these groups require more data tracking. You will be directed to update your Analytics property.'
		);

		expect( container ).toMatchSnapshot();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar-create-audiences`,
			'view_notice'
		);
	} );

	it.each( [
		[ 'new-visitors', 'New visitors' ],
		[ 'returning-visitors', 'Returning visitors' ],
	] )(
		'should track an event with label %s when creating the "%s" audience',
		async ( label, audienceDisplayName ) => {
			const filteredAudiences = availableAudiences.filter(
				( { displayName } ) => displayName !== audienceDisplayName
			);

			fetchMock.post( syncAvailableAudiencesEndpoint, {
				status: 200,
				body: filteredAudiences,
			} );

			muteFetch( createAudienceEndpoint );

			registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
				configuredAudiences: [],
				isAudienceSegmentationWidgetHidden: false,
				didSetAudiences: true,
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

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				accountID: '12345',
				propertyID: '34567',
				measurementID: '56789',
				webDataStreamID: '78901',
				availableAudiences: filteredAudiences,
			} );

			const { getByRole, waitForRegistry } = render(
				<AudienceCreationNotice />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			const button = getByRole( 'button', { name: /create/i } );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( button );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar-create-audiences`,
				'create_audience',
				label
			);
		}
	);

	it( 'should render the missing scope notice if the user does not have the edit scope', async () => {
		provideUserAuthentication( registry, {
			grantedScopes: [],
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
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		// Verify the edit scope notice is displayed.
		expect( container ).toHaveTextContent(
			'Creating these groups require more data tracking. You will be directed to update your Analytics property.'
		);

		expect( container ).toMatchSnapshot();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar-create-audiences`,
			'view_oauth_notice'
		);
	} );

	it( 'should track an event when the missing scope notice is dismissed', async () => {
		muteFetch( dismissItemEndpoint );

		provideUserAuthentication( registry, {
			grantedScopes: [],
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

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID: '12345',
			propertyID: '34567',
			measurementID: '56789',
			webDataStreamID: '78901',
			availableAudiences: [],
		} );

		const { getByRole, waitForRegistry } = render(
			<AudienceCreationNotice />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		const button = getByRole( 'button', { name: /Got it/i } );

		fireEvent.click( button );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar-create-audiences`,
			'dismiss_oauth_notice'
		);
	} );

	it( 'should not render the missing scope notice if the user does not have the edit scope but the notice has been dismissed', async () => {
		provideUserAuthentication( registry, {
			grantedScopes: [],
		} );
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				AUDIENCE_CREATION_EDIT_SCOPE_NOTICE_SLUG,
			] );

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

		// Verify the edit scope notice is not displayed.
		expect( container ).not.toHaveTextContent(
			'Creating these groups require more data tracking. You will be directed to update your Analytics property.'
		);

		expect( container ).toMatchSnapshot();
	} );
} );
