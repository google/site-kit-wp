/**
 * Notifications utility tests.
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
import { Registry } from 'googlesitekit-data';
import {
	EXPRESS_SETUP_CTAS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { createTestRegistry } from '@tests/js/test-utils';
import { checkRequirementsForExpressSetupResumeNotification } from './notifications';

describe( 'checkRequirementsForExpressSetupResumeNotification', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	function provideRRMSettings( {
		configuredCTAs,
		lastActionedExpressSetups,
	}: {
		configuredCTAs: Record< string, string >;
		lastActionedExpressSetups: Record< string, number >;
	} ) {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( { configuredCTAs } );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetUserSettings( { lastActionedExpressSetups } );
	}

	it( 'should return true when the CTA was actioned but is not configured', async () => {
		provideRRMSettings( {
			configuredCTAs: {},
			lastActionedExpressSetups: {
				[ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP ]: 1752451200,
			},
		} );

		await expect(
			checkRequirementsForExpressSetupResumeNotification(
				registry,
				EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP
			)
		).resolves.toBe( true );
	} );

	it( 'should return false when the CTA was not actioned', async () => {
		provideRRMSettings( {
			configuredCTAs: {},
			lastActionedExpressSetups: {},
		} );

		await expect(
			checkRequirementsForExpressSetupResumeNotification(
				registry,
				EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP
			)
		).resolves.toBe( false );
	} );

	it( 'should return false when the CTA is already configured', async () => {
		provideRRMSettings( {
			configuredCTAs: {
				'configured-cta-id': EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
			},
			lastActionedExpressSetups: {
				[ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP ]: 1752451200,
			},
		} );

		await expect(
			checkRequirementsForExpressSetupResumeNotification(
				registry,
				EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP
			)
		).resolves.toBe( false );
	} );

	it( 'should only evaluate the requested CTA type', async () => {
		provideRRMSettings( {
			configuredCTAs: {
				'configured-cta-id': EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
			},
			lastActionedExpressSetups: {
				'another-cta': 1752451200,
			},
		} );

		await expect(
			checkRequirementsForExpressSetupResumeNotification(
				registry,
				EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP
			)
		).resolves.toBe( false );
	} );
} );
