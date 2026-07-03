/**
 * ChangeBadge component tests.
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
import ChangeBadge from './ChangeBadge';

describe( 'ChangeBadge', () => {
	it( 'renders the "No change" label instead of "0%" when the current value equals the previous value', () => {
		const { getByText, queryByText } = render(
			<ChangeBadge
				previousValue={ 1000 }
				currentValue={ 1000 }
				zeroChangeLabel="No change"
			/>
		);

		expect( getByText( 'No change' ) ).toBeInTheDocument();
		expect( queryByText( '0%' ) ).not.toBeInTheDocument();
	} );

	it( 'renders "0%" when the current value equals the previous value and no "No change" label is passed', () => {
		const { getByText } = render(
			<ChangeBadge previousValue={ 1000 } currentValue={ 1000 } />
		);

		expect( getByText( '0%' ) ).toBeInTheDocument();
	} );

	it( 'renders the percentage and not the "No change" label when the current value is above the previous value', () => {
		const { getByText, queryByText } = render(
			<ChangeBadge
				previousValue={ 1000 }
				currentValue={ 1250 }
				zeroChangeLabel="No change"
			/>
		);

		expect( getByText( '+25%' ) ).toBeInTheDocument();
		expect( queryByText( 'No change' ) ).not.toBeInTheDocument();
	} );
} );
