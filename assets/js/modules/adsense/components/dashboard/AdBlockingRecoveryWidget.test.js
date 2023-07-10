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
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
} from '../../datastore/constants';
import {
	ACCOUNT_STATUS_PENDING,
	ACCOUNT_STATUS_READY,
	SITE_STATUS_ADDED,
	SITE_STATUS_READY,
} from '../../util';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import { stringToDate } from '../../../../util';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../googlesitekit/constants';

describe( 'AdBlockingRecoveryWidget', () => {
	let registry;
	const referenceDate = '2023-06-22';
	const timestampThreeWeeksPrior =
		stringToDate( '2023-06-01' ).getTime() / 1000;
	const timestampLessThanThreeWeeksPrior =
		stringToDate( '2023-06-02' ).getTime() / 1000;
	const validSettings = {
		accountID: 'pub-12345678',
		clientID: 'ca-pub-12345678',
		useSnippet: false,
		accountStatus: ACCOUNT_STATUS_READY,
		siteStatus: SITE_STATUS_READY,
		adBlockingRecoverySetupStatus: '',
	};

	const { Widget, WidgetNull } =
		getWidgetComponentProps( 'adBlockingRecovery' );

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
		registry.dispatch( CORE_USER ).setReferenceDate( referenceDate );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'before click', () => {
		const shouldRender = {
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			accountStatus: ACCOUNT_STATUS_READY,
			siteStatus: SITE_STATUS_READY,
			adBlockingRecoverySetupStatus: '',
			isModuleConnected: true,
			isNotificationDismissed: false,
			setupCompletedTimestamp: timestampThreeWeeksPrior,
			existingAdBlockingRecoveryTag: null,
		};
		const testData = [
			[
				'in view only dashboard',
				{
					...shouldRender,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
				},
			],
			[
				'the Adsense module is not connected',
				{
					...shouldRender,
					isModuleConnected: false,
				},
			],
			[
				'notification is dismissed',
				{
					...shouldRender,
					isNotificationDismissed: true,
				},
			],
			[
				'the Adsense account status is not ready',
				{
					...shouldRender,
					accountStatus: ACCOUNT_STATUS_PENDING,
				},
			],
			[
				'the Adsense site status is not ready',
				{
					...shouldRender,
					siteStatus: SITE_STATUS_ADDED,
				},
			],
			[
				'the Ad blocking recovery status is not an empty string',
				{
					...shouldRender,
					adBlockingRecoverySetupStatus:
						ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED,
				},
			],
			[
				'the setup completed timestamp is less than three weeks',
				{
					...shouldRender,
					setupCompletedTimestamp: timestampLessThanThreeWeeksPrior,
				},
			],
			[
				'an existing ad blocking recovery tag is detected',
				{
					...shouldRender,
					existingAdBlockingRecoveryTag: 'pub-3467161886473746',
				},
			],
		];

		it.each( testData )(
			'should not render the widget when %s',
			(
				_,
				{
					viewContext,
					accountStatus,
					siteStatus,
					adBlockingRecoverySetupStatus,
					isModuleConnected,
					isNotificationDismissed,
					setupCompletedTimestamp,
					existingAdBlockingRecoveryTag,
				}
			) => {
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
					.dispatch( MODULES_ADSENSE )
					.receiveGetExistingAdBlockingRecoveryTag(
						existingAdBlockingRecoveryTag
					);
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
						viewContext,
					}
				);

				expect( container ).toBeEmptyDOMElement();
			}
		);

		it( 'should render the widget for the existing site without the setup completion time', () => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( validSettings );

			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingAdBlockingRecoveryTag( null );

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
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				...validSettings,
				setupCompletedTimestamp: timestampThreeWeeksPrior,
			} );

			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingAdBlockingRecoveryTag( null );

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
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( validSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingAdBlockingRecoveryTag( null );

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
