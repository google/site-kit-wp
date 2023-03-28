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
import {
	render,
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	act,
} from '../../../../tests/js/test-utils';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import CoreSiteBannerNotifications from './CoreSiteBannerNotifications';

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

describe( 'CoreSiteBannerNotifications', () => {
	let registry;

	beforeEach( () => {
		jest.useFakeTimers();
		jest.spyOn( global, 'setTimeout' );

		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideModules( registry );

		registry
			.dispatch( CORE_SITE )
			.receiveGetNotifications( [ notification1 ], {} );
	} );

	it( 'does render notification after timeout', () => {
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
		registry.dispatch( CORE_USER ).receiveGetSurvey( { survey: null } );

		const { container } = render( <CoreSiteBannerNotifications />, {
			registry,
		} );

		expect( container.childElementCount ).toBe( 0 );

		act( () => {
			jest.runAllTimers();
		} );

		expect( container.childElementCount ).toBe( 1 );
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
