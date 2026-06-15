/**
 * Site Goals BreakdownTabs tests.
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
import { SITE_GOALS_BREAKDOWN_OTHER_SOURCES_TAB_ID } from '@/js/modules/analytics-4/components/site-goals/constants';
import { fireEvent, render } from '@tests/js/test-utils';
import BreakdownTabs from './BreakdownTabs';

describe( 'BreakdownTabs', () => {
	const tabs = [
		{ id: 'woocommerce', label: 'WooCommerce' },
		{ id: 'easy-digital-downloads', label: 'Easy Digital Downloads' },
	];

	it( 'renders the provided tabs plus an "Other sources" tab', () => {
		const { getByText } = render(
			<BreakdownTabs
				tabs={ tabs }
				activeTabID="woocommerce"
				onTabChange={ () => {} }
			/>
		);

		expect( getByText( 'WooCommerce' ) ).toBeInTheDocument();
		expect( getByText( 'Easy Digital Downloads' ) ).toBeInTheDocument();
		expect( getByText( 'Other sources' ) ).toBeInTheDocument();
	} );

	it( 'fires onTabChange with the selected tab ID', () => {
		const onTabChange = jest.fn();

		const { getByText } = render(
			<BreakdownTabs
				tabs={ tabs }
				activeTabID="woocommerce"
				onTabChange={ onTabChange }
			/>
		);

		fireEvent.click( getByText( 'Easy Digital Downloads' ) );
		expect( onTabChange ).toHaveBeenCalledWith( 'easy-digital-downloads' );

		fireEvent.click( getByText( 'Other sources' ) );
		expect( onTabChange ).toHaveBeenCalledWith(
			SITE_GOALS_BREAKDOWN_OTHER_SOURCES_TAB_ID
		);
	} );

	it( 'renders an info tooltip for tabs that provide one', () => {
		const { container } = render(
			<BreakdownTabs
				tabs={ [
					{
						id: 'woocommerce',
						label: 'WooCommerce',
						tooltip: 'This form was created with WPForms.',
					},
				] }
				activeTabID="woocommerce"
				onTabChange={ () => {} }
			/>
		);

		// Tabs with tooltip content render the info icon; "Other sources" does not.
		expect(
			container.querySelectorAll( '.googlesitekit-info-tooltip' )
		).toHaveLength( 1 );
	} );

	it( 'renders every tab when many are present', () => {
		const manyTabs = Array.from( { length: 12 }, ( _, index ) => ( {
			id: `form-${ index }`,
			label: `Form ${ index }`,
		} ) );

		const { getByText } = render(
			<BreakdownTabs
				tabs={ manyTabs }
				activeTabID="form-0"
				onTabChange={ () => {} }
			/>
		);

		manyTabs.forEach( ( tab ) => {
			expect( getByText( tab.label ) ).toBeInTheDocument();
		} );
		expect( getByText( 'Other sources' ) ).toBeInTheDocument();
	} );
} );
