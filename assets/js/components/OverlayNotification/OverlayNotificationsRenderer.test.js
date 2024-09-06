/**
 * OverlayNotificationsRenderer component tests.
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
import OverlayNotificationsRenderer from './OverlayNotificationsRenderer';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';

describe( 'OverlayNotificationsRenderer', () => {
	let registry;

	beforeAll( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
			{
				slug: 'reader-revenue-manager',
				active: true,
				connected: true,
			},
		] );
	} );

	it( 'should render notification renderer component', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAudienceSegmentationSetupComplete( true );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, waitForRegistry } = render(
			<OverlayNotificationsRenderer />,
			{
				registry,
				features: [ 'audienceSegmentation', 'rrmModule' ],
			}
		);

		await waitForRegistry();

		expect( container ).not.toBeEmptyDOMElement();
	} );

	it( 'should not render PublicationApprovedOverlayNotification if readerRevenueManagerEnabled is false', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAudienceSegmentationSetupComplete( true );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { getByText, waitForRegistry } = render(
			<OverlayNotificationsRenderer />,
			{
				registry,
				features: [ 'audienceSegmentation' ],
			}
		);

		await waitForRegistry();

		expect( () =>
			getByText( 'Your Reader Revenue Manager publication is approved' )
		).toThrow( /Unable to find an element with the text/ );
	} );

	it( 'should not render AudienceSegmentationIntroductoryOverlayNotification if audienceSegmentationSetupComplete is false', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAudienceSegmentationSetupComplete( false );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { getByText, waitForRegistry } = render(
			<OverlayNotificationsRenderer />,
			{
				registry,
				features: [ 'rrmModule' ],
				context: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( () =>
			getByText(
				'You can now learn more about your site visitor groups by comparing different metrics'
			)
		).toThrow( /Unable to find an element with the text/ );
	} );

	it( 'should not render AudienceSegmentationIntroductoryOverlayNotification if audience segmentation setup is incomplete', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { getByText, waitForRegistry } = render(
			<OverlayNotificationsRenderer />,
			{
				registry,
				features: [ 'audienceSegmentation', 'rrmModule' ],
				context: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( () =>
			getByText(
				'You can now learn more about your site visitor groups by comparing different metrics'
			)
		).toThrow( /Unable to find an element with the text/ );
	} );
} );
