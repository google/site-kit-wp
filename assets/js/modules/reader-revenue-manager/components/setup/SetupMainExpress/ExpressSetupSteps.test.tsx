/**
 * Reader Revenue Manager ExpressSetupSteps component tests.
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
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import {
	EXPRESS_SETUP_STEPS,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { createTestRegistry, render } from '@tests/js/test-utils';
import ExpressSetupSteps from './ExpressSetupSteps';

function renderExpressSetupSteps( ui = <ExpressSetupSteps /> ) {
	const registry = createTestRegistry();

	registry
		.dispatch( CORE_FORMS )
		.setValues( READER_REVENUE_MANAGER_SETUP_FORM, {
			[ SHOW_PUBLICATION_CREATE ]: true,
		} );

	return render( ui, { registry } );
}

describe( 'ExpressSetupSteps', () => {
	mockLocation();

	it( 'renders the default steps without extra steps', () => {
		global.location.href = 'http://example.com/';

		const { getByText, queryByText, container } = renderExpressSetupSteps();

		expect( getByText( 'Connect publication' ) ).toBeInTheDocument();
		expect( getByText( 'Accept terms of service' ) ).toBeInTheDocument();
		expect( getByText( 'Add publication policies' ) ).toBeInTheDocument();
		expect( getByText( 'Setup complete' ) ).toBeInTheDocument();
		expect(
			queryByText( 'Set up a sign-up form' )
		).not.toBeInTheDocument();
		expect(
			container.querySelectorAll( '.googlesitekit-stepper__step' )
		).toHaveLength( 4 );
	} );

	it( 'includes extra steps before setup complete', () => {
		global.location.href = 'http://example.com/';

		const { getByText, container } = renderExpressSetupSteps(
			<ExpressSetupSteps
				extraSteps={ {
					[ EXPRESS_SETUP_STEPS.SETUP_CTA ]: 'Set up a sign-up form',
					'custom-step': 'Custom step',
				} }
			/>
		);

		const steps = container.querySelectorAll(
			'.googlesitekit-stepper__step'
		);

		expect( getByText( 'Set up a sign-up form' ) ).toBeInTheDocument();
		expect( getByText( 'Custom step' ) ).toBeInTheDocument();
		expect( steps ).toHaveLength( 6 );
		expect( steps[ 3 ] ).toHaveTextContent( 'Set up a sign-up form' );
		expect( steps[ 4 ] ).toHaveTextContent( 'Custom step' );
		expect( steps[ 5 ] ).toHaveTextContent( 'Setup complete' );
	} );

	it( 'marks the step matching the step query arg as active', () => {
		global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE }`;

		const { container } = renderExpressSetupSteps();

		const steps = container.querySelectorAll(
			'.googlesitekit-stepper__step'
		);

		expect( steps[ 0 ] ).toHaveClass(
			'googlesitekit-stepper__step--completed'
		);
		expect( steps[ 1 ] ).toHaveClass(
			'googlesitekit-stepper__step--active'
		);
		expect( steps[ 2 ] ).toHaveClass(
			'googlesitekit-stepper__step--upcoming'
		);
	} );

	it( 'marks an extra step as active when it is included and selected', () => {
		global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.SETUP_CTA }`;

		const { container } = renderExpressSetupSteps(
			<ExpressSetupSteps
				extraSteps={ {
					[ EXPRESS_SETUP_STEPS.SETUP_CTA ]: 'Set up a sign-up form',
				} }
			/>
		);

		const steps = container.querySelectorAll(
			'.googlesitekit-stepper__step'
		);

		expect( steps[ 3 ] ).toHaveClass(
			'googlesitekit-stepper__step--active'
		);
		expect( steps[ 3 ] ).toHaveTextContent( 'Set up a sign-up form' );
	} );

	it( 'omits the Terms of Service step when setting up an existing publication', () => {
		global.location.href = 'http://example.com/';
		const registry = createTestRegistry();

		registry
			.dispatch( CORE_FORMS )
			.setValues( READER_REVENUE_MANAGER_SETUP_FORM, {
				[ SHOW_PUBLICATION_CREATE ]: false,
			} );

		const { getByText, queryByText, container } = render(
			<ExpressSetupSteps />,
			{ registry }
		);

		expect( getByText( 'Connect publication' ) ).toBeInTheDocument();
		expect(
			queryByText( 'Accept terms of service' )
		).not.toBeInTheDocument();
		expect( getByText( 'Add publication policies' ) ).toBeInTheDocument();
		expect( getByText( 'Setup complete' ) ).toBeInTheDocument();
		expect(
			container.querySelectorAll( '.googlesitekit-stepper__step' )
		).toHaveLength( 3 );
	} );
} );
