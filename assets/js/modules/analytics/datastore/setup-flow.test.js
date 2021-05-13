/**
 * `modules/analytics` data store: setup-flow tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import API from 'googlesitekit-api';
import {
	MODULES_ANALYTICS,
	SETUP_FLOW_MODE_LEGACY,
	SETUP_FLOW_MODE_UA,
	SETUP_FLOW_MODE_GA4,
	SETUP_FLOW_MODE_GA4_TRANSITIONAL,
} from './constants';
import { createTestRegistry, unsubscribeFromAll } from 'tests/js/utils';
import { MODULES_ANALYTICS_4 } from '../../analytics-4/datastore/constants';
import { enabledFeatures } from '../../../features';
import * as uaFixtures from './__fixtures__';
import * as ga4Fixtures from '../../analytics-4/datastore/__fixtures__';

describe( 'modules/analytics setup-flow', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );

		enabledFeatures.add( 'ga4setup' );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		enabledFeatures.delete( 'ga4setup' );
	} );

	describe( 'selectors', () => {
		describe( 'getSetupFlowMode', () => {
			it( 'should return the legacy mode if the ga4setup flag is not enabled', () => {
				enabledFeatures.delete( 'ga4setup' );
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe( SETUP_FLOW_MODE_LEGACY );
			} );

			it( 'should return the legacy mode if the ga4 api do not work', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveError( {}, 'getProperties', [ '1000' ] );
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe( SETUP_FLOW_MODE_LEGACY );
			} );

			it( 'should return the ga4 mode if there are no ua properties', () => {
				registry.dispatch( MODULES_ANALYTICS ).receiveGetAccountSummaries( [] );
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries( ga4Fixtures.accountSummaries );
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe( SETUP_FLOW_MODE_GA4 );
			} );

			it( 'should return the ua mode if there are no ua properties', () => {
				registry.dispatch( MODULES_ANALYTICS ).receiveGetAccountSummaries( uaFixtures.accountSummaries );
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries( [] );
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe( SETUP_FLOW_MODE_UA );
			} );

			it( 'should return the transitional mode if there are no ua properties', () => {
				registry.dispatch( MODULES_ANALYTICS ).receiveGetAccountSummaries( uaFixtures.accountSummaries );
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries( ga4Fixtures.accountSummaries );
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe( SETUP_FLOW_MODE_GA4_TRANSITIONAL );
			} );
		} );
	} );
} );
