/**
 * WPForms Enhanced Conversions Playwright tests.
 *
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
 * Internal dependencies
 */
import { test } from '../../playwright';
import {
	asUser,
	withConnectedModules,
	withFeatureFlags,
	withPlugins,
} from '../../wordpress';
import { FormsPage } from './forms-page';
import { setConversionTrackingEnabled } from './utils';

const plugins = withPlugins( 'proxy-auth.php', 'enhanced-conversions.php' );
const anonymousUser = asUser( 'does-not-exist' );
const withUserDataFlag = withFeatureFlags( 'gtagUserData' );
const adsConnected = withConnectedModules( {
	slug: 'ads',
	settings: {
		accountOverviewURL: '',
		conversionID: 'AW-123456789',
		customerID: '',
		extCustomerID: '',
		formattedExtCustomerID: '',
		paxConversionID: '',
		userID: '',
	},
} );

test.describe(
	'WPForms Enhanced Conversions',
	{ annotation: [ plugins, anonymousUser ] },
	() => {
		test.describe.configure( { mode: 'serial' } );

		test.beforeEach( async ( { wp } ) => {
			await wp.activatePlugin( 'wpforms-lite/wpforms.php' );
			await wp.visitFrontend();
			await setConversionTrackingEnabled( wp, true );
		} );

		test(
			'should send normalized user data for the email-only form',
			{ annotation: [ withUserDataFlag, adsConnected ] },
			async ( { wp } ) => {
				await wp.visitFrontend( '/e2e-wpforms-email/' );

				const formsPage = new FormsPage( wp.page );
				await formsPage.verifyEmailFormEvent();
			}
		);

		test(
			'should send normalized user data for the name-only form',
			{ annotation: [ withUserDataFlag, adsConnected ] },
			async ( { wp } ) => {
				await wp.visitFrontend( '/e2e-wpforms-name/' );

				const formsPage = new FormsPage( wp.page );
				await formsPage.verifyNameFormEvent();
			}
		);

		test(
			'should send normalized user data for the phone-only form',
			{ annotation: [ withUserDataFlag, adsConnected ] },
			async ( { wp } ) => {
				await wp.visitFrontend( '/e2e-wpforms-phone/' );

				const formsPage = new FormsPage( wp.page );
				await formsPage.verifyPhoneFormEvent();
			}
		);

		test(
			'should send normalized user data for the all-fields form',
			{ annotation: [ withUserDataFlag, adsConnected ] },
			async ( { wp } ) => {
				await wp.visitFrontend( '/e2e-wpforms-all-fields/' );

				const formsPage = new FormsPage( wp.page );
				await formsPage.verifyAllFieldsFormEvent();
			}
		);

		test(
			'should send the form event without user data when the feature flag is disabled',
			{ annotation: adsConnected },
			async ( { wp } ) => {
				await wp.visitFrontend( '/e2e-wpforms-all-fields/' );

				const formsPage = new FormsPage( wp.page );
				await formsPage.verifyFormEventWithoutUserData();
			}
		);

		test(
			'should not send a form event when conversion tracking is disabled',
			{ annotation: [ withUserDataFlag, adsConnected ] },
			async ( { wp } ) => {
				await setConversionTrackingEnabled( wp, false );
				await wp.visitFrontend( '/e2e-wpforms-all-fields/' );

				const formsPage = new FormsPage( wp.page );
				await formsPage.verifyNoFormEvent();
			}
		);

		test(
			'should not send a form event when no GTag-using module is connected',
			{ annotation: withUserDataFlag },
			async ( { wp } ) => {
				await wp.visitFrontend( '/e2e-wpforms-all-fields/' );

				const formsPage = new FormsPage( wp.page );
				await formsPage.verifyNoFormEvent();
			}
		);
	}
);
