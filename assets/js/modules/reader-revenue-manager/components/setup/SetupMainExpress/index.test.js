/**
 * Reader Revenue Manager SetupMainExpress component tests.
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
import { mockLocation } from '@tests/js/mock-browser-utils';
import { render } from '@tests/js/test-utils';
import SetupMainExpress from './index';

describe( 'SetupMainExpress', () => {
	mockLocation();

	it( 'renders the newsletter CTA setup step for newsletter-signup CTA', () => {
		global.location.href =
			'http://example.com/?cta=newsletter-signup&step=setup-cta';

		const { getByText } = render( <SetupMainExpress /> );

		expect(
			getByText(
				'RRM express setup placeholder: newsletter CTA setup step.'
			)
		).toBeInTheDocument();
	} );

	it( 'renders terms of service step for newsletter-signup CTA', () => {
		global.location.href =
			'http://example.com/?cta=newsletter-signup&step=terms-of-service';

		const { getByText } = render( <SetupMainExpress /> );

		expect(
			getByText( 'RRM express setup placeholder: terms of service step.' )
		).toBeInTheDocument();
	} );

	it( 'renders terms of service step when no CTA is set', () => {
		global.location.href = 'http://example.com/?step=terms-of-service';

		const { getByText } = render( <SetupMainExpress /> );

		expect(
			getByText( 'RRM express setup placeholder: terms of service step.' )
		).toBeInTheDocument();
	} );

	it( 'renders publication policies step for newsletter-signup CTA', () => {
		global.location.href =
			'http://example.com/?cta=newsletter-signup&step=publication-policies';

		const { getByText } = render( <SetupMainExpress /> );

		expect(
			getByText(
				'RRM express setup placeholder: publication policies step.'
			)
		).toBeInTheDocument();
	} );

	it( 'renders publication policies step when no CTA is set', () => {
		global.location.href = 'http://example.com/?step=publication-policies';

		const { getByText } = render( <SetupMainExpress /> );

		expect(
			getByText(
				'RRM express setup placeholder: publication policies step.'
			)
		).toBeInTheDocument();
	} );

	it( 'renders setup complete for no CTA when the setup-complete step is set', () => {
		global.location.href = 'http://example.com/?step=setup-complete';

		const { getByText } = render( <SetupMainExpress /> );

		expect(
			getByText( 'RRM express setup placeholder: setup complete step.' )
		).toBeInTheDocument();
	} );

	it( 'renders publication setup by default when no CTA is set', () => {
		global.location.href = 'http://example.com/?step=connect-publication';

		const { getByText } = render( <SetupMainExpress /> );

		expect(
			getByText(
				'RRM express setup placeholder: publication setup step.'
			)
		).toBeInTheDocument();
	} );
} );
