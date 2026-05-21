/**
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
 * External dependencies
 */
import type { Page } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from '../../playwright';
import {
	asUser,
	withFeatureFlags,
	withPlugins,
	type WordPress,
} from '../../wordpress';

type ExtractedUserData = {
	sha256EmailAddress?: string;
	sha256FirstName?: string;
	sha256LastName?: string;
};

const admin = asUser( 'admin' );
const anonymous = asUser( 'does-not-exist' );
const plugins = withPlugins( 'proxy-auth.php', 'enhanced-conversions.php' );
const withUserDataFlag = withFeatureFlags( 'gtagUserData' );

const adminBaseAnnotation = [ admin, plugins ];
const adminFlagAnnotation = [ admin, plugins, withUserDataFlag ];
const anonymousFlagAnnotation = [ anonymous, plugins, withUserDataFlag ];

const hashPattern = /^[a-f0-9]{64}$/;

function getUserDataFromDataLayer(
	page: Page
): Promise< ExtractedUserData | null > {
	return page.evaluate( () => {
		const dataLayer =
			( window as Window & { dataLayer?: unknown[] } ).dataLayer || [];

		for ( const entry of dataLayer ) {
			const record = entry as Record< number, unknown >;
			const command = record[ 0 ];
			const key = record[ 1 ];
			const payload = record[ 2 ] as
				| {
						[ key: string ]: unknown;
				  }
				| undefined;

			if (
				command === 'set' &&
				key === 'user_data' &&
				payload &&
				typeof payload === 'object'
			) {
				const address = payload.address as
					| { [ key: string ]: unknown }
					| undefined;

				return {
					sha256EmailAddress: payload.sha256_email_address as
						| string
						| undefined,
					sha256FirstName: address?.sha256_first_name as
						| string
						| undefined,
					sha256LastName: address?.sha256_last_name as
						| string
						| undefined,
				};
			}
		}

		return null;
	} );
}

async function setModuleConnected(
	wp: WordPress,
	module: string,
	connected: boolean
): Promise< void > {
	const response = ( await wp.restRequest(
		'POST',
		'google-site-kit/v1/e2e/enhanced-conversions/connect-module',
		{
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( {
				module,
				connected,
			} ),
		}
	) ) as {
		success?: boolean;
		code?: string;
		message?: string;
	};

	if ( ! response?.success ) {
		throw new Error(
			`Failed to set module connection for ${ module }: ${
				response?.code || response?.message || 'unknown_error'
			}`
		);
	}
}

async function setUserProfile(
	wp: WordPress,
	profile: {
		email?: string;
		firstName?: string;
		lastName?: string;
	}
): Promise< void > {
	const response = ( await wp.restRequest(
		'POST',
		'google-site-kit/v1/e2e/enhanced-conversions/set-user-profile',
		{
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( {
				email: profile.email,
				first_name: profile.firstName,
				last_name: profile.lastName,
			} ),
		}
	) ) as {
		success?: boolean;
		code?: string;
		message?: string;
	};

	if ( ! response?.success ) {
		throw new Error(
			`Failed to set user profile: ${
				response?.code || response?.message || 'unknown_error'
			}`
		);
	}
}

async function resetState( wp: WordPress ): Promise< void > {
	const response = ( await wp.restRequest(
		'POST',
		'google-site-kit/v1/e2e/enhanced-conversions/reset'
	) ) as {
		success?: boolean;
		code?: string;
		message?: string;
	};

	if ( ! response?.success ) {
		throw new Error(
			`Failed to reset enhanced conversions state: ${
				response?.code || response?.message || 'unknown_error'
			}`
		);
	}
}

test.describe(
	'Enhanced Conversions',
	{ annotation: adminBaseAnnotation },
	() => {
		test.beforeEach( async ( { wp } ) => {
			// Ensure subsequent REST setup requests are same-origin and include test routing cookies.
			await wp.visitFrontend( '/' );
			await resetState( wp );
		} );

		test.describe( 'positive cases', () => {
			const gtagModules = [ 'ads', 'analytics-4', 'tagmanager' ];

			for ( const module of gtagModules ) {
				test(
					`should emit hashed user_data when ${ module } is connected`,
					{ annotation: adminFlagAnnotation },
					async ( { wp } ) => {
						await setModuleConnected( wp, module, true );
						await setUserProfile( wp, {
							email: 'test.user@example.com',
							firstName: 'John',
							lastName: 'Doe',
						} );

						await wp.visitFrontend( '/' );

						const userData = await getUserDataFromDataLayer(
							wp.page
						);

						expect( userData ).toBeTruthy();
						expect( userData?.sha256EmailAddress ).toMatch(
							hashPattern
						);
						expect( userData?.sha256FirstName ).toMatch(
							hashPattern
						);
						expect( userData?.sha256LastName ).toMatch(
							hashPattern
						);
					}
				);
			}
		} );

		test.describe( 'negative cases', () => {
			test( 'should not emit user_data when feature flag is disabled', async ( {
				wp,
			} ) => {
				await setModuleConnected( wp, 'ads', true );
				await setUserProfile( wp, {
					email: 'test.user@example.com',
					firstName: 'John',
					lastName: 'Doe',
				} );

				await wp.visitFrontend( '/' );

				const userData = await getUserDataFromDataLayer( wp.page );
				expect( userData ).toBeNull();
			} );

			test(
				'should not emit user_data when no GTag module is connected',
				{ annotation: adminFlagAnnotation },
				async ( { wp } ) => {
					await setUserProfile( wp, {
						email: 'test.user@example.com',
						firstName: 'John',
						lastName: 'Doe',
					} );

					await wp.visitFrontend( '/' );

					const userData = await getUserDataFromDataLayer( wp.page );
					expect( userData ).toBeNull();
				}
			);
		} );

		test.describe( 'partial data', () => {
			test(
				'should emit only email field when only email is available',
				{ annotation: adminFlagAnnotation },
				async ( { wp } ) => {
					await setModuleConnected( wp, 'ads', true );
					await setUserProfile( wp, {
						email: 'email.only@example.com',
						firstName: '',
						lastName: '',
					} );

					await wp.visitFrontend( '/' );

					const userData = await getUserDataFromDataLayer( wp.page );

					expect( userData ).toBeTruthy();
					expect( userData?.sha256EmailAddress ).toMatch(
						hashPattern
					);
					expect( userData?.sha256FirstName ).toBeUndefined();
					expect( userData?.sha256LastName ).toBeUndefined();
				}
			);

			test(
				'should emit only name fields when email is overridden as empty',
				{ annotation: adminFlagAnnotation },
				async ( { wp } ) => {
					await setModuleConnected( wp, 'ads', true );
					await setUserProfile( wp, {
						email: '',
						firstName: 'Jane',
						lastName: 'Smith',
					} );

					await wp.visitFrontend( '/' );

					const userData = await getUserDataFromDataLayer( wp.page );

					expect( userData ).toBeTruthy();
					expect( userData?.sha256EmailAddress ).toBeUndefined();
					expect( userData?.sha256FirstName ).toMatch( hashPattern );
					expect( userData?.sha256LastName ).toMatch( hashPattern );
				}
			);
		} );
	}
);

test.describe(
	'Enhanced Conversions anonymous user',
	{
		annotation: anonymousFlagAnnotation,
	},
	() => {
		test.beforeEach( async ( { wp } ) => {
			// Ensure subsequent REST setup requests are same-origin and include test routing cookies.
			await wp.visitFrontend( '/' );
			await resetState( wp );
			await setModuleConnected( wp, 'ads', true );
		} );

		test( 'should not emit user_data for non-logged-in user', async ( {
			wp,
		} ) => {
			await wp.visitFrontend( '/' );

			const userData = await getUserDataFromDataLayer( wp.page );
			expect( userData ).toBeNull();
		} );
	}
);
