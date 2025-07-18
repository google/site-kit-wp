/**
 * CoreSiteBannerNotifications component tests.
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
 * Internal dependencies
 */
import { dismissedPromptsEndpoint } from '../../../../tests/js/mock-dismiss-prompt-endpoints';
import {
	render,
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	act,
	waitFor,
} from '../../../../tests/js/test-utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { NOTIFICATION_GROUPS } from '../../googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import CoreSiteBannerNotifications from './CoreSiteBannerNotifications';

describe( 'CoreSiteBannerNotifications', () => {
	let registry;
	let originalSetTimeout;

	beforeEach( () => {
		jest.useFakeTimers();
		// Store the original setTimeout function.
		originalSetTimeout = global.setTimeout;
		// Mock the setTimeout function.
		jest.spyOn( global, 'setTimeout' ).mockImplementation(
			( callback, delay ) => {
				originalSetTimeout( callback, delay );
			}
		);

		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideModules( registry );

		const notification1 = {
			id: 'test-notification',
			title: 'Google Analytics 5 Beta',
			content: 'Upgrade to the latest and greatest version of Analytics!',
			ctaURL: '#ga5-upgrade',
			ctaLabel: 'Upgrade to GA5!',
			ctaTarget: '_blank',
			learnMoreURL: '#learn-more',
			learnMoreLabel: 'Learn more',
			dismissible: true,
			dismissLabel: 'Dismiss this message',
		};

		registry
			.dispatch( CORE_SITE )
			.receiveGetNotifications( [ notification1 ], {} );
	} );

	afterEach( () => {
		global.setTimeout = originalSetTimeout;
	} );

	it( 'does register server notification after surveys have loaded', async () => {
		const fetchGetDismissedItems = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismissed-items'
		);
		fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
		fetchMock.getOnce( dismissedPromptsEndpoint, { body: [] } );

		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
		registry.dispatch( CORE_USER ).receiveGetSurvey( { survey: null } );

		const container = render( <CoreSiteBannerNotifications />, {
			registry,
		} );

		act( () => {
			jest.runAllTimers();
		} );

		// This component does not render anything directly,
		expect( container.childElementCount ).toBe( undefined );

		const { getQueuedNotifications } =
			registry.select( CORE_NOTIFICATIONS );

		await waitFor( () => {
			expect(
				getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					NOTIFICATION_GROUPS.DEFAULT
				).length
			).toBe( 1 );
		} );
	} );

	it( 'does not render notification with survey', () => {
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
		registry.dispatch( CORE_USER ).receiveGetSurvey( {
			survey: { survey_payload: { ab2: true }, session: {} },
		} );

		const { container } = render( <CoreSiteBannerNotifications />, {
			registry,
		} );

		act( () => {
			jest.runAllTimers();
		} );

		expect( container.childElementCount ).toBe( 0 );
	} );
} );
