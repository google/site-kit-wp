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
import { expect, test } from '../../playwright';
import {
	asUser,
	withConnectedModules,
	withFeatureFlags,
	withPlugins,
} from '../../wordpress';

type ExtractedUserData = {
	sha256EmailAddress?: string;
	sha256FirstName?: string;
	sha256LastName?: string;
};

const plugins = withPlugins( 'proxy-auth.php', 'enhanced-conversions.php' );
const withUserDataFlag = withFeatureFlags( 'gtagUserData' );
const adsConnected = withConnectedModules( 'ads' );
const analytics4Connected = withConnectedModules( 'analytics-4' );
const tagManagerConnected = withConnectedModules( 'tagmanager' );

const fullUser = asUser( 'admin', {
	email: 'test.user@example.com',
	firstName: 'John',
	lastName: 'Doe',
} );
const emailOnlyUser = asUser( 'admin', {
	email: 'email.only@example.com',
	firstName: '',
	lastName: '',
} );
const nameOnlyUser = asUser( 'admin', {
	email: '',
	firstName: 'Jane',
	lastName: 'Smith',
} );
const anonymousUser = asUser( 'does-not-exist' );

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

async function getFrontendUserData(
	page: Page
): Promise< ExtractedUserData | null > {
	return await getUserDataFromDataLayer( page );
}

function expectHashedUserData( userData: ExtractedUserData | null ): void {
	expect( userData ).toBeTruthy();
	expect( userData?.sha256EmailAddress ).toMatch( hashPattern );
	expect( userData?.sha256FirstName ).toMatch( hashPattern );
	expect( userData?.sha256LastName ).toMatch( hashPattern );
}

test.describe( 'Enhanced Conversions', { annotation: [ plugins ] }, () => {
	test(
		'should emit hashed user_data when Ads is connected and the feature flag is enabled',
		{ annotation: [ fullUser, withUserDataFlag, adsConnected ] },
		async ( { wp } ) => {
			await wp.visitFrontend( '/' );
			const userData = await getFrontendUserData( wp.page );
			expectHashedUserData( userData );
		}
	);

	test(
		'should emit hashed user_data when Analytics 4 is connected and the feature flag is enabled',
		{ annotation: [ fullUser, withUserDataFlag, analytics4Connected ] },
		async ( { wp } ) => {
			await wp.visitFrontend( '/' );
			const userData = await getFrontendUserData( wp.page );
			expectHashedUserData( userData );
		}
	);

	test(
		'should emit hashed user_data when Tag Manager is connected and the feature flag is enabled',
		{ annotation: [ fullUser, withUserDataFlag, tagManagerConnected ] },
		async ( { wp } ) => {
			await wp.visitFrontend( '/' );
			const userData = await getFrontendUserData( wp.page );
			expectHashedUserData( userData );
		}
	);

	test(
		'should not emit user_data when Ads is connected and the feature flag is disabled',
		{ annotation: [ fullUser, adsConnected ] },
		async ( { wp } ) => {
			await wp.visitFrontend( '/' );
			const userData = await getFrontendUserData( wp.page );
			expect( userData ).toBeNull();
		}
	);

	test(
		'should not emit user_data when Analytics 4 is connected and the feature flag is disabled',
		{ annotation: [ fullUser, analytics4Connected ] },
		async ( { wp } ) => {
			await wp.visitFrontend( '/' );
			const userData = await getFrontendUserData( wp.page );
			expect( userData ).toBeNull();
		}
	);

	test(
		'should not emit user_data when Tag Manager is connected and the feature flag is disabled',
		{ annotation: [ fullUser, tagManagerConnected ] },
		async ( { wp } ) => {
			await wp.visitFrontend( '/' );
			const userData = await getFrontendUserData( wp.page );
			expect( userData ).toBeNull();
		}
	);

	test(
		'should not emit user_data when the feature flag is enabled and no GTag module is connected',
		{ annotation: [ fullUser, withUserDataFlag ] },
		async ( { wp } ) => {
			await wp.visitFrontend( '/' );
			const userData = await getFrontendUserData( wp.page );
			expect( userData ).toBeNull();
		}
	);

	test(
		'should not emit user_data for an anonymous user when Ads is connected and the feature flag is enabled',
		{ annotation: [ anonymousUser, withUserDataFlag, adsConnected ] },
		async ( { wp } ) => {
			await wp.visitFrontend( '/' );
			const userData = await getFrontendUserData( wp.page );
			expect( userData ).toBeNull();
		}
	);

	test(
		'should not emit user_data for an anonymous user when Analytics 4 is connected and the feature flag is enabled',
		{
			annotation: [
				anonymousUser,
				withUserDataFlag,
				analytics4Connected,
			],
		},
		async ( { wp } ) => {
			await wp.visitFrontend( '/' );
			const userData = await getFrontendUserData( wp.page );
			expect( userData ).toBeNull();
		}
	);

	test(
		'should not emit user_data for an anonymous user when Tag Manager is connected and the feature flag is enabled',
		{
			annotation: [
				anonymousUser,
				withUserDataFlag,
				tagManagerConnected,
			],
		},
		async ( { wp } ) => {
			await wp.visitFrontend( '/' );
			const userData = await getFrontendUserData( wp.page );
			expect( userData ).toBeNull();
		}
	);

	test(
		'should emit only the email hash when only email data is available',
		{ annotation: [ emailOnlyUser, withUserDataFlag, adsConnected ] },
		async ( { wp } ) => {
			await wp.visitFrontend( '/' );
			const userData = await getFrontendUserData( wp.page );

			expect( userData ).toBeTruthy();
			expect( userData?.sha256EmailAddress ).toMatch( hashPattern );
			expect( userData?.sha256FirstName ).toBeUndefined();
			expect( userData?.sha256LastName ).toBeUndefined();
		}
	);

	test(
		'should emit only the name hashes when email data is empty',
		{ annotation: [ nameOnlyUser, withUserDataFlag, adsConnected ] },
		async ( { wp } ) => {
			await wp.visitFrontend( '/' );
			const userData = await getFrontendUserData( wp.page );

			expect( userData ).toBeTruthy();
			expect( userData?.sha256EmailAddress ).toBeUndefined();
			expect( userData?.sha256FirstName ).toMatch( hashPattern );
			expect( userData?.sha256LastName ).toMatch( hashPattern );
		}
	);
} );
