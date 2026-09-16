/**
 * CurrentSubscriptionPill component tests.
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
import { render } from '@tests/js/test-utils';
import CurrentSubscriptionPill from './CurrentSubscriptionPill';

describe( 'CurrentSubscriptionPill', () => {
	it( 'does not render a next report line when no date is supplied', () => {
		const { getByText, queryByText } = render(
			<CurrentSubscriptionPill />
		);

		expect( getByText( 'Current subscription' ) ).toBeInTheDocument();
		expect( queryByText( /Next report/i ) ).not.toBeInTheDocument();
	} );

	it( 'renders the formatted next report date when supplied', () => {
		const { getByText } = render(
			<CurrentSubscriptionPill formattedNextReportDate="Aug 1, 2026" />
		);

		expect( getByText( 'Next report: Aug 1, 2026' ) ).toBeInTheDocument();
	} );

	it( 'does not apply the "selected" modifier class by default', () => {
		const { getByText } = render(
			<CurrentSubscriptionPill formattedNextReportDate="Aug 1, 2026" />
		);

		const pill = getByText( 'Current subscription' ).closest(
			'.googlesitekit-frequency-selector__current-subscription'
		);

		expect( pill ).not.toHaveClass(
			'googlesitekit-frequency-selector__current-subscription--selected'
		);
	} );

	it( 'applies the "selected" modifier class when `selected` is true', () => {
		const { getByText } = render(
			<CurrentSubscriptionPill
				formattedNextReportDate="Aug 1, 2026"
				selected
			/>
		);

		const pill = getByText( 'Current subscription' ).closest(
			'.googlesitekit-frequency-selector__current-subscription'
		);

		expect( pill ).toHaveClass(
			'googlesitekit-frequency-selector__current-subscription--selected'
		);
	} );
} );
