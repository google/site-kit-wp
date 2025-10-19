/**
 * EnhancedConversionsSettingsNotice component tests.
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
	fireEvent,
	render,
	waitFor,
} from '../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
} from '../../../../../../tests/js/utils';
import * as tracking from '@/js/util/tracking';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS } from '@/js/modules/analytics-4/components/notifications/EnhancedConversionsNotification';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { VIEW_CONTEXT_SETTINGS } from '@/js/googlesitekit/constants';
import EnhancedConversionsSettingsNotice from '@/js/modules/analytics-4/components/settings/EnhancedConversionsSettingsNotice';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'EnhancedConversionsNotification', () => {
	let registry;

	const dismissItemEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserInfo( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID: '123456',
			propertyID: '654321',
		} );

		mockTrackEvent.mockClear();
	} );

	it( 'should render the notice', async () => {
		const { container, waitForRegistry } = render(
			<EnhancedConversionsSettingsNotice />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should dismiss the notice when the dismiss button is clicked', async () => {
		fetchMock.postOnce( dismissItemEndpointRegExp, {
			body: [ ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS ],
		} );

		const { getByRole, waitForRegistry } = render(
			<EnhancedConversionsSettingsNotice />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const dismissButton = getByRole( 'button', { name: /no thanks/i } );

		fireEvent.click( dismissButton );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( fetchMock ).toHaveFetched( dismissItemEndpointRegExp );
			expect(
				registry
					.select( CORE_USER )
					.isItemDismissed(
						ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS
					)
			).toBe( true );
		} );
	} );

	it( 'should not render when the notification is dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS,
			] );

		const { container, waitForRegistry } = render(
			<EnhancedConversionsSettingsNotice />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	describe( 'event tracking', () => {
		const eventCategory = `${ VIEW_CONTEXT_SETTINGS }_${ ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS }`;

		it( 'should track an event when the notification is viewed', async () => {
			const { waitForRegistry } = render(
				<EnhancedConversionsSettingsNotice />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SETTINGS,
				}
			);

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				eventCategory,
				'view_notification'
			);
		} );

		it( 'should track an event when the CTA button is clicked', async () => {
			fetchMock.postOnce( dismissItemEndpointRegExp, {
				body: [ ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS ],
			} );

			const { getByRole, waitForRegistry } = render(
				<EnhancedConversionsSettingsNotice />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SETTINGS,
				}
			);

			await waitForRegistry();

			const ctaButton = getByRole( 'button', {
				name: /go to analytics/i,
			} );

			// Add click handler to prevent navigation.
			ctaButton.addEventListener( 'click', ( e ) => e.preventDefault() );

			fireEvent.click( ctaButton );

			await waitFor( () => {
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					eventCategory,
					'confirm_notification'
				);
			} );
		} );

		it( 'should track an event when the dismiss button is clicked', async () => {
			fetchMock.postOnce( dismissItemEndpointRegExp, {
				body: [ ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS ],
			} );

			const { getByRole, waitForRegistry } = render(
				<EnhancedConversionsSettingsNotice />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SETTINGS,
				}
			);

			await waitForRegistry();

			const dismissButton = getByRole( 'button', {
				name: /no thanks/i,
			} );

			fireEvent.click( dismissButton );

			await waitFor( () => {
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					eventCategory,
					'dismiss_notification'
				);
			} );
		} );

		it( 'should track an event when the learn more link is clicked', async () => {
			const { getByRole, waitForRegistry } = render(
				<EnhancedConversionsSettingsNotice />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SETTINGS,
				}
			);

			await waitForRegistry();

			const learnMoreLink = getByRole( 'link', {
				name: /learn more/i,
			} );

			fireEvent.click( learnMoreLink );

			await waitFor( () => {
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					eventCategory,
					'click_learn_more_link',
					undefined,
					undefined
				);
			} );
		} );
	} );
} );
