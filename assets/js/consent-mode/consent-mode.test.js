/**
 * Consent Mode tests
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import './consent-mode';

describe( 'Consent Mode', () => {
	const gtagMock = jest.fn();

	beforeEach( () => {
		global.gtag = gtagMock;
		global._googlesitekitConsentCategoryMap = {
			'test-category': [ 'test-parameter' ],
		};
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'should call gtag with the correct parameters when wp_listen_for_consent_change event is triggered', () => {
		document.dispatchEvent(
			new CustomEvent( 'wp_listen_for_consent_change', {
				detail: {
					'test-category': 'allow',
				},
			} )
		);

		expect( gtagMock ).toHaveBeenCalledWith( 'consent', 'update', {
			'test-parameter': 'granted',
		} );
	} );

	it( 'should call gtag with the correct parameters when wp_consent_type_defined event is triggered', () => {
		document.dispatchEvent(
			new CustomEvent( 'wp_consent_type_defined', {
				detail: {
					'test-category': 'allow',
				},
			} )
		);
		expect( gtagMock ).toHaveBeenCalledWith( 'consent', 'update', {
			'test-parameter': 'granted',
		} );
	} );

	it( 'should call gtag with the correct parameters when DOMContentLoaded event is triggered', () => {
		document.dispatchEvent( new Event( 'DOMContentLoaded' ) );
		expect( gtagMock ).toHaveBeenCalledWith( 'consent', 'update', {
			'test-parameter': 'granted',
		} );
	} );
} );
