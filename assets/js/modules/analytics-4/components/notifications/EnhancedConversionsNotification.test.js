/**
 * Analytics EnhancedConversionsNotification component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
	render,
} from '../../../../../../tests/js/test-utils';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import EnhancedConversionsNotification, {
	ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS,
} from './EnhancedConversionsNotification';

describe( 'Analytics EnhancedConversionsNotification', () => {
	let registry;

	const EnhancedConversionsNotificationComponent =
		withNotificationComponentProps(
			ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS
		)( EnhancedConversionsNotification );

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserInfo( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID: '123456',
			propertyID: '654321',
		} );
	} );

	it( 'should render the notification', async () => {
		const { container, waitForRegistry } = render(
			<EnhancedConversionsNotificationComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );
} );
