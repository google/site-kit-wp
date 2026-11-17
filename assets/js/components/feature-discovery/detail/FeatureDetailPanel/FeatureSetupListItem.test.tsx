/**
 * FeatureSetupListItem tests.
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
import { render, screen } from '@tests/js/test-utils';
import FeatureSetupListItem from './FeatureSetupListItem';

describe( 'FeatureSetupListItem', () => {
	it( 'should render a plain entry unchanged', () => {
		render(
			<ul>
				<FeatureSetupListItem step="Choose your Google Ads account" />
			</ul>
		);

		const item = screen.getByRole( 'listitem' );

		expect( item ).toHaveTextContent( 'Choose your Google Ads account' );
		expect( item.querySelector( 'ul' ) ).not.toBeInTheDocument();
	} );

	it( 'should render a label and a nested list of sub-steps', () => {
		const { container } = render(
			<ul>
				<FeatureSetupListItem
					step={ {
						label: 'Connect your account',
						subSteps: [
							'New account: Set up your account, campaign and payment details.',
							'Existing account: Enter your Ads conversion ID.',
						],
					} }
				/>
			</ul>
		);

		expect(
			screen.getByText( 'Connect your account' )
		).toBeInTheDocument();

		const subStepsList = container.querySelector( 'ul ul' );

		expect( subStepsList ).toBeInTheDocument();
		expect( subStepsList?.children ).toHaveLength( 2 );
		expect(
			screen.getByText(
				'New account: Set up your account, campaign and payment details.'
			)
		).toBeInTheDocument();
		expect(
			screen.getByText(
				'Existing account: Enter your Ads conversion ID.'
			)
		).toBeInTheDocument();
	} );
} );
