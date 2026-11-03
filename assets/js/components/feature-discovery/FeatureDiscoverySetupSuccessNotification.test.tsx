/**
 * FeatureDiscoverySetupSuccessNotification component tests.
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
 * Internal dependencies
 */
import { WHATS_NEW_TAB_PATH } from '@/js/components/feature-discovery/constants';
import { Registry } from '@/js/googlesitekit-data';
import { VIEW_CONTEXT_FEATURE_DISCOVERY } from '@/js/googlesitekit/constants';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { FEATURE_DISCOVERY_SETUP_SUCCESS_WHATS_NEW_NOTIFICATION } from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import FeatureDiscoverySetupSuccessNotification from './FeatureDiscoverySetupSuccessNotification';

const NOTIFICATION_ID = FEATURE_DISCOVERY_SETUP_SUCCESS_WHATS_NEW_NOTIFICATION;

const NotificationWithComponentProps = withNotificationComponentProps(
	NOTIFICATION_ID
)( FeatureDiscoverySetupSuccessNotification );

describe( 'FeatureDiscoverySetupSuccessNotification', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideFeatures( registry, [
			{
				slug: 'test-feature',
				successNotice: {
					title: 'Success! Test feature is set up',
					description: 'You can manage it in Settings',
				},
			},
		] );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				NOTIFICATION_ID,
				DEFAULT_NOTIFICATIONS[ NOTIFICATION_ID ]
			);
	} );

	it( 'should render the success notice for the feature the user returned from', () => {
		registry.dispatch( CORE_FEATURE_DISCOVERY ).receivePendingSetup( {
			featureSlug: 'test-feature',
			returnTab: WHATS_NEW_TAB_PATH,
		} );

		const { getByText } = render( <NotificationWithComponentProps />, {
			registry,
			viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
		} );

		expect(
			getByText( 'Success! Test feature is set up' )
		).toBeInTheDocument();
		expect(
			getByText( 'You can manage it in Settings' )
		).toBeInTheDocument();
	} );

	it( 'should render nothing when there is no pending setup', () => {
		registry.dispatch( CORE_FEATURE_DISCOVERY ).receivePendingSetup( null );

		const { container } = render( <NotificationWithComponentProps />, {
			registry,
			viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should clear the pending setup and leave the queue when dismissed', () => {
		registry.dispatch( CORE_FEATURE_DISCOVERY ).receivePendingSetup( {
			featureSlug: 'test-feature',
			returnTab: WHATS_NEW_TAB_PATH,
		} );

		const dismissNotificationSpy = jest.spyOn(
			registry.dispatch( CORE_NOTIFICATIONS ),
			'dismissNotification'
		);

		const { container, getByRole } = render(
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
			}
		);

		fireEvent.click( getByRole( 'button', { name: 'Got it' } ) );

		expect( dismissNotificationSpy ).toHaveBeenCalledWith(
			NOTIFICATION_ID
		);
		expect(
			registry.select( CORE_FEATURE_DISCOVERY ).getPendingSetup()
		).toBeNull();
		expect( container ).toBeEmptyDOMElement();

		dismissNotificationSpy.mockRestore();
	} );
} );
