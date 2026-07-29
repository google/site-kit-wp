/**
 * Reader Revenue Manager ExpressSetupLayout component tests.
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
import {
	BREAKPOINT_DESKTOP,
	BREAKPOINT_SMALL,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import { render } from '@tests/js/test-utils';
import ExpressSetupLayout from './ExpressSetupLayout';

jest.mock( '@/js/hooks/useBreakpoint', () => ( {
	...jest.requireActual( '@/js/hooks/useBreakpoint' ),
	useBreakpoint: jest.fn(),
} ) );

jest.mock( './PoweredBy', () => () => <div>Powered by RRM</div> );

describe( 'ExpressSetupLayout', () => {
	beforeEach( () => {
		( useBreakpoint as jest.Mock ).mockReturnValue( BREAKPOINT_DESKTOP );
	} );

	it( 'renders the supplied sidebar and content', () => {
		const { getByText } = render(
			<ExpressSetupLayout sidebar={ <div>Setup steps</div> }>
				<div>Step content</div>
			</ExpressSetupLayout>
		);

		expect( getByText( 'Setup steps' ) ).toBeInTheDocument();
		expect( getByText( 'Step content' ) ).toBeInTheDocument();
	} );

	it( 'renders the module attribution in the sidebar on desktop', () => {
		const { container, getByText } = render(
			<ExpressSetupLayout sidebar={ <div>Setup steps</div> }>
				<div>Step content</div>
			</ExpressSetupLayout>
		);

		expect(
			container.querySelector(
				'.googlesitekit-rrm-express-setup__footer'
			)
		).not.toBeInTheDocument();
		expect(
			getByText( 'Powered by RRM' ).closest(
				'.googlesitekit-rrm-express-setup__sidebar'
			)
		).toBeInTheDocument();
	} );

	it( 'renders the module attribution in the footer on mobile', () => {
		( useBreakpoint as jest.Mock ).mockReturnValue( BREAKPOINT_SMALL );

		const { getByText } = render(
			<ExpressSetupLayout sidebar={ <div>Setup steps</div> }>
				<div>Step content</div>
			</ExpressSetupLayout>
		);

		expect(
			getByText( 'Powered by RRM' ).closest(
				'.googlesitekit-rrm-express-setup__footer'
			)
		).toBeInTheDocument();
	} );
} );
