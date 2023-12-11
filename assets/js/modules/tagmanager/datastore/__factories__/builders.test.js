/**
 * Factory builder tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import * as factories from '../../datastore/__factories__';
import { CONTEXT_AMP, CONTEXT_WEB } from '../constants';

describe( 'Google Tag Manager Builder fake data test', () => {
	it( 'should create the same data from factory builders on each test run', () => {
		// Set a hardcoded fingerprint value on each container to
		// prevent the factory from failing due to `Date.now()` changing
		// between test runs.
		const setStaticFingerprintOnFactories = ( containers ) => {
			return containers.map( ( container ) => {
				return { ...container, fingerprint: '1676495375419' };
			} );
		};

		const account = factories.accountBuilder();
		const webContainers = factories.buildContainers(
			3,
			{ accountId: account.accountId, usageContext: [ CONTEXT_WEB ] } // eslint-disable-line sitekit/acronym-case
		);
		const ampContainers = factories.buildContainers(
			3,
			{ accountId: account.accountId, usageContext: [ CONTEXT_AMP ] } // eslint-disable-line sitekit/acronym-case
		);

		expect( {
			account,
			webContainers: setStaticFingerprintOnFactories( webContainers ),
			ampContainers: setStaticFingerprintOnFactories( ampContainers ),
		} ).toMatchSnapshot();
	} );
} );
