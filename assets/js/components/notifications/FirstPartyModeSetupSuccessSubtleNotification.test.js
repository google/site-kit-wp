/**
 * FirstPartyModeSetupSuccessSubtleNotification component tests.
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

import {
	createTestRegistry,
	provideModules,
	render,
} from '../../../../tests/js/test-utils';
import FirstPartyModeSetupSuccessSubtleNotification from './FirstPartyModeSetupSuccessSubtleNotification';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';

const NotificationWithComponentProps = withNotificationComponentProps(
	'setup-success-notification-fpm'
)( FirstPartyModeSetupSuccessSubtleNotification );

describe( 'FirstPartyModeSetupSuccessSubtleNotification', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should render correctly when Analytics and Ads are connected', () => {
		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
			{
				slug: 'ads',
				active: true,
				connected: true,
			},
		] );

		const { container, getByText } = render(
			<NotificationWithComponentProps />,
			{ registry }
		);

		expect(
			getByText(
				'You can always disable it in Analytics or Ads settings'
			)
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render correctly when Analytics is connected but Ads is not', () => {
		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
		] );

		const { container, getByText } = render(
			<NotificationWithComponentProps />,
			{ registry }
		);

		expect(
			getByText( 'You can always disable it in Analytics settings' )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render correctly when Ads is connected but Analytics is not', () => {
		provideModules( registry, [
			{ slug: 'ads', active: true, connected: true },
		] );

		const { container, getByText } = render(
			<NotificationWithComponentProps />,
			{ registry }
		);

		expect(
			getByText( 'You can always disable it in Ads settings' )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );
} );
