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

import { render, waitFor, act } from '../../../../tests/js/test-utils';
import {
	getViewportHeight,
	setViewportHeight,
} from '../../../../tests/js/viewport-utils';
import AdaptiveFooterLayout from './AdaptiveFooterLayout';

describe( 'AdaptiveFooterLayout', () => {
	let originalGetBoundingClientRect;
	let originalOffsetHeight;
	let contentBottom;
	let footerHeight;
	let originalInnerHeight;

	beforeEach( () => {
		contentBottom = 0;
		footerHeight = 0;
		originalInnerHeight = getViewportHeight();

		originalGetBoundingClientRect =
			HTMLElement.prototype.getBoundingClientRect;
		originalOffsetHeight = Object.getOwnPropertyDescriptor(
			HTMLElement.prototype,
			'offsetHeight'
		);

		HTMLElement.prototype.getBoundingClientRect = function () {
			if ( this.classList?.contains( 'test-content' ) ) {
				return {
					x: 0,
					y: 0,
					top: 0,
					left: 0,
					right: 0,
					bottom: contentBottom,
					width: 0,
					height: 0,
				};
			}

			return {
				x: 0,
				y: 0,
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				width: 0,
				height: 0,
			};
		};

		Object.defineProperty( HTMLElement.prototype, 'offsetHeight', {
			configurable: true,
			get() {
				if ( this.classList?.contains( 'test-footer' ) ) {
					return footerHeight;
				}

				return 0;
			},
		} );
	} );

	afterEach( () => {
		HTMLElement.prototype.getBoundingClientRect =
			originalGetBoundingClientRect;

		if ( originalOffsetHeight ) {
			Object.defineProperty(
				HTMLElement.prototype,
				'offsetHeight',
				originalOffsetHeight
			);
		}

		setViewportHeight( originalInnerHeight );
	} );

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

	it( 'should apply inline class when content and footer fit in viewport', async () => {
		contentBottom = 300;
		footerHeight = 100;
		setViewportHeight( 500 );

		const { container } = renderComponent();

		await waitFor( () => {
			expect(
				container.querySelector( '.test-content--inline' )
			).toBeInTheDocument();
		} );
	} );

	it( 'should keep footer sticky when content and footer do not fit in viewport', async () => {
		contentBottom = 500;
		footerHeight = 200;
		setViewportHeight( 600 );

		const { container } = renderComponent();

		await waitFor( () => {
			expect(
				container.querySelector( '.test-content--inline' )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'should recalculate mode on resize', async () => {
		contentBottom = 500;
		footerHeight = 200;
		setViewportHeight( 600 );

		const { container } = renderComponent();

		await waitFor( () => {
			expect(
				container.querySelector( '.test-content--inline' )
			).not.toBeInTheDocument();
		} );

		contentBottom = 300;
		footerHeight = 100;
		setViewportHeight( 500 );

		act( () => {
			window.dispatchEvent( new Event( 'resize' ) );
		} );

		await waitFor( () => {
			expect(
				container.querySelector( '.test-content--inline' )
			).toBeInTheDocument();
		} );
	} );
} );
