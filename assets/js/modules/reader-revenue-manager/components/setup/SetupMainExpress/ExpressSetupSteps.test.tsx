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
import { EXPRESS_SETUP_STEPS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { render } from '@tests/js/test-utils';
import ExpressSetupSteps from './ExpressSetupSteps';

describe( 'ExpressSetupSteps', () => {
	mockLocation();

	it( 'renders the default steps without the setup CTA step', () => {
		global.location.href = 'http://example.com/';

		const { getByText, queryByText, container } = render(
			<ExpressSetupSteps />
		);

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

	it( 'includes the setup CTA step when setupCTAStepTitle is provided', () => {
		global.location.href = 'http://example.com/';

		const { getByText, container } = render(
			<ExpressSetupSteps setupCTAStepTitle="Set up a sign-up form" />
		);

		expect( getByText( 'Set up a sign-up form' ) ).toBeInTheDocument();
		expect(
			container.querySelectorAll( '.googlesitekit-stepper__step' )
		).toHaveLength( 5 );
	} );

	it( 'marks the step matching the step query arg as active', () => {
		global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE }`;

		const { container } = render( <ExpressSetupSteps /> );

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

	it( 'marks the setup CTA step as active when it is included and selected', () => {
		global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.SETUP_CTA }`;

		const { container } = render(
			<ExpressSetupSteps setupCTAStepTitle="Set up a sign-up form" />
		);

		const steps = container.querySelectorAll(
			'.googlesitekit-stepper__step'
		);

		expect( steps[ 3 ] ).toHaveClass(
			'googlesitekit-stepper__step--active'
		);
		expect( steps[ 3 ] ).toHaveTextContent( 'Set up a sign-up form' );
	} );
} );
