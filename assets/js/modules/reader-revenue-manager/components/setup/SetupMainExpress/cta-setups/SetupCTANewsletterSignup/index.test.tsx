/**
 * Reader Revenue Manager SetupCTANewsletterSignup component tests.
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
import SetupCTANewsletterSignup from './index';

jest.mock(
	'@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/PoweredBy',
	() => () => null
);

const STEP_CONTENT = {
	[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ]:
		'RRM express setup placeholder: publication setup step.',
	[ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE ]:
		'RRM express setup placeholder: terms of service step.',
	[ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES ]:
		'RRM express setup placeholder: publication policies step.',
	[ EXPRESS_SETUP_STEPS.SETUP_CTA ]:
		'RRM express setup placeholder: newsletter CTA setup step.',
	[ EXPRESS_SETUP_STEPS.SETUP_COMPLETE ]:
		'RRM express setup placeholder: setup complete step.',
};

describe( 'SetupCTANewsletterSignup', () => {
	mockLocation();

	it( 'renders the newsletter CTA step title in the sidebar', () => {
		global.location.href = 'http://example.com/';

		const { getByText, container } = render( <SetupCTANewsletterSignup /> );

		expect( getByText( 'Set up a sign-up form' ) ).toBeInTheDocument();
		expect( getByText( 'Connect publication' ) ).toBeInTheDocument();
		expect( getByText( 'Accept terms of service' ) ).toBeInTheDocument();
		expect( getByText( 'Add publication policies' ) ).toBeInTheDocument();
		expect( getByText( 'Setup complete' ) ).toBeInTheDocument();
		expect(
			container.querySelectorAll( '.googlesitekit-stepper__step' )
		).toHaveLength( 5 );
	} );

	it.each( Object.entries( STEP_CONTENT ) )(
		'renders the %s step content',
		( step, content ) => {
			global.location.href = `http://example.com/?step=${ step }`;

			const { getByText, queryByText } = render(
				<SetupCTANewsletterSignup />
			);

			expect( getByText( content ) ).toBeInTheDocument();

			Object.entries( STEP_CONTENT )
				.filter( ( [ otherStep ] ) => otherStep !== step )
				.forEach( ( [ , otherContent ] ) => {
					expect(
						queryByText( otherContent )
					).not.toBeInTheDocument();
				} );
		}
	);

	it( 'renders no step content for an unknown step', () => {
		global.location.href = 'http://example.com/?step=unknown-step';

		const { getByText, queryByText } = render(
			<SetupCTANewsletterSignup />
		);

		expect( getByText( 'Set up a sign-up form' ) ).toBeInTheDocument();

		Object.values( STEP_CONTENT ).forEach( ( content ) => {
			expect( queryByText( content ) ).not.toBeInTheDocument();
		} );
	} );
} );
