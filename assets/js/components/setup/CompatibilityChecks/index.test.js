/**
 * CompatibilityChecks component tests.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CompatibilityChecks from './index';
import {
	render,
	waitForElementToBeRemoved,
} from '../../../../../tests/js/test-utils';
import {
	muteFetch,
	provideSiteInfo,
	createTestRegistry,
} from '../../../../../tests/js/utils';
import { AMP_PROJECT_TEST_URL } from './constants';

const compatibilityChildren = ( {
	complete,
	inProgressFeedback,
	ctaFeedback,
} ) => (
	<Fragment>
		{ ctaFeedback }
		{ complete }
		{ inProgressFeedback }
	</Fragment>
);

describe( 'CompatibilityChecks', () => {
	let registry;
	const homeURL = 'http://example.com';

	beforeEach( () => {
		registry = createTestRegistry();
		// Mock global.location.hostname with value that won't throw error in first check.
		Object.defineProperty( global.window, 'location', {
			value: {
				hostname: 'validurl.tld',
			},
			writable: true,
		} );

		provideSiteInfo( registry, { homeURL } );
	} );

	it( 'should initially display "Checking Compatibility..." message', async () => {
		// Mock request to setup-tag
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/setup-tag' )
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/connection' )
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/developer-plugin' )
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/health-checks' )
		);
		muteFetch( { query: { tagverify: '1' } } );
		// Mock request to AMP project.
		muteFetch( AMP_PROJECT_TEST_URL );

		const { container, waitForRegistry } = render(
			<CompatibilityChecks>{ compatibilityChildren }</CompatibilityChecks>
		);

		expect( container ).toHaveTextContent( 'Checking Compatibility…' );

		await waitForRegistry();

		expect(
			document.querySelector( '.mdc-linear-progress' )
		).not.toBeInTheDocument();
	} );

	it( 'should display "Your site may not be ready for Site Kit" if a check throws an error', async () => {
		// Mock request to setup-tag
		fetchMock.postOnce(
			new RegExp( '^/google-site-kit/v1/core/site/data/setup-tag' ),
			{ body: {}, status: 500 }
		);

		// Mock request to developer-plugin when error is thrown.
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/developer-plugin' )
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/health-checks' )
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/connection' )
		);
		// Mock request to AMP project.
		muteFetch( AMP_PROJECT_TEST_URL );

		const { container } = render(
			<CompatibilityChecks>
				{ compatibilityChildren }
			</CompatibilityChecks>,
			{ registry }
		);

		// Wait for progress bar to disappear.
		await waitForElementToBeRemoved(
			document.querySelector( '.mdc-linear-progress' )
		);

		// Expect neither error nor incomplete text to be displayed.
		expect( container ).toHaveTextContent(
			'Your site may not be ready for Site Kit'
		);
	} );

	it( 'should make API requests to "setup-checks, health-checks and AMP Project test URL', async () => {
		const token = 'test-token-value';

		// Mock request to setup-tag.
		fetchMock.postOnce(
			new RegExp( '^/google-site-kit/v1/core/site/data/setup-tag' ),
			{ body: { token }, status: 200 }
		);

		fetchMock.postOnce( homeURL, { body: { token }, status: 200 } );

		// Mock request to health-checks.
		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/site/data/health-checks' ),
			{
				body: {
					checks: {
						googleAPI: { pass: true },
						skService: { pass: true },
					},
				},
				status: 200,
			}
		);

		// Mock request to AMP project.
		muteFetch( AMP_PROJECT_TEST_URL );
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/developer-plugin' )
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/connection' )
		);

		// Mock getExistingTag request.
		fetchMock.get(
			{ query: { tagverify: '1' } },
			{
				body: `<html><head><meta name="googlesitekit-setup" content="${ token }"/></head><body></body>`,
				status: 200,
			}
		);

		render(
			<CompatibilityChecks>
				{ compatibilityChildren }
			</CompatibilityChecks>,
			{ registry }
		);

		await waitForElementToBeRemoved(
			document.querySelector( '.mdc-linear-progress' )
		);

		// Expect our progress bar for in progress checks to be gone.
		expect(
			document.querySelector( '.mdc-linear-progress' )
		).not.toBeInTheDocument();

		// Expect to have made requests to the setup-checks and health-checks endpoints and the AMP Project test URL.
		expect( fetchMock ).toHaveFetched(
			new RegExp( '^/google-site-kit/v1/core/site/data/setup-tag' )
		);
		expect( fetchMock ).toHaveFetched(
			new RegExp( '^/google-site-kit/v1/core/site/data/health-checks' )
		);
		expect( fetchMock ).toHaveFetched( AMP_PROJECT_TEST_URL );
	} );

	it( 'should not contain incomplete or error messages if checks are successful', async () => {
		const token = 'test-token-value';

		// Mock request to setup-tag.
		fetchMock.postOnce(
			new RegExp( '^/google-site-kit/v1/core/site/data/setup-tag' ),
			{ body: { token }, status: 200 }
		);

		// Mock request to setup-tag.
		fetchMock.postOnce( homeURL, { body: { token }, status: 200 } );

		// Mock request to health-checks.
		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/site/data/health-checks' ),
			{
				body: {
					checks: {
						googleAPI: { pass: true },
						skService: { pass: true },
					},
				},
				status: 200,
			}
		);

		// Mock request to AMP project.
		muteFetch( AMP_PROJECT_TEST_URL );
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/developer-plugin' )
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/site/data/connection' )
		);

		// Mock getExistingTag request
		fetchMock.get(
			{ query: { tagverify: '1' } },
			{
				body: `<html><head><meta name="googlesitekit-setup" content="${ token }"/></head><body></body>`,
				status: 200,
			}
		);

		const { container } = render(
			<CompatibilityChecks>
				{ compatibilityChildren }
			</CompatibilityChecks>,
			{ registry }
		);

		await waitForElementToBeRemoved(
			document.querySelector( '.mdc-linear-progress' )
		);

		// Expect our progress bar for in progress checks to be gone.
		expect(
			document.querySelector( '.mdc-linear-progress' )
		).not.toBeInTheDocument();

		// Expect neither error nor incomplete text to be displayed.
		expect( container ).not.toHaveTextContent(
			'Your site may not be ready for Site Kit'
		);
		expect( container ).not.toHaveTextContent( 'Checking Compatibility…' );
	} );
} );
