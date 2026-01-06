/**
 * SetupUsingProxyWithSignIn component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	render,
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
	provideUserInfo,
	provideUserCapabilities,
	muteFetch,
	fireEvent,
	provideSiteInfo,
	waitFor,
	provideModuleRegistrations,
	act,
} from '../../../../../tests/js/test-utils';
import coreModulesFixture from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { mockLocation } from '../../../../../tests/js/mock-browser-utils';
import {
	ANALYTICS_NOTICE_CHECKBOX,
	ANALYTICS_NOTICE_FORM_NAME,
} from '@/js/components/setup/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { VIEW_CONTEXT_SPLASH } from '@/js/googlesitekit/constants';
import SetupUsingProxyWithSignIn from '@/js/components/setup/SetupUsingProxyWithSignIn';
import * as tracking from '@/js/util/tracking';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

jest.mock(
	'../CompatibilityChecks',
	() =>
		( { children } ) =>
			children( { complete: true } )
);

describe( 'SetupUsingProxyWithSignIn', () => {
	mockLocation();
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );
		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/connection' )
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/user/data/tracking' )
		);
	} );

	afterEach( () => {
		jest.resetAllMocks();
	} );

	it( 'should render the setup page, including the Activate Analytics notice', async () => {
		const { container, getByText, waitForRegistry } = render(
			<SetupUsingProxyWithSignIn />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText( /Connect Google Analytics as part of your setup/ )
		).toBeInTheDocument();
	} );

	it( 'should not render the Activate Analytics notice when the Analytics module is not available', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules(
				coreModulesFixture.filter(
					( { slug } ) => slug !== MODULE_SLUG_ANALYTICS_4
				)
			);

		const { container, waitForRegistry, queryByText } = render(
			<SetupUsingProxyWithSignIn />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			queryByText( /Connect Google Analytics as part of your setup/ )
		).not.toBeInTheDocument();
	} );

	it( 'should navigate to the proxy setup URL on CTA click', async () => {
		const { getByRole, waitForRegistry } = render(
			<SetupUsingProxyWithSignIn />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		await waitForRegistry();

		fireEvent.click(
			getByRole( 'button', { name: /sign in with google/i } )
		);

		const proxySetupURL = registry.select( CORE_SITE ).getProxySetupURL();

		await waitFor( () => {
			expect( global.location.assign ).toHaveBeenCalled();
			expect( global.location.assign ).toHaveBeenCalledWith(
				proxySetupURL
			);
		} );
	} );

	it( 'should track GA events on CTA click', async () => {
		const { getByRole, waitForRegistry } = render(
			<SetupUsingProxyWithSignIn />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		fireEvent.click(
			getByRole( 'button', { name: /sign in with google/i } )
		);

		await waitFor( () => {
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_SPLASH }_setup`,
				'start_site_setup',
				'proxy'
			);
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_SPLASH }_setup`,
				'start_user_setup',
				'proxy'
			);
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	it( 'should navigate to the proxy setup URL with Analytics re-auth redirect URL on CTA click if chosen to connect Analytics', async () => {
		fetchMock.postOnce(
			new RegExp( '^/google-site-kit/v1/core/modules/data/activation' ),
			{ body: { success: true } }
		);

		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{
				body: {
					authenticated: true,
					requiredScopes: [
						'https://www.googleapis.com/auth/analytics.readonly',
					],
					grantedScopes: [],
					unsatisfiedScopes: [
						'https://www.googleapis.com/auth/analytics.readonly',
					],
					needsReauthentication: true,
				},
			}
		);

		// Set the Analytics checkbox to true.
		registry.dispatch( CORE_FORMS ).setValues( ANALYTICS_NOTICE_FORM_NAME, {
			[ ANALYTICS_NOTICE_CHECKBOX ]: true,
		} );

		provideModuleRegistrations( registry );

		const { getByRole, waitForRegistry } = render(
			<SetupUsingProxyWithSignIn />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		await waitForRegistry();

		fireEvent.click(
			getByRole( 'button', { name: /sign in with google/i } )
		);

		await act( () =>
			registry.resolveSelect( MODULES_ANALYTICS_4 ).getAdminReauthURL()
		);

		const proxySetupURL = registry.select( CORE_SITE ).getProxySetupURL();
		const reauthURL = registry
			.select( MODULES_ANALYTICS_4 )
			.getAdminReauthURL();

		const finalURL = addQueryArgs( proxySetupURL, {
			redirect: reauthURL,
		} );

		await waitFor( () => {
			expect( global.location.assign ).toHaveBeenCalled();
			expect( global.location.assign ).toHaveBeenCalledWith( finalURL );
		} );
	} );

	it( 'should track GA events on CTA click when chosen to connect Analytics', async () => {
		fetchMock.postOnce(
			new RegExp( '^/google-site-kit/v1/core/modules/data/activation' ),
			{ body: { success: true } }
		);

		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{
				body: {
					authenticated: true,
					requiredScopes: [
						'https://www.googleapis.com/auth/analytics.readonly',
					],
					grantedScopes: [],
					unsatisfiedScopes: [
						'https://www.googleapis.com/auth/analytics.readonly',
					],
					needsReauthentication: true,
				},
			}
		);

		// Set the Analytics checkbox to true.
		registry.dispatch( CORE_FORMS ).setValues( ANALYTICS_NOTICE_FORM_NAME, {
			[ ANALYTICS_NOTICE_CHECKBOX ]: true,
		} );

		provideModuleRegistrations( registry );

		const { getByRole, waitForRegistry } = render(
			<SetupUsingProxyWithSignIn />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		fireEvent.click(
			getByRole( 'button', { name: /sign in with google/i } )
		);

		await waitFor( () => {
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_SPLASH }_setup`,
				'start_site_setup',
				'proxy'
			);
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_SPLASH }_setup`,
				'start_user_setup',
				'proxy'
			);
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_SPLASH }_setup`,
				'start_setup_with_analytics'
			);
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 3 );
		} );
	} );

	describe( 'with the `setupFlowRefresh` feature flag enabled', () => {
		const initialSetupSettingsEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/initial-setup-settings'
		);

		beforeEach( () => {
			muteFetch( initialSetupSettingsEndpoint );
		} );

		it( 'should render the setup page correctly', async () => {
			const { container, waitForRegistry } = render(
				<SetupUsingProxyWithSignIn />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SPLASH,
					features: [ 'setupFlowRefresh' ],
				}
			);

			await waitForRegistry();

			expect( container ).toMatchSnapshot();
		} );

		it( 'should render the setup page with the Analytics checkbox when the Analytics module is inactive', async () => {
			registry.dispatch( CORE_MODULES ).receiveGetModules(
				coreModulesFixture.map( ( module ) => {
					if ( MODULE_SLUG_ANALYTICS_4 === module.slug ) {
						return {
							...module,
							active: false,
						};
					}
					return module;
				} )
			);

			const { container, getByText, waitForRegistry } = render(
				<SetupUsingProxyWithSignIn />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SPLASH,
					features: [ 'setupFlowRefresh' ],
				}
			);

			await waitForRegistry();

			expect( container ).toMatchSnapshot();

			expect(
				getByText(
					/Get visitor insights by connecting Google Analytics as part of setup/
				)
			).toBeInTheDocument();
		} );

		it( 'should not render the Analytics checkbox when the Analytics module is already active', async () => {
			registry.dispatch( CORE_MODULES ).receiveGetModules(
				coreModulesFixture.map( ( module ) => {
					if ( MODULE_SLUG_ANALYTICS_4 === module.slug ) {
						return {
							...module,
							active: true,
						};
					}
					return module;
				} )
			);

			const { container, queryByText, waitForRegistry } = render(
				<SetupUsingProxyWithSignIn />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SPLASH,
					features: [ 'setupFlowRefresh' ],
				}
			);

			await waitForRegistry();

			expect( container ).toMatchSnapshot();

			expect(
				queryByText(
					/Get visitor insights by connecting Google Analytics as part of setup/
				)
			).not.toBeInTheDocument();
		} );

		it( 'should navigate to the proxy setup URL with Analytics re-auth redirect URL and `showProgress` query argument on CTA click if chosen to connect Analytics', async () => {
			fetchMock.postOnce( initialSetupSettingsEndpoint, {
				body: { settings: { isAnalyticsSetupComplete: false } },
			} );

			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/core/modules/data/activation'
				),
				{ body: { success: true } }
			);

			fetchMock.getOnce(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/authentication'
				),
				{
					body: {
						authenticated: true,
						requiredScopes: [
							'https://www.googleapis.com/auth/analytics.readonly',
						],
						grantedScopes: [],
						unsatisfiedScopes: [
							'https://www.googleapis.com/auth/analytics.readonly',
						],
						needsReauthentication: true,
					},
				}
			);

			// Set the Analytics checkbox to true.
			registry
				.dispatch( CORE_FORMS )
				.setValues( ANALYTICS_NOTICE_FORM_NAME, {
					[ ANALYTICS_NOTICE_CHECKBOX ]: true,
				} );

			provideModuleRegistrations( registry );

			const { getByRole, waitForRegistry } = render(
				<SetupUsingProxyWithSignIn />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SPLASH,
					features: [ 'setupFlowRefresh' ],
				}
			);

			await waitForRegistry();

			fireEvent.click(
				getByRole( 'button', { name: /sign in with google/i } )
			);

			await act( () =>
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getAdminReauthURL()
			);

			const proxySetupURL = registry
				.select( CORE_SITE )
				.getProxySetupURL();
			const reauthURL = registry
				.select( MODULES_ANALYTICS_4 )
				.getAdminReauthURL();
			const reauthURLWithShowProgress = addQueryArgs( reauthURL, {
				showProgress: true,
			} );

			const finalURL = addQueryArgs( proxySetupURL, {
				redirect: reauthURLWithShowProgress,
			} );

			await waitFor( () => {
				expect( global.location.assign ).toHaveBeenCalled();
				expect( global.location.assign ).toHaveBeenCalledWith(
					finalURL
				);
			} );
		} );

		it( 'should call saveInitialSetupSettings with isAnalyticsSetupComplete: false when starting setup with Analytics', async () => {
			fetchMock.postOnce( initialSetupSettingsEndpoint, {
				body: { settings: { isAnalyticsSetupComplete: false } },
			} );

			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/core/modules/data/activation'
				),
				{ body: { success: true } }
			);

			fetchMock.getOnce(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/authentication'
				),
				{
					body: {
						authenticated: true,
						requiredScopes: [
							'https://www.googleapis.com/auth/analytics.readonly',
						],
						grantedScopes: [],
						unsatisfiedScopes: [
							'https://www.googleapis.com/auth/analytics.readonly',
						],
						needsReauthentication: true,
					},
				}
			);

			registry
				.dispatch( CORE_FORMS )
				.setValues( ANALYTICS_NOTICE_FORM_NAME, {
					[ ANALYTICS_NOTICE_CHECKBOX ]: true,
				} );

			provideModuleRegistrations( registry );

			const { getByRole, waitForRegistry } = render(
				<SetupUsingProxyWithSignIn />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SPLASH,
					features: [ 'setupFlowRefresh' ],
				}
			);

			await waitForRegistry();

			fireEvent.click(
				getByRole( 'button', { name: /sign in with google/i } )
			);

			await act( () =>
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getAdminReauthURL()
			);

			await waitFor( () => {
				expect( fetchMock ).toHaveFetched(
					initialSetupSettingsEndpoint,
					{
						body: {
							data: {
								settings: { isAnalyticsSetupComplete: false },
							},
						},
					}
				);
			} );
		} );

		it( 'should allow exiting the setup', async () => {
			registry.dispatch( CORE_SITE ).receiveSiteInfo( {
				adminURL: 'http://example.com/wp-admin/',
			} );

			const { queryByText } = render( <SetupUsingProxyWithSignIn />, {
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
				features: [ 'setupFlowRefresh' ],
			} );

			expect( queryByText( /Exit setup/ ) ).toBeInTheDocument();

			fireEvent.click( queryByText( /Exit setup/ ) );

			await waitFor( () => {
				expect( global.location.assign ).toHaveBeenCalled();
			} );

			expect( global.location.assign ).toHaveBeenCalledWith(
				'http://example.com/wp-admin/plugins.php'
			);
		} );

		it( 'should render a "Why is this required?" information tooltip', async () => {
			const { getByText, waitForRegistry } = render(
				<SetupUsingProxyWithSignIn />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SPLASH,
					features: [ 'setupFlowRefresh' ],
				}
			);

			expect( getByText( /Why is this required?/ ) ).toBeInTheDocument();

			await waitForRegistry();
		} );

		it( 'should track GA events on CTA click', async () => {
			const { getByRole, waitForRegistry } = render(
				<SetupUsingProxyWithSignIn />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SPLASH,
					features: [ 'setupFlowRefresh' ],
				}
			);

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			fireEvent.click(
				getByRole( 'button', { name: /sign in with google/i } )
			);

			await waitFor( () => {
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_SPLASH }_setup`,
					'setup_flow_v3_start_site_setup',
					'proxy'
				);
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_SPLASH }_setup`,
					'setup_flow_v3_start_user_setup',
					'proxy'
				);
				expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
			} );
		} );

		it( 'should track GA events on CTA click when chosen to connect Analytics', async () => {
			fetchMock.postOnce( initialSetupSettingsEndpoint, {
				body: { settings: { isAnalyticsSetupComplete: false } },
			} );

			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/core/modules/data/activation'
				),
				{ body: { success: true } }
			);

			fetchMock.getOnce(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/authentication'
				),
				{
					body: {
						authenticated: true,
						requiredScopes: [
							'https://www.googleapis.com/auth/analytics.readonly',
						],
						grantedScopes: [],
						unsatisfiedScopes: [
							'https://www.googleapis.com/auth/analytics.readonly',
						],
						needsReauthentication: true,
					},
				}
			);

			// Set the Analytics checkbox to true.
			registry
				.dispatch( CORE_FORMS )
				.setValues( ANALYTICS_NOTICE_FORM_NAME, {
					[ ANALYTICS_NOTICE_CHECKBOX ]: true,
				} );

			provideModuleRegistrations( registry );

			const { getByRole, waitForRegistry } = render(
				<SetupUsingProxyWithSignIn />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SPLASH,
					features: [ 'setupFlowRefresh' ],
				}
			);

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			fireEvent.click(
				getByRole( 'button', { name: /sign in with google/i } )
			);

			await waitFor( () => {
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_SPLASH }_setup`,
					'setup_flow_v3_start_site_setup',
					'proxy'
				);
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_SPLASH }_setup`,
					'setup_flow_v3_start_user_setup',
					'proxy'
				);
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_SPLASH }_setup`,
					'setup_flow_v3_start_with_analytics'
				);
				expect( mockTrackEvent ).toHaveBeenCalledTimes( 3 );
			} );
		} );
	} );
} );
