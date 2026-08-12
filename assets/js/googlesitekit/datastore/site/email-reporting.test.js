/**
 * `core/site` data store: Email Reporting settings tests.
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
import { setUsingCache } from 'googlesitekit-api';
import {
	createTestRegistry,
	freezeFetch,
	provideUserInfo,
	untilResolved,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site Email Reporting', () => {
	let registry;

	const emailReportingSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/site/data/email-reporting'
	);
	const eligibleSubscribersEndpointRegExp =
		/email-reporting-eligible-subscribers/;
	const subscribedUsersEndpointRegExp = /email-reporting-subscribed-users/;

	const emailReportingErrorsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/site/data/email-reporting-errors'
	);
	const inviteUserEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/site/data/email-reporting-invite-user'
	);
	const unsubscribeUserEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/site/data/email-reporting-unsubscribe-user'
	);
	const USER_ID_PARAM = 'userID';
	const defaultEligibleSubscribersArgs = { search: '' };

	function createEligibleSubscribersResponse( users, args = {} ) {
		const page = Number.isInteger( args.page ) ? args.page : 1;
		const total = Number.isInteger( args.total )
			? args.total
			: users.length;
		const totalPages = Number.isInteger( args.totalPages )
			? args.totalPages
			: 1;

		return {
			page,
			total,
			totalPages,
			users,
		};
	}

	/**
	 * Mocks one subscribed-users response with the given users and waits for
	 * `getSubscribedUsers` to resolve, so a test starts from a filled cache.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Array}  users  Users the endpoint answers with.
	 * @param {Object} [args] Page and search args to resolve.
	 * @return {Promise} Promise that resolves once the listing is in the store.
	 */
	async function resolveSubscribedUsers(
		users,
		args = defaultEligibleSubscribersArgs
	) {
		fetchMock.getOnce( subscribedUsersEndpointRegExp, {
			body: createEligibleSubscribersResponse( users ),
			status: 200,
		} );

		registry.select( CORE_SITE ).getSubscribedUsers( args );

		await untilResolved( registry, CORE_SITE ).getSubscribedUsers( args );
	}

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		fetchMock.reset();
		registry = createTestRegistry();
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'saveEmailReportingSettings', () => {
			it( 'saves the settings and returns the response', async () => {
				const updatedSettings = {
					enabled: true,
				};

				fetchMock.postOnce( emailReportingSettingsEndpointRegExp, {
					body: updatedSettings,
					status: 200,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: false,
					} );

				registry.dispatch( CORE_SITE ).setEmailReportingEnabled( true );

				const { response } = await registry
					.dispatch( CORE_SITE )
					.saveEmailReportingSettings();

				expect( fetchMock ).toHaveFetched(
					emailReportingSettingsEndpointRegExp,
					{
						body: {
							data: {
								settings: updatedSettings,
							},
						},
					}
				);

				expect( response ).toEqual( updatedSettings );
			} );

			it( 'returns an error if the request fails', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce( emailReportingSettingsEndpointRegExp, {
					body: errorResponse,
					status: 500,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: false,
					} );

				registry.dispatch( CORE_SITE ).setEmailReportingEnabled( true );

				const { error } = await registry
					.dispatch( CORE_SITE )
					.saveEmailReportingSettings();

				expect( fetchMock ).toHaveFetched(
					emailReportingSettingsEndpointRegExp,
					{
						body: {
							data: {
								settings: { enabled: true },
							},
						},
					}
				);

				expect( error ).toEqual( errorResponse );

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'setEmailReportingEnabled', () => {
			it( 'sets the enabled status', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: false,
					} );

				expect(
					registry.select( CORE_SITE ).isEmailReportingEnabled()
				).toBe( false );

				registry.dispatch( CORE_SITE ).setEmailReportingEnabled( true );

				expect(
					registry.select( CORE_SITE ).isEmailReportingEnabled()
				).toBe( true );
			} );

			it( 'requires a boolean argument', () => {
				expect( () => {
					registry.dispatch( CORE_SITE ).setEmailReportingEnabled();
				} ).toThrow( 'enabled should be a boolean.' );

				expect( () => {
					registry
						.dispatch( CORE_SITE )
						.setEmailReportingEnabled( undefined );
				} ).toThrow( 'enabled should be a boolean.' );

				expect( () => {
					registry
						.dispatch( CORE_SITE )
						.setEmailReportingEnabled( 'true' );
				} ).toThrow( 'enabled should be a boolean.' );

				expect( () => {
					registry
						.dispatch( CORE_SITE )
						.setEmailReportingEnabled( true );

					registry
						.dispatch( CORE_SITE )
						.setEmailReportingEnabled( false );
				} ).not.toThrow( 'enabled should be a boolean.' );
			} );
		} );

		describe( 'inviteUser', () => {
			it( 'sends an invite request and returns successful response', async () => {
				const userID = 123;
				const successResponse = { success: true };

				fetchMock.postOnce( inviteUserEndpointRegExp, {
					body: successResponse,
					status: 200,
				} );

				const { response, error } = await registry
					.dispatch( CORE_SITE )
					.inviteUser( userID );

				expect( fetchMock ).toHaveFetched( inviteUserEndpointRegExp, {
					body: {
						data: {
							[ USER_ID_PARAM ]: userID,
						},
					},
				} );
				expect( response ).toEqual( successResponse );
				expect( error ).toBeUndefined();
			} );

			it( 'returns an error response if invite fails', async () => {
				const userID = 321;
				const errorResponse = {
					code: 'email_reporting_ineligible_user',
					message:
						'The provided user is not eligible for invitation.',
					data: { status: 400 },
				};

				fetchMock.postOnce( inviteUserEndpointRegExp, {
					body: errorResponse,
					status: 400,
				} );

				const { response, error } = await registry
					.dispatch( CORE_SITE )
					.inviteUser( userID );

				expect( response ).toBeUndefined();
				expect( error ).toEqual( errorResponse );
				expect( console ).toHaveErrored();
			} );

			it( 'marks user as invited in eligible subscribers after successful invite', async () => {
				const userID = 123;

				// First, resolve eligible subscribers with the user not yet invited.
				fetchMock.getOnce( eligibleSubscribersEndpointRegExp, {
					body: createEligibleSubscribersResponse( [
						{
							id: userID,
							displayName: 'Test User',
							email: 'test@example.com',
							role: 'editor',
							subscribed: false,
							invited: false,
						},
					] ),
					status: 200,
				} );

				provideUserInfo( registry, { id: 1 } );

				registry
					.select( CORE_SITE )
					.getEligibleSubscribers( defaultEligibleSubscribersArgs );
				await untilResolved(
					registry,
					CORE_SITE
				).getEligibleSubscribers( defaultEligibleSubscribersArgs );

				const subscribersBefore = registry
					.select( CORE_SITE )
					.getEligibleSubscribers( defaultEligibleSubscribersArgs );
				expect( subscribersBefore.users[ 0 ].invited ).toBe( false );

				// Now invite the user successfully.
				fetchMock.postOnce( inviteUserEndpointRegExp, {
					body: { success: true },
					status: 200,
				} );

				await registry.dispatch( CORE_SITE ).inviteUser( userID );

				// The user should now be marked as invited in the store.
				const subscribersAfter = registry
					.select( CORE_SITE )
					.getEligibleSubscribers( defaultEligibleSubscribersArgs );
				expect( subscribersAfter.users[ 0 ].invited ).toBe( true );
			} );

			it( 'does not mark user as invited after failed invite', async () => {
				const userID = 321;

				// First, resolve eligible subscribers with the user not yet invited.
				fetchMock.getOnce( eligibleSubscribersEndpointRegExp, {
					body: createEligibleSubscribersResponse( [
						{
							id: userID,
							displayName: 'Test User',
							email: 'test@example.com',
							role: 'editor',
							subscribed: false,
							invited: false,
						},
					] ),
					status: 200,
				} );

				provideUserInfo( registry, { id: 1 } );

				registry
					.select( CORE_SITE )
					.getEligibleSubscribers( defaultEligibleSubscribersArgs );
				await untilResolved(
					registry,
					CORE_SITE
				).getEligibleSubscribers( defaultEligibleSubscribersArgs );

				// Now invite a user that fails.
				fetchMock.postOnce( inviteUserEndpointRegExp, {
					body: {
						code: 'email_reporting_ineligible_user',
						message:
							'The provided user is not eligible for invitation.',
						data: { status: 400 },
					},
					status: 400,
				} );

				await registry.dispatch( CORE_SITE ).inviteUser( userID );

				// The user should still NOT be marked as invited.
				const subscribersAfter = registry
					.select( CORE_SITE )
					.getEligibleSubscribers( defaultEligibleSubscribersArgs );
				expect( subscribersAfter.users[ 0 ].invited ).toBe( false );

				expect( console ).toHaveErrored();
			} );

			it( 'validates userID as a positive integer', () => {
				expect( () => {
					registry.dispatch( CORE_SITE ).inviteUser();
				} ).toThrow( 'userID should be a positive integer.' );
				expect( () => {
					registry.dispatch( CORE_SITE ).inviteUser( -1 );
				} ).toThrow( 'userID should be a positive integer.' );
				expect( () => {
					registry.dispatch( CORE_SITE ).inviteUser( 0 );
				} ).toThrow( 'userID should be a positive integer.' );
				expect( () => {
					registry.dispatch( CORE_SITE ).inviteUser( 1.5 );
				} ).toThrow( 'userID should be a positive integer.' );
				expect( () => {
					registry.dispatch( CORE_SITE ).inviteUser( '1' );
				} ).toThrow( 'userID should be a positive integer.' );
			} );
		} );

		describe( 'unsubscribeUser', () => {
			const subscribedUser = {
				id: 123,
				displayName: 'Subscribed User',
				email: 'subscribed@example.com',
				role: 'editor',
			};
			const otherSubscribedUser = {
				id: 456,
				displayName: 'Other Subscribed User',
				email: 'other@example.com',
				role: 'author',
			};

			it( 'posts the unsubscribe request and returns the response with no error', async () => {
				const successResponse = { success: true };

				fetchMock.postOnce( unsubscribeUserEndpointRegExp, {
					body: successResponse,
					status: 200,
				} );

				const { response, error } = await registry
					.dispatch( CORE_SITE )
					.unsubscribeUser( subscribedUser.id );

				expect( fetchMock ).toHaveFetched(
					unsubscribeUserEndpointRegExp,
					{
						body: {
							data: {
								[ USER_ID_PARAM ]: subscribedUser.id,
							},
						},
					}
				);
				expect( response ).toEqual( successResponse );
				expect( error ).toBeUndefined();
			} );

			it( 'returns the error and no response when the unsubscribe request fails', async () => {
				const errorResponse = {
					code: 'email_reporting_user_not_subscribed',
					message: 'The user is not subscribed to email reports.',
					data: { status: 400 },
				};

				fetchMock.postOnce( unsubscribeUserEndpointRegExp, {
					body: errorResponse,
					status: 400,
				} );

				const { response, error } = await registry
					.dispatch( CORE_SITE )
					.unsubscribeUser( subscribedUser.id );

				expect( response ).toBeUndefined();
				expect( error ).toEqual( errorResponse );
				expect( console ).toHaveErrored();
			} );

			it( 'drops the unsubscribed user from the cached subscribed-users listing and lowers the total by one', async () => {
				await resolveSubscribedUsers( [
					subscribedUser,
					otherSubscribedUser,
				] );

				fetchMock.postOnce( unsubscribeUserEndpointRegExp, {
					body: { success: true },
					status: 200,
				} );

				await registry
					.dispatch( CORE_SITE )
					.unsubscribeUser( subscribedUser.id );

				expect(
					registry
						.select( CORE_SITE )
						.getSubscribedUsers( defaultEligibleSubscribersArgs )
				).toEqual( {
					users: [
						{
							id: otherSubscribedUser.id,
							name: otherSubscribedUser.displayName,
							email: otherSubscribedUser.email,
							role: otherSubscribedUser.role,
						},
					],
					total: 1,
				} );
			} );

			it( 'removes the user from every search cache that lists them and keeps the other terms as they were', async () => {
				await resolveSubscribedUsers( [ subscribedUser ], {
					search: 'subscribed',
				} );
				await resolveSubscribedUsers( [ otherSubscribedUser ], {
					search: 'other',
				} );

				fetchMock.postOnce( unsubscribeUserEndpointRegExp, {
					body: { success: true },
					status: 200,
				} );

				await registry
					.dispatch( CORE_SITE )
					.unsubscribeUser( subscribedUser.id );

				expect(
					registry
						.select( CORE_SITE )
						.getSubscribedUsers( { search: 'subscribed' } )
				).toEqual( { users: [], total: 0 } );
				expect(
					registry
						.select( CORE_SITE )
						.getSubscribedUsers( { search: 'other' } )
				).toEqual( {
					users: [
						{
							id: otherSubscribedUser.id,
							name: otherSubscribedUser.displayName,
							email: otherSubscribedUser.email,
							role: otherSubscribedUser.role,
						},
					],
					total: 1,
				} );
			} );

			it( 'keeps a cached total at zero when the removal would go below it', async () => {
				// The subscribed-users endpoint can return users with no `total`
				// field, and sanitizeUserListTotal() turns that missing value into
				// zero. Dispatching `total: 0` with one user recreates that state,
				// so the unsubscribe would push the total under zero without the
				// floor.
				registry.dispatch( CORE_SITE ).receiveGetSubscribedUsers(
					createEligibleSubscribersResponse( [ subscribedUser ], {
						total: 0,
					} ),
					{ page: 1, search: '' }
				);

				fetchMock.postOnce( unsubscribeUserEndpointRegExp, {
					body: { success: true },
					status: 200,
				} );

				await registry
					.dispatch( CORE_SITE )
					.unsubscribeUser( subscribedUser.id );

				const [ cachedResult ] = Object.values(
					registry.stores[ CORE_SITE ].store.getState().emailReporting
						.subscribedUsers
				);

				expect( cachedResult.total ).toBe( 0 );
			} );

			it( 'keeps the cached subscribed-users listing unchanged when the unsubscribe fails', async () => {
				await resolveSubscribedUsers( [
					subscribedUser,
					otherSubscribedUser,
				] );

				fetchMock.postOnce( unsubscribeUserEndpointRegExp, {
					body: {
						code: 'email_reporting_unsubscribe_failed',
						message:
							'Unable to unsubscribe the user from email reports.',
						data: { status: 500 },
					},
					status: 500,
				} );

				await registry
					.dispatch( CORE_SITE )
					.unsubscribeUser( subscribedUser.id );

				const { users, total } = registry
					.select( CORE_SITE )
					.getSubscribedUsers( defaultEligibleSubscribersArgs );

				expect( users.map( ( { id } ) => id ) ).toEqual( [
					subscribedUser.id,
					otherSubscribedUser.id,
				] );
				expect( total ).toBe( 2 );

				expect( console ).toHaveErrored();
			} );

			it( 'throws unless the user ID is a positive integer', () => {
				expect( () => {
					registry.dispatch( CORE_SITE ).unsubscribeUser();
				} ).toThrow( 'userID should be a positive integer.' );
				expect( () => {
					registry.dispatch( CORE_SITE ).unsubscribeUser( -1 );
				} ).toThrow( 'userID should be a positive integer.' );
				expect( () => {
					registry.dispatch( CORE_SITE ).unsubscribeUser( 0 );
				} ).toThrow( 'userID should be a positive integer.' );
				expect( () => {
					registry.dispatch( CORE_SITE ).unsubscribeUser( 1.5 );
				} ).toThrow( 'userID should be a positive integer.' );
				expect( () => {
					registry.dispatch( CORE_SITE ).unsubscribeUser( '1' );
				} ).toThrow( 'userID should be a positive integer.' );
			} );
		} );

		describe( 'resetEligibleSubscribers', () => {
			it( 'clears cached eligible subscribers', async () => {
				fetchMock.get( eligibleSubscribersEndpointRegExp, {
					body: createEligibleSubscribersResponse( [] ),
					status: 200,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetEligibleSubscribers(
						createEligibleSubscribersResponse( [] ),
						{ page: 1, search: '' }
					);
				registry
					.dispatch( CORE_SITE )
					.receiveGetEligibleSubscribers(
						createEligibleSubscribersResponse( [] ),
						{ page: 1, search: 'editor' }
					);

				expect(
					registry.select( CORE_SITE ).getEligibleSubscribers( {
						search: '',
					} )
				).toBeDefined();
				expect(
					registry.select( CORE_SITE ).getEligibleSubscribers( {
						search: 'editor',
					} )
				).toBeDefined();

				await registry.dispatch( CORE_SITE ).resetEligibleSubscribers();

				expect(
					registry.stores[ CORE_SITE ].store.getState().emailReporting
						.eligibleSubscribers
				).toEqual( {} );
			} );

			it( 'invalidates resolver state so prior args can re-fetch', async () => {
				provideUserInfo( registry, { id: 1 } );

				fetchMock.getOnce( eligibleSubscribersEndpointRegExp, {
					body: createEligibleSubscribersResponse( [
						{
							id: 2,
							displayName: 'Eligible User',
							email: 'eligible@example.com',
							role: 'editor',
							subscribed: false,
							invited: false,
						},
					] ),
					status: 200,
				} );

				registry
					.select( CORE_SITE )
					.getEligibleSubscribers( defaultEligibleSubscribersArgs );
				await untilResolved(
					registry,
					CORE_SITE
				).getEligibleSubscribers( defaultEligibleSubscribersArgs );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				await registry.dispatch( CORE_SITE ).resetEligibleSubscribers();

				fetchMock.getOnce( eligibleSubscribersEndpointRegExp, {
					body: createEligibleSubscribersResponse( [
						{
							id: 3,
							displayName: 'Another Eligible User',
							email: 'another@example.com',
							role: 'author',
							subscribed: false,
							invited: false,
						},
					] ),
					status: 200,
				} );

				registry
					.select( CORE_SITE )
					.getEligibleSubscribers( defaultEligibleSubscribersArgs );
				await untilResolved(
					registry,
					CORE_SITE
				).getEligibleSubscribers( defaultEligibleSubscribersArgs );

				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );
		} );

		describe( 'resetSubscribedUsers', () => {
			it( 'clears the cached subscribed-users listings for every page and search term', async () => {
				// resetSubscribedUsers invalidates getSubscribedUsers resolution, so
				// the resolver runs again for both cached search terms and this
				// catch-all mock responds to both refetches.
				fetchMock.get( subscribedUsersEndpointRegExp, {
					body: createEligibleSubscribersResponse( [] ),
					status: 200,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetSubscribedUsers(
						createEligibleSubscribersResponse( [] ),
						{
							page: 1,
							search: '',
						}
					);
				registry
					.dispatch( CORE_SITE )
					.receiveGetSubscribedUsers(
						createEligibleSubscribersResponse( [] ),
						{
							page: 1,
							search: 'editor',
						}
					);

				expect(
					registry.select( CORE_SITE ).getSubscribedUsers( {
						search: '',
					} )
				).toBeDefined();
				expect(
					registry.select( CORE_SITE ).getSubscribedUsers( {
						search: 'editor',
					} )
				).toBeDefined();

				await registry.dispatch( CORE_SITE ).resetSubscribedUsers();

				expect(
					registry.stores[ CORE_SITE ].store.getState().emailReporting
						.subscribedUsers
				).toEqual( {} );
			} );

			it( 'fetches again for args the store already resolved once the reset lands', async () => {
				await resolveSubscribedUsers( [
					{
						id: 2,
						displayName: 'Subscribed User',
						email: 'subscribed@example.com',
						role: 'editor',
					},
				] );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				await registry.dispatch( CORE_SITE ).resetSubscribedUsers();

				await resolveSubscribedUsers( [
					{
						id: 3,
						displayName: 'Another Subscribed User',
						email: 'another@example.com',
						role: 'author',
					},
				] );

				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getEmailReportingSettings', () => {
			it( 'uses a resolver to make a network request', async () => {
				const emailReportingSettings = {
					enabled: false,
				};

				fetchMock.getOnce( emailReportingSettingsEndpointRegExp, {
					body: emailReportingSettings,
					status: 200,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getEmailReportingSettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getEmailReportingSettings();

				const settings = registry
					.select( CORE_SITE )
					.getEmailReportingSettings();

				expect( settings ).toEqual( emailReportingSettings );

				expect( fetchMock ).toHaveFetched(
					emailReportingSettingsEndpointRegExp
				);
			} );

			it( 'returns undefined if the request fails', async () => {
				fetchMock.getOnce( emailReportingSettingsEndpointRegExp, {
					body: { error: 'something went wrong' },
					status: 500,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getEmailReportingSettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getEmailReportingSettings();

				const settings = registry
					.select( CORE_SITE )
					.getEmailReportingSettings();

				// Verify the settings are still undefined after the selector is resolved.
				expect( settings ).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetched(
					emailReportingSettingsEndpointRegExp
				);

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isEmailReportingEnabled', () => {
			it( 'returns undefined when settings are undefined', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {} );

				expect(
					registry.select( CORE_SITE ).isEmailReportingEnabled()
				).toBe( undefined );
			} );

			it( 'returns the enabled status when settings are loaded', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: true,
					} );

				expect(
					registry.select( CORE_SITE ).isEmailReportingEnabled()
				).toBe( true );
			} );

			it( 'returns false when enabled is false', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetEmailReportingSettings( {
						enabled: false,
					} );

				expect(
					registry.select( CORE_SITE ).isEmailReportingEnabled()
				).toBe( false );
			} );
		} );

		describe( 'getEligibleSubscribers', () => {
			it( 'returns cached data for matching params', () => {
				provideUserInfo( registry, { id: 1 } );

				registry.dispatch( CORE_SITE ).receiveGetEligibleSubscribers(
					createEligibleSubscribersResponse( [
						{
							id: 1,
							displayName: 'Current User',
							email: 'current@example.com',
							role: 'administrator',
							subscribed: false,
							invited: false,
						},
						{
							id: 2,
							displayName: 'Eligible User',
							email: 'eligible@example.com',
							role: 'editor',
							subscribed: false,
							invited: false,
						},
					] ),
					{ page: 1, search: '' }
				);

				expect(
					registry.select( CORE_SITE ).getEligibleSubscribers( {
						search: '',
					} )
				).toEqual( {
					users: [
						{
							id: 2,
							name: 'Eligible User',
							email: 'eligible@example.com',
							role: 'editor',
							subscribed: false,
							invited: false,
						},
					],
					total: 2,
					totalPages: 1,
				} );
			} );

			it( 'exposes roleDisplayName on the user role field when the API provides it', () => {
				provideUserInfo( registry, { id: 1 } );

				registry.dispatch( CORE_SITE ).receiveGetEligibleSubscribers(
					createEligibleSubscribersResponse( [
						{
							id: 2,
							displayName: 'Eligible User',
							email: 'eligible@example.com',
							role: 'editor',
							roleDisplayName: 'Editor',
							subscribed: false,
							invited: false,
						},
					] ),
					{ page: 1, search: '' }
				);

				expect(
					registry.select( CORE_SITE ).getEligibleSubscribers( {
						search: '',
					} )
				).toEqual( {
					users: [
						{
							id: 2,
							name: 'Eligible User',
							email: 'eligible@example.com',
							role: 'Editor',
							subscribed: false,
							invited: false,
						},
					],
					total: 1,
					totalPages: 1,
				} );
			} );

			it( 'falls back to the role slug when roleDisplayName is missing', () => {
				provideUserInfo( registry, { id: 1 } );

				registry.dispatch( CORE_SITE ).receiveGetEligibleSubscribers(
					createEligibleSubscribersResponse( [
						{
							id: 2,
							displayName: 'Eligible User',
							email: 'eligible@example.com',
							role: 'editor',
							subscribed: false,
							invited: false,
						},
					] ),
					{ page: 1, search: '' }
				);

				expect(
					registry.select( CORE_SITE ).getEligibleSubscribers( {
						search: '',
					} ).users[ 0 ].role
				).toBe( 'editor' );
			} );

			it( 'resolver fetches with correct params on cache miss', async () => {
				provideUserInfo( registry, { id: 1 } );

				fetchMock.getOnce( eligibleSubscribersEndpointRegExp, {
					body: createEligibleSubscribersResponse( [
						{
							id: 2,
							displayName: 'Search User',
							email: 'search@example.com',
							role: 'editor',
							subscribed: false,
							invited: false,
						},
					] ),
					status: 200,
				} );

				expect(
					registry.select( CORE_SITE ).getEligibleSubscribers( {
						search: 'search',
					} )
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getEligibleSubscribers( { search: 'search' } );

				expect( fetchMock ).toHaveFetched(
					eligibleSubscribersEndpointRegExp,
					{
						queryParams: {
							page: 1,
							search: 'search',
						},
					}
				);
			} );

			it( 'caches different param combinations independently', async () => {
				provideUserInfo( registry, { id: 1 } );

				fetchMock.getOnce( eligibleSubscribersEndpointRegExp, {
					body: createEligibleSubscribersResponse( [
						{
							id: 2,
							displayName: 'Alpha User',
							email: 'alpha@example.com',
							role: 'editor',
							subscribed: false,
							invited: false,
						},
					] ),
					status: 200,
				} );

				fetchMock.getOnce( eligibleSubscribersEndpointRegExp, {
					body: createEligibleSubscribersResponse( [
						{
							id: 3,
							displayName: 'Beta User',
							email: 'beta@example.com',
							role: 'editor',
							subscribed: false,
							invited: false,
						},
					] ),
					status: 200,
				} );

				registry.select( CORE_SITE ).getEligibleSubscribers( {
					search: 'alpha',
				} );
				await untilResolved(
					registry,
					CORE_SITE
				).getEligibleSubscribers( { search: 'alpha' } );

				registry.select( CORE_SITE ).getEligibleSubscribers( {
					search: 'beta',
				} );
				await untilResolved(
					registry,
					CORE_SITE
				).getEligibleSubscribers( { search: 'beta' } );

				expect(
					registry.select( CORE_SITE ).getEligibleSubscribers( {
						search: 'alpha',
					} ).users
				).toHaveLength( 1 );
				expect(
					registry.select( CORE_SITE ).getEligibleSubscribers( {
						search: 'alpha',
					} ).users[ 0 ].name
				).toBe( 'Alpha User' );
				expect(
					registry.select( CORE_SITE ).getEligibleSubscribers( {
						search: 'beta',
					} ).users[ 0 ].name
				).toBe( 'Beta User' );
			} );

			it( 'fetches all pages when totalPages is greater than 1', async () => {
				provideUserInfo( registry, { id: 1 } );

				fetchMock.getOnce( eligibleSubscribersEndpointRegExp, {
					body: createEligibleSubscribersResponse(
						[
							{
								id: 2,
								displayName: 'Page 1 User',
								email: 'page1@example.com',
								role: 'editor',
								subscribed: false,
								invited: false,
							},
						],
						{ page: 1, total: 2, totalPages: 2 }
					),
					status: 200,
				} );

				fetchMock.getOnce( eligibleSubscribersEndpointRegExp, {
					body: createEligibleSubscribersResponse(
						[
							{
								id: 3,
								displayName: 'Page 2 User',
								email: 'page2@example.com',
								role: 'editor',
								subscribed: false,
								invited: false,
							},
						],
						{ page: 2, total: 2, totalPages: 2 }
					),
					status: 200,
				} );

				registry.select( CORE_SITE ).getEligibleSubscribers( {
					search: '',
				} );
				await untilResolved(
					registry,
					CORE_SITE
				).getEligibleSubscribers( { search: '' } );

				expect(
					registry.select( CORE_SITE ).getEligibleSubscribers( {
						search: '',
					} ).users
				).toHaveLength( 2 );
				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );

			it( 'does not auto-fetch additional pages when requesting a page greater than 1', async () => {
				provideUserInfo( registry, { id: 1 } );

				fetchMock.getOnce( eligibleSubscribersEndpointRegExp, {
					body: createEligibleSubscribersResponse(
						[
							{
								id: 3,
								displayName: 'Page 2 User',
								email: 'page2@example.com',
								role: 'editor',
								subscribed: false,
								invited: false,
							},
						],
						{ page: 2, total: 2, totalPages: 2 }
					),
					status: 200,
				} );

				registry.select( CORE_SITE ).getEligibleSubscribers( {
					page: 2,
					search: '',
				} );
				await untilResolved(
					registry,
					CORE_SITE
				).getEligibleSubscribers( { page: 2, search: '' } );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched(
					eligibleSubscribersEndpointRegExp,
					{
						queryParams: {
							page: 2,
							search: '',
						},
					}
				);
				expect(
					registry.select( CORE_SITE ).getEligibleSubscribers( {
						page: 2,
						search: '',
					} ).users
				).toHaveLength( 1 );
			} );

			it( 'returns undefined if the request fails', async () => {
				provideUserInfo( registry, { id: 1 } );

				fetchMock.get( /.*/, {
					body: { error: 'something went wrong' },
					status: 500,
				} );

				expect(
					registry.select( CORE_SITE ).getEligibleSubscribers( {
						search: '',
					} )
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getEligibleSubscribers( { search: '' } );

				expect(
					registry.select( CORE_SITE ).getEligibleSubscribers( {
						search: '',
					} )
				).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetched(
					eligibleSubscribersEndpointRegExp
				);

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getSubscribedUsers', () => {
			it( 'returns the cached subscribed-users listing for matching args', () => {
				registry.dispatch( CORE_SITE ).receiveGetSubscribedUsers(
					createEligibleSubscribersResponse( [
						{
							id: 2,
							displayName: 'Subscribed User',
							email: 'subscribed@example.com',
							role: 'editor',
						},
					] ),
					{ page: 1, search: '' }
				);

				expect(
					registry.select( CORE_SITE ).getSubscribedUsers( {
						search: '',
					} )
				).toEqual( {
					users: [
						{
							id: 2,
							name: 'Subscribed User',
							email: 'subscribed@example.com',
							role: 'editor',
						},
					],
					total: 1,
				} );
			} );

			it( 'keeps the current user in the subscribed-users listing', () => {
				provideUserInfo( registry, { id: 1 } );

				registry.dispatch( CORE_SITE ).receiveGetSubscribedUsers(
					createEligibleSubscribersResponse( [
						{
							id: 1,
							displayName: 'Current User',
							email: 'current@example.com',
							role: 'administrator',
						},
						{
							id: 2,
							displayName: 'Subscribed User',
							email: 'subscribed@example.com',
							role: 'editor',
						},
					] ),
					{ page: 1, search: '' }
				);

				expect(
					registry
						.select( CORE_SITE )
						.getSubscribedUsers( { search: '' } )
						.users.map( ( { id } ) => id )
				).toEqual( [ 1, 2 ] );
			} );

			it( 'returns roleDisplayName as the role when the response provides it', () => {
				registry.dispatch( CORE_SITE ).receiveGetSubscribedUsers(
					createEligibleSubscribersResponse( [
						{
							id: 2,
							displayName: 'Subscribed User',
							email: 'subscribed@example.com',
							role: 'editor',
							roleDisplayName: 'Editor',
						},
					] ),
					{ page: 1, search: '' }
				);

				expect(
					registry.select( CORE_SITE ).getSubscribedUsers( {
						search: '',
					} ).users[ 0 ].role
				).toBe( 'Editor' );
			} );

			it( 'returns the role slug when the response holds no roleDisplayName', () => {
				registry.dispatch( CORE_SITE ).receiveGetSubscribedUsers(
					createEligibleSubscribersResponse( [
						{
							id: 2,
							displayName: 'Subscribed User',
							email: 'subscribed@example.com',
							role: 'editor',
						},
					] ),
					{ page: 1, search: '' }
				);

				expect(
					registry.select( CORE_SITE ).getSubscribedUsers( {
						search: '',
					} ).users[ 0 ].role
				).toBe( 'editor' );
			} );

			it( 'fetches page 1 with the search term on a cache miss', async () => {
				fetchMock.getOnce( subscribedUsersEndpointRegExp, {
					body: createEligibleSubscribersResponse( [
						{
							id: 2,
							displayName: 'Search User',
							email: 'search@example.com',
							role: 'editor',
						},
					] ),
					status: 200,
				} );

				expect(
					registry.select( CORE_SITE ).getSubscribedUsers( {
						search: 'search',
					} )
				).toBeUndefined();

				await untilResolved( registry, CORE_SITE ).getSubscribedUsers( {
					search: 'search',
				} );

				expect( fetchMock ).toHaveFetched(
					subscribedUsersEndpointRegExp,
					{
						queryParams: {
							page: 1,
							search: 'search',
						},
					}
				);
			} );

			it( "keeps each search term's results separate", async () => {
				fetchMock.getOnce( subscribedUsersEndpointRegExp, {
					body: createEligibleSubscribersResponse( [
						{
							id: 2,
							displayName: 'Alpha User',
							email: 'alpha@example.com',
							role: 'editor',
						},
					] ),
					status: 200,
				} );

				fetchMock.getOnce( subscribedUsersEndpointRegExp, {
					body: createEligibleSubscribersResponse( [
						{
							id: 3,
							displayName: 'Beta User',
							email: 'beta@example.com',
							role: 'editor',
						},
					] ),
					status: 200,
				} );

				registry.select( CORE_SITE ).getSubscribedUsers( {
					search: 'alpha',
				} );
				await untilResolved( registry, CORE_SITE ).getSubscribedUsers( {
					search: 'alpha',
				} );

				registry.select( CORE_SITE ).getSubscribedUsers( {
					search: 'beta',
				} );
				await untilResolved( registry, CORE_SITE ).getSubscribedUsers( {
					search: 'beta',
				} );

				expect( fetchMock ).toHaveFetched(
					subscribedUsersEndpointRegExp,
					{
						queryParams: {
							page: 1,
							search: 'alpha',
						},
					}
				);
				expect( fetchMock ).toHaveFetched(
					subscribedUsersEndpointRegExp,
					{
						queryParams: {
							page: 1,
							search: 'beta',
						},
					}
				);

				expect(
					registry
						.select( CORE_SITE )
						.getSubscribedUsers( { search: 'alpha' } )
						.users.map( ( { name } ) => name )
				).toEqual( [ 'Alpha User' ] );
				expect(
					registry
						.select( CORE_SITE )
						.getSubscribedUsers( { search: 'beta' } )
						.users.map( ( { name } ) => name )
				).toEqual( [ 'Beta User' ] );
			} );

			it( 'fetches every page and merges the users when totalPages is greater than 1', async () => {
				fetchMock.getOnce( subscribedUsersEndpointRegExp, {
					body: createEligibleSubscribersResponse(
						[
							{
								id: 2,
								displayName: 'Page 1 User',
								email: 'page1@example.com',
								role: 'editor',
							},
						],
						{ page: 1, total: 2, totalPages: 2 }
					),
					status: 200,
				} );

				fetchMock.getOnce( subscribedUsersEndpointRegExp, {
					body: createEligibleSubscribersResponse(
						[
							{
								id: 3,
								displayName: 'Page 2 User',
								email: 'page2@example.com',
								role: 'editor',
							},
						],
						{ page: 2, total: 2, totalPages: 2 }
					),
					status: 200,
				} );

				registry.select( CORE_SITE ).getSubscribedUsers( {
					search: '',
				} );
				await untilResolved( registry, CORE_SITE ).getSubscribedUsers( {
					search: '',
				} );

				expect(
					registry
						.select( CORE_SITE )
						.getSubscribedUsers( { search: '' } )
						.users.map( ( { name } ) => name )
				).toEqual( [ 'Page 1 User', 'Page 2 User' ] );
				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );

			it( 'returns undefined when the request fails', async () => {
				fetchMock.get( /.*/, {
					body: { error: 'something went wrong' },
					status: 500,
				} );

				expect(
					registry.select( CORE_SITE ).getSubscribedUsers( {
						search: '',
					} )
				).toBeUndefined();

				await untilResolved( registry, CORE_SITE ).getSubscribedUsers( {
					search: '',
				} );

				expect(
					registry.select( CORE_SITE ).getSubscribedUsers( {
						search: '',
					} )
				).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetched(
					subscribedUsersEndpointRegExp
				);

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getEmailReportingErrors', () => {
			it( 'uses a resolver to make a network request', async () => {
				const emailReportingErrors = {
					errors: {
						email_report_section_build_failed: [
							'title must be a non-empty string',
						],
					},
					error_data: [],
				};

				fetchMock.getOnce( emailReportingErrorsEndpointRegExp, {
					body: emailReportingErrors,
					status: 200,
				} );

				const initialErrors = registry
					.select( CORE_SITE )
					.getEmailReportingErrors();

				expect( initialErrors ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getEmailReportingErrors();

				const errors = registry
					.select( CORE_SITE )
					.getEmailReportingErrors();

				expect( errors ).toEqual( emailReportingErrors );

				expect( fetchMock ).toHaveFetched(
					emailReportingErrorsEndpointRegExp
				);
			} );
		} );

		describe( 'isInvitingUser', () => {
			it( 'returns true while invitation is in progress and false after completion', async () => {
				const loadingUserID = 47;
				const completedUserID = 48;

				freezeFetch( inviteUserEndpointRegExp );

				expect(
					registry.select( CORE_SITE ).isInvitingUser( loadingUserID )
				).toBe( false );

				registry.dispatch( CORE_SITE ).inviteUser( loadingUserID );

				expect(
					registry.select( CORE_SITE ).isInvitingUser( loadingUserID )
				).toBe( true );

				fetchMock.postOnce( inviteUserEndpointRegExp, {
					body: { success: true },
					status: 200,
				} );

				await registry
					.dispatch( CORE_SITE )
					.inviteUser( completedUserID );

				expect(
					registry
						.select( CORE_SITE )
						.isInvitingUser( completedUserID )
				).toBe( false );
			} );

			it( 'tracks concurrent invitations for different users independently', async () => {
				fetchMock.post( inviteUserEndpointRegExp, ( _url, options ) => {
					const requestBody =
						typeof options.body === 'string'
							? JSON.parse( options.body )
							: options.body;
					const userID = requestBody?.data?.[ USER_ID_PARAM ];

					if ( userID === 2 ) {
						return new Promise( () => {} );
					}

					return {
						body: { success: true },
						status: 200,
					};
				} );

				registry.dispatch( CORE_SITE ).inviteUser( 2 );

				expect( registry.select( CORE_SITE ).isInvitingUser( 2 ) ).toBe(
					true
				);
				expect( registry.select( CORE_SITE ).isInvitingUser( 3 ) ).toBe(
					false
				);

				const { response, error } = await registry
					.dispatch( CORE_SITE )
					.inviteUser( 3 );

				expect( response ).toEqual( { success: true } );
				expect( error ).toBeUndefined();
				expect( registry.select( CORE_SITE ).isInvitingUser( 2 ) ).toBe(
					true
				);
				expect( registry.select( CORE_SITE ).isInvitingUser( 3 ) ).toBe(
					false
				);
			} );
		} );

		describe( 'isUnsubscribingUser', () => {
			it( 'reads true while the unsubscribe request runs and false after it settles', async () => {
				const unsubscribingUserID = 47;
				const unsubscribedUserID = 48;

				freezeFetch( unsubscribeUserEndpointRegExp );

				expect(
					registry
						.select( CORE_SITE )
						.isUnsubscribingUser( unsubscribingUserID )
				).toBe( false );

				registry
					.dispatch( CORE_SITE )
					.unsubscribeUser( unsubscribingUserID );

				expect(
					registry
						.select( CORE_SITE )
						.isUnsubscribingUser( unsubscribingUserID )
				).toBe( true );

				fetchMock.postOnce( unsubscribeUserEndpointRegExp, {
					body: { success: true },
					status: 200,
				} );

				await registry
					.dispatch( CORE_SITE )
					.unsubscribeUser( unsubscribedUserID );

				expect(
					registry
						.select( CORE_SITE )
						.isUnsubscribingUser( unsubscribedUserID )
				).toBe( false );
			} );

			it( "tracks each user's unsubscribe request on its own", async () => {
				fetchMock.post(
					unsubscribeUserEndpointRegExp,
					( _url, options ) => {
						const requestBody =
							typeof options.body === 'string'
								? JSON.parse( options.body )
								: options.body;
						const userID = requestBody?.data?.[ USER_ID_PARAM ];

						if ( userID === 2 ) {
							return new Promise( () => {} );
						}

						return {
							body: { success: true },
							status: 200,
						};
					}
				);

				registry.dispatch( CORE_SITE ).unsubscribeUser( 2 );

				expect(
					registry.select( CORE_SITE ).isUnsubscribingUser( 2 )
				).toBe( true );
				expect(
					registry.select( CORE_SITE ).isUnsubscribingUser( 3 )
				).toBe( false );

				const { response, error } = await registry
					.dispatch( CORE_SITE )
					.unsubscribeUser( 3 );

				expect( response ).toEqual( { success: true } );
				expect( error ).toBeUndefined();
				expect(
					registry.select( CORE_SITE ).isUnsubscribingUser( 2 )
				).toBe( true );
				expect(
					registry.select( CORE_SITE ).isUnsubscribingUser( 3 )
				).toBe( false );
			} );
		} );
	} );
} );
