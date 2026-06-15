/**
 * AdaptiveFooterLayout component tests.
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
import { setupAdaptiveFooterLayoutTests } from '@tests/js/adaptive-footer-layout-utils';
import { act, render, waitFor } from '@tests/js/test-utils';
import { setViewportHeight } from '@tests/js/viewport-utils';
import AdaptiveFooterLayout from './AdaptiveFooterLayout';

describe( 'AdaptiveFooterLayout', () => {
	const adaptiveFooterMeasurements = setupAdaptiveFooterLayoutTests(
		'test-content',
		'test-footer'
	);

	function renderComponent() {
		return render(
			<AdaptiveFooterLayout
				className="test-content"
				inlineClassName="test-content--inline"
				footerClassName="test-footer"
				footer={ <button>Complete setup</button> }
			>
				<div>Questions content</div>
			</AdaptiveFooterLayout>
		);
	}

	it( 'should apply the inline class when content and footer fit in viewport', async () => {
		adaptiveFooterMeasurements.contentBottom = 300;
		adaptiveFooterMeasurements.footerHeight = 100;
		setViewportHeight( 500 );

		const { container } = renderComponent();

		await waitFor( () => {
			expect(
				container.querySelector( '.test-content--inline' )
			).toBeInTheDocument();
		} );
	} );

	it( 'should not apply the inline class when content and footer do not fit in viewport', async () => {
		adaptiveFooterMeasurements.contentBottom = 500;
		adaptiveFooterMeasurements.footerHeight = 200;
		setViewportHeight( 600 );

		const { container } = renderComponent();

		await waitFor( () => {
			expect(
				container.querySelector( '.test-content--inline' )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'should recalculate mode on resize', async () => {
		adaptiveFooterMeasurements.contentBottom = 500;
		adaptiveFooterMeasurements.footerHeight = 200;
		setViewportHeight( 600 );

		const { container } = renderComponent();

		await waitFor( () => {
			expect(
				container.querySelector( '.test-content--inline' )
			).not.toBeInTheDocument();
		} );

		adaptiveFooterMeasurements.contentBottom = 300;
		adaptiveFooterMeasurements.footerHeight = 100;
		setViewportHeight( 500 );

		act( () => {
			global.dispatchEvent( new Event( 'resize' ) );
		} );

		await waitFor( () => {
			expect(
				container.querySelector( '.test-content--inline' )
			).toBeInTheDocument();
		} );
	} );

	it( 'should call onFooterInlineChange when the footer inline state changes', async () => {
		adaptiveFooterMeasurements.contentBottom = 300;
		adaptiveFooterMeasurements.footerHeight = 100;
		setViewportHeight( 300 );

		const onFooterInlineChange = jest.fn();

		const { container } = render(
			<AdaptiveFooterLayout
				className="test-content"
				inlineClassName="test-content--inline"
				footerClassName="test-footer"
				footer={ <button>Complete setup</button> }
				onFooterInlineChange={ onFooterInlineChange }
			>
				<div>Questions content</div>
			</AdaptiveFooterLayout>
		);

		expect( onFooterInlineChange ).toHaveBeenCalledTimes( 0 );

		setViewportHeight( 500 );

		act( () => {
			global.dispatchEvent( new Event( 'resize' ) );
		} );

		await waitFor( () => {
			expect(
				container.querySelector( '.test-content--inline' )
			).toBeInTheDocument();
		} );

		expect( onFooterInlineChange ).toHaveBeenCalledTimes( 1 );
		expect( onFooterInlineChange ).toHaveBeenCalledWith( true );
	} );
} );
