/**
 * AdBlockingRecoveryWidget component tests.
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
import AdBlockingRecoveryWidget from './AdBlockingRecoveryWidget';
import {
	act,
	fireEvent,
	render,
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
	provideModules,
	unsubscribeFromAll,
} from '../../../../../../tests/js/test-utils';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	AD_BLOCKING_RECOVERY_SETUP_STATUS_SETUP_CONFIRMED,
	MODULES_ADSENSE,
} from '../../datastore/constants';
import {
	ACCOUNT_STATUS_PENDING,
	ACCOUNT_STATUS_READY,
	SITE_STATUS_ADDED,
	SITE_STATUS_READY,
} from '../../util';

describe( 'AdSenseConnectCTA', () => {
	let registry;
	const validSettings = {
		accountID: 'pub-12345678',
		clientID: 'ca-pub-12345678',
		useSnippet: false,
		accountStatus: ACCOUNT_STATUS_READY,
		siteStatus: SITE_STATUS_READY,
		adBlockingRecoverySetupStatus:
			AD_BLOCKING_RECOVERY_SETUP_STATUS_SETUP_CONFIRMED,
	};

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'adsense',
			},
		] );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'before click', () => {
		it.each( [
			[
				'the Adsense module is not connected',
				ACCOUNT_STATUS_PENDING,
				SITE_STATUS_READY,
				'',
				false,
				false,
				1684145866,
			],
			[
				'notification is dismissed',
				ACCOUNT_STATUS_PENDING,
				SITE_STATUS_READY,
				'',
				true,
				true,
				1684145866,
			],
			[
				'the Adsense account status is not ready',
				ACCOUNT_STATUS_PENDING,
				SITE_STATUS_READY,
				'',
				true,
				false,
				1684145866,
			],
			[
				'the Adsense site status is not ready',
				ACCOUNT_STATUS_READY,
				SITE_STATUS_ADDED,
				'',
				true,
				false,
				1684145866,
			],
			[
				'the Ad blocking recovery status is an empty string',
				ACCOUNT_STATUS_READY,
				SITE_STATUS_READY,
				'',
				true,
				false,
				1684145866,
			],
			[
				'the setup completed timestamp is less than three weeks',
				ACCOUNT_STATUS_READY,
				SITE_STATUS_READY,
				AD_BLOCKING_RECOVERY_SETUP_STATUS_SETUP_CONFIRMED,
				true,
				false,
				1686836242,
			],
		] )(
			'should not render the widget when %s',
			(
				testName,
				accountStatus,
				siteStatus,
				adBlockingRecoverySetupStatus,
				isModuleConnected,
				isNotificationDismissed,
				setupCompletedTimestamp
			) => {
				const Widget = ( { children } ) => <div>{ children }</div>;
				const WidgetNull = () => <div>NULL</div>;

				provideModules( registry, [
					{
						slug: 'adsense',
						active: true,
						connected: isModuleConnected,
					},
				] );

				registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
					...validSettings,
					accountStatus,
					siteStatus,
					adBlockingRecoverySetupStatus,
					setupCompletedTimestamp,
				} );
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [
						...( isNotificationDismissed
							? [ 'ad-blocking-recovery-notification' ]
							: [] ),
					] );

				const { container } = render(
					<AdBlockingRecoveryWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>,
					{
						registry,
					}
				);

				expect( container ).toHaveTextContent( 'NULL' );
			}
		);

		it( 'should render the widget for the existing site without the setup completion time', () => {
			const Widget = ( { children } ) => <div>{ children }</div>;
			const WidgetNull = () => <div>NULL</div>;

			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( validSettings );

			const { container } = render(
				<AdBlockingRecoveryWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
				}
			);
			expect( container ).toHaveTextContent(
				'Recover revenue lost to ad blockers'
			);
		} );

		it( 'should render the widget for the site with a setup completion time of more than three weeks', () => {
			const Widget = ( { children } ) => <div>{ children }</div>;
			const WidgetNull = () => <div>NULL</div>;

			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				...validSettings,
				setupCompletedTimestamp: 1684145866,
			} );

			const { container } = render(
				<AdBlockingRecoveryWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
				}
			);
			expect( container ).toHaveTextContent(
				'Recover revenue lost to ad blockers'
			);
		} );
	} );

	describe( 'after click', () => {
		let container;
		beforeEach( () => {
			const Widget = ( { children } ) => <div>{ children }</div>;
			const WidgetNull = () => <div>NULL</div>;

			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( validSettings );

			container = render(
				<div>
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AdBlockingRecoveryWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>
				</div>,
				{ registry }
			).container;

			fireEvent.click(
				container.querySelector( 'button.googlesitekit-cta-link' )
			);

			fetchMock.postOnce(
				RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
				{
					body: JSON.stringify( [
						'ad-blocking-recovery-notification',
					] ),
					status: 200,
				}
			);
		} );

		it( 'should open the tooltip', () => {
			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).toBeInTheDocument();
			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'should close the tooltip on clicking the close button', async () => {
			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					document.querySelector( '.googlesitekit-tooltip-close' )
				);
			} );
			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).not.toBeInTheDocument();
			expect( fetchMock ).toHaveFetchedTimes( 1 );
		} );

		it( 'should close the modal on clicking the dismiss button', async () => {
			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					document.querySelector(
						'.googlesitekit-tooltip-buttons > button'
					)
				);
			} );
			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).not.toBeInTheDocument();
			expect( fetchMock ).toHaveFetchedTimes( 1 );
		} );
	} );
} );
