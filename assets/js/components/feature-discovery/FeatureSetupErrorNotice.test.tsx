/**
 * FeatureSetupErrorNotice component tests.
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
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '@/js/util/errors';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import { provideSiteInfo } from '@tests/js/utils';
import FeatureSetupErrorNotice from './FeatureSetupErrorNotice';

describe( 'FeatureSetupErrorNotice', () => {
	it( 'should render retryable setup failures with Retry and Learn more', () => {
		const registry = createTestRegistry();
		provideSiteInfo( registry );
		provideFeatures( registry, [
			{
				slug: 'test-feature',
				name: 'Analytics',
				title: 'Analytics title',
			},
		] );

		const error = {
			code: 'activation_failed',
			message: 'Could not activate service.',
			data: { status: 500 },
		};

		const troubleshootingURL = registry
			.select( CORE_SITE )
			.getErrorTroubleshootingLinkURL( error );

		const onRetry = jest.fn();
		const onDismiss = jest.fn();

		const { getByRole, getByText } = render(
			<FeatureSetupErrorNotice
				error={ error }
				onDismiss={ onDismiss }
				onRetry={ onRetry }
				slug="test-feature"
			/>,
			{ registry }
		);

		expect( getByText( 'Analytics setup failed' ) ).toBeInTheDocument();
		expect(
			getByText( /Could not activate service\./i )
		).toBeInTheDocument();

		const learnMoreLink = getByRole( 'link', { name: /learn more/i } );
		expect( learnMoreLink ).toHaveAttribute( 'href', troubleshootingURL );
		expect( learnMoreLink ).toHaveAttribute( 'target', '_blank' );
		expect( learnMoreLink ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		expect( learnMoreLink.querySelector( 'svg' ) ).not.toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );
		expect( onRetry ).toHaveBeenCalledTimes( 1 );

		fireEvent.click( getByRole( 'button', { name: 'Got it' } ) );
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should render insufficient permissions failures without Retry', () => {
		const registry = createTestRegistry();
		provideSiteInfo( registry );
		provideFeatures( registry, [
			{
				slug: 'test-feature',
				title: 'Enhanced measurement',
			},
		] );

		const error = {
			code: 'forbidden',
			message: 'Insufficient permissions.',
			data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
		};

		const troubleshootingURL = registry
			.select( CORE_SITE )
			.getErrorTroubleshootingLinkURL( error );

		const { getByRole, getByText, queryByRole } = render(
			<FeatureSetupErrorNotice
				error={ error }
				onDismiss={ () => {} }
				onRetry={ () => {} }
				slug="test-feature"
			/>,
			{ registry }
		);

		expect(
			getByText( 'Enhanced measurement setup failed' )
		).toBeInTheDocument();
		expect( getByText( /insufficient permissions/i ) ).toBeInTheDocument();
		expect(
			queryByRole( 'button', { name: 'Retry' } )
		).not.toBeInTheDocument();

		const getHelpLink = getByRole( 'link', { name: /get help/i } );
		expect( getHelpLink ).toHaveAttribute( 'href', troubleshootingURL );
		expect( getHelpLink ).toHaveAttribute( 'target', '_blank' );

		expect( getByRole( 'button', { name: 'Got it' } ) ).toBeInTheDocument();
	} );

	it( 'should fall back to feature title when feature name is not available', () => {
		const registry = createTestRegistry();
		provideSiteInfo( registry );
		provideFeatures( registry, [
			{
				slug: 'test-feature',
				title: 'Title fallback',
			},
		] );

		const error = {
			code: 'activation_failed',
			message: 'Could not activate service.',
			data: { status: 500 },
		};

		const { getByText } = render(
			<FeatureSetupErrorNotice
				error={ error }
				onDismiss={ () => {} }
				onRetry={ () => {} }
				slug="test-feature"
			/>,
			{ registry }
		);

		expect(
			getByText( 'Title fallback setup failed' )
		).toBeInTheDocument();
	} );

	it( 'should include the redo setup link when reconnectURL is present', () => {
		const registry = createTestRegistry();
		provideSiteInfo( registry );
		provideFeatures( registry, [
			{
				slug: 'test-feature',
				title: 'Sign in with Google',
			},
		] );

		const error = {
			code: 'access_denied',
			message: 'Authentication failed.',
			data: {
				reconnectURL: 'https://example.com/reconnect',
			},
		};

		const { getByRole } = render(
			<FeatureSetupErrorNotice
				error={ error }
				onDismiss={ () => {} }
				onRetry={ () => {} }
				slug="test-feature"
			/>,
			{ registry }
		);

		expect(
			getByRole( 'link', { name: /redo the plugin setup/i } )
		).toHaveAttribute( 'href', 'https://example.com/reconnect' );
		expect(
			getByRole( 'link', { name: /learn more/i } )
		).toBeInTheDocument();
	} );
} );
