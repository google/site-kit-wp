/**
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
import { getViewportHeight, setViewportHeight } from '@tests/js/viewport-utils';

/**
 * Mocks layout measurements for testing the `AdaptiveFooterLayout` component.
 *
 * @since n.e.x.t
 *
 * @param {string} className       The class name of the content element.
 * @param {string} footerClassName The class name of the footer element.
 * @return {Object}                The layout measurements object, used in tests to set the required values.
 */
export function setupAdaptiveFooterLayoutTests(
	className: string,
	footerClassName: string
) {
	let originalGetBoundingClientRect: ( this: Element ) => DOMRect;
	let originalOffsetHeight: PropertyDescriptor | undefined;
	let originalInnerHeight: number;

	const layoutMeasurements = {
		contentBottom: 0,
		footerHeight: 0,
	};

	beforeEach( () => {
		layoutMeasurements.contentBottom = 0;
		layoutMeasurements.footerHeight = 0;
		originalInnerHeight = getViewportHeight();

		originalGetBoundingClientRect =
			HTMLElement.prototype.getBoundingClientRect;
		originalOffsetHeight = Object.getOwnPropertyDescriptor(
			HTMLElement.prototype,
			'offsetHeight'
		);

		HTMLElement.prototype.getBoundingClientRect = function () {
			if ( this.classList?.contains( className ) ) {
				return {
					x: 0,
					y: 0,
					top: 0,
					left: 0,
					right: 0,
					bottom: layoutMeasurements.contentBottom,
					width: 0,
					height: 0,
				} as DOMRect;
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
			} as DOMRect;
		};

		Object.defineProperty( HTMLElement.prototype, 'offsetHeight', {
			configurable: true,
			// eslint-disable-next-line sitekit/acronym-case
			get( this: HTMLElement ) {
				if ( this.classList?.contains( footerClassName ) ) {
					return layoutMeasurements.footerHeight;
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

	return layoutMeasurements;
}
