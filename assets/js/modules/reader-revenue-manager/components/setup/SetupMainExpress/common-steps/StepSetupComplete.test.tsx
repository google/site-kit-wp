/**
 * Reader Revenue Manager StepSetupComplete component tests.
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
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	render,
} from '@tests/js/test-utils';
import StepSetupComplete from './StepSetupComplete';

describe( 'StepSetupComplete', () => {
	mockLocation();

	let registry: WPDataRegistry;

	const dashboardURL =
		'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard';

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );

		global.location.href = 'http://example.com/';
	} );

	it( 'renders the default title for the default express setup', () => {
		const { getByText, queryByText } = render( <StepSetupComplete />, {
			registry,
		} );

		expect(
			getByText( 'Reader Revenue Manager is set up' )
		).toBeInTheDocument();
		expect(
			queryByText( 'What to know about your new CTA:' )
		).not.toBeInTheDocument();
	} );

	it( 'renders a custom title and CTA-specific content', () => {
		global.location.href = 'http://example.com/?cta=newsletter-signup';

		const { getByText } = render(
			<StepSetupComplete title="Your newsletter signup form is ready!">
				<p>Newsletter CTA details</p>
			</StepSetupComplete>,
			{ registry }
		);

		expect(
			getByText( 'Your newsletter signup form is ready!' )
		).toBeInTheDocument();
		expect( getByText( 'Newsletter CTA details' ) ).toBeInTheDocument();
		expect(
			getByText( 'What to know about your new CTA:' )
		).toBeInTheDocument();
	} );

	it( 'renders the CTA details heading only when the `cta` query argument is present', () => {
		const { queryByText: queryWithoutCTA } = render(
			<StepSetupComplete>
				<p>Newsletter CTA details</p>
			</StepSetupComplete>,
			{ registry }
		);

		expect(
			queryWithoutCTA( 'What to know about your new CTA:' )
		).not.toBeInTheDocument();

		global.location.href = 'http://example.com/?cta=newsletter-signup';

		const { getByText } = render(
			<StepSetupComplete>
				<p>Newsletter CTA details</p>
			</StepSetupComplete>,
			{ registry }
		);

		expect(
			getByText( 'What to know about your new CTA:' )
		).toBeInTheDocument();
	} );

	it( 'does not render the CTA details heading without CTA-specific content', () => {
		global.location.href = 'http://example.com/?cta=newsletter-signup';

		const { queryByText } = render( <StepSetupComplete />, { registry } );

		expect(
			queryByText( 'What to know about your new CTA:' )
		).not.toBeInTheDocument();
	} );

	it( 'renders the secondary CTA when provided', () => {
		const { getByText } = render(
			<StepSetupComplete
				secondaryCTA={ <button>View on your site</button> }
			/>,
			{ registry }
		);

		expect( getByText( 'View on your site' ) ).toBeInTheDocument();
	} );

	it( 'navigates to the Site Kit dashboard from the primary CTA', () => {
		const { getByRole } = render( <StepSetupComplete />, { registry } );

		fireEvent.click(
			getByRole( 'button', { name: /Return to Dashboard/i } )
		);

		expect( global.location.assign ).toHaveBeenCalledWith( dashboardURL );
	} );
} );
