/**
 * ExpressSetupStepActions component tests.
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
import { fireEvent, render } from '@tests/js/test-utils';
import ExpressSetupStepActions from './ExpressSetupStepActions';

describe( 'ExpressSetupStepActions', () => {
	it( 'renders only the forward action without a back handler', () => {
		const { getByRole, queryByRole } = render(
			<ExpressSetupStepActions isBusy={ false } label="Next" />
		);

		expect( getByRole( 'button', { name: 'Next' } ) ).toHaveAttribute(
			'type',
			'submit'
		);
		expect(
			queryByRole( 'button', { name: 'Back' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders a back action that calls the back handler without submitting', () => {
		const onGoBack = jest.fn();

		const { getByRole } = render(
			<ExpressSetupStepActions
				isBusy={ false }
				label="Next"
				onGoBack={ onGoBack }
			/>
		);

		const backButton = getByRole( 'button', { name: 'Back' } );

		expect( backButton ).toHaveAttribute( 'type', 'button' );

		fireEvent.click( backButton );

		expect( onGoBack ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'disables both actions and shows the spinner while busy', () => {
		const { container, getByRole } = render(
			<ExpressSetupStepActions
				label="Next"
				onGoBack={ () => {} }
				isBusy
			/>
		);

		expect( getByRole( 'button', { name: 'Back' } ) ).toBeDisabled();
		expect( getByRole( 'button', { name: 'Next' } ) ).toBeDisabled();
		expect(
			container.querySelector(
				'.googlesitekit-button-icon--spinner__running'
			)
		).toBeInTheDocument();
	} );

	it( 'disables only the back action when it cannot go back', () => {
		const { getByRole } = render(
			<ExpressSetupStepActions
				canGoBack={ false }
				isBusy={ false }
				label="Next"
				onGoBack={ () => {} }
			/>
		);

		expect( getByRole( 'button', { name: 'Back' } ) ).toBeDisabled();
		expect( getByRole( 'button', { name: 'Next' } ) ).toBeEnabled();
	} );

	it( 'disables only the forward action when it cannot go forward', () => {
		const { getByRole } = render(
			<ExpressSetupStepActions
				canGoForward={ false }
				isBusy={ false }
				label="Next"
				onGoBack={ () => {} }
			/>
		);

		expect( getByRole( 'button', { name: 'Back' } ) ).toBeEnabled();
		expect( getByRole( 'button', { name: 'Next' } ) ).toBeDisabled();
	} );
} );
