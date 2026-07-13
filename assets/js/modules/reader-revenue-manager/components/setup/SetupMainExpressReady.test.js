/**
 * Reader Revenue Manager SetupMainExpressReady component tests.
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
import { isFeatureEnabled } from '@/js/features';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { render } from '@tests/js/test-utils';
import SetupMainExpressReady from './SetupMainExpressReady';

jest.mock( '@/js/features', () => ( {
	...jest.requireActual( '@/js/features' ),
	isFeatureEnabled: jest.fn(),
} ) );

jest.mock( './SetupMain', () => {
	return function MockSetupMain() {
		return <div>Legacy setup main</div>;
	};
} );

describe( 'SetupMainExpressReady', () => {
	mockLocation();

	beforeEach( () => {
		isFeatureEnabled.mockReturnValue( true );
	} );

	it( 'renders express setup when expressSetup=true', () => {
		global.location.href =
			'http://example.com/?expressSetup=true&step=connect-publication';

		const { getByText, queryByText } = render( <SetupMainExpressReady /> );

		expect(
			getByText(
				'RRM express setup placeholder: publication setup step.'
			)
		).toBeInTheDocument();
		expect( queryByText( 'Legacy setup main' ) ).not.toBeInTheDocument();
	} );

	it( 'renders terms of service step when expressSetup=true and step is terms-of-service', () => {
		global.location.href =
			'http://example.com/?expressSetup=true&step=terms-of-service';

		const { getByText, queryByText } = render( <SetupMainExpressReady /> );

		expect(
			getByText( 'RRM express setup placeholder: terms of service step.' )
		).toBeInTheDocument();
		expect( queryByText( 'Legacy setup main' ) ).not.toBeInTheDocument();
	} );

	it( 'renders publication policies step when expressSetup=true and step is publication-policies', () => {
		global.location.href =
			'http://example.com/?expressSetup=true&step=publication-policies';

		const { getByText, queryByText } = render( <SetupMainExpressReady /> );

		expect(
			getByText(
				'RRM express setup placeholder: publication policies step.'
			)
		).toBeInTheDocument();
		expect( queryByText( 'Legacy setup main' ) ).not.toBeInTheDocument();
	} );

	it( 'renders legacy setup when expressSetup is not true', () => {
		global.location.href = 'http://example.com/?expressSetup=false';

		const { getByText, queryByText } = render( <SetupMainExpressReady /> );

		expect( getByText( 'Legacy setup main' ) ).toBeInTheDocument();
		expect(
			queryByText(
				'RRM express setup placeholder: publication setup step.'
			)
		).not.toBeInTheDocument();
	} );

	it( 'renders legacy setup when rrmExpressSetup feature is disabled', () => {
		isFeatureEnabled.mockReturnValue( false );
		global.location.href =
			'http://example.com/?expressSetup=true&step=terms-of-service';

		const { getByText, queryByText } = render( <SetupMainExpressReady /> );

		expect( getByText( 'Legacy setup main' ) ).toBeInTheDocument();
		expect(
			queryByText(
				'RRM express setup placeholder: terms of service step.'
			)
		).not.toBeInTheDocument();
	} );
} );
