/**
 * ExpressSetupResumeNewsletterNotification component tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_EXPRESS_SETUP_RESUME_NEWSLETTER_NOTIFICATION_ID,
} from '@/js/modules/reader-revenue-manager/constants';
import { EXPRESS_SETUP_CTAS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	provideUserAuthentication,
	render,
} from '@tests/js/test-utils';
import ExpressSetupResumeNewsletterNotification from '.';

describe( 'ExpressSetupResumeNewsletterNotification', () => {
	let registry: WPDataRegistry;

	const ExpressSetupResumeNewsletterNotificationComponent =
		withNotificationComponentProps(
			RRM_EXPRESS_SETUP_RESUME_NEWSLETTER_NOTIFICATION_ID
		)( ExpressSetupResumeNewsletterNotification );

	mockLocation();

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserAuthentication( registry );
	} );

	it( 'should resume express setup using the newsletter setup slug', () => {
		const { getByRole } = render(
			<ExpressSetupResumeNewsletterNotificationComponent />,
			{
				registry,
			}
		);

		fireEvent.click( getByRole( 'button', { name: 'Show me' } ) );

		expect( global.location.assign ).toHaveBeenCalledTimes( 1 );

		const setupURL = new URL(
			( global.location.assign as jest.Mock ).mock.calls[ 0 ][ 0 ]
		);
		expect( setupURL.href ).toMatchQueryParameters( {
			page: 'googlesitekit-dashboard',
			slug: MODULE_SLUG_READER_REVENUE_MANAGER,
			reAuth: 'true',
			expressSetup: 'true',
			cta: EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
		} );
	} );
} );
