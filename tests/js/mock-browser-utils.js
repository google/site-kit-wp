/**
 * Mock browser utils.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * Creates a mock global location object. Sets up in beforeAll and tears down in afterAll.
 *
 * @since 1.70.0
 */
export function mockLocation() {
	let oldLocation;
	const locationAssignMock = jest.fn();

	beforeAll( () => {
		oldLocation = global.location;
		delete global.location;
		global.location = Object.defineProperties(
			{},
			{
				assign: {
					configurable: true,
					value: locationAssignMock,
				},
			}
		);
	} );

	afterAll( () => {
		global.location = oldLocation;
	} );

	beforeEach( () => {
		locationAssignMock.mockReset();
	} );
}

/**
 * Mocks the offset properties of an element. Sets up in beforeAll and tears down in afterAll.
 *
 * Based on https://github.com/jsdom/jsdom/issues/135#issuecomment-68191941, thanks to the original author.
 *
 * @since 1.98.0
 */
export function mockElementOffsets() {
	let restoreElementOffsets;

	beforeAll( () => {
		const oldOffsetLeft = Object.getOwnPropertyDescriptor(
			global.HTMLElement.prototype,
			'offsetLeft'
		);
		const oldOffsetTop = Object.getOwnPropertyDescriptor(
			global.HTMLElement.prototype,
			'offsetTop'
		);
		const oldOffsetHeight = Object.getOwnPropertyDescriptor(
			global.HTMLElement.prototype,
			'offsetHeight'
		);
		const oldOffsetWidth = Object.getOwnPropertyDescriptor(
			global.HTMLElement.prototype,
			'offsetWidth'
		);

		restoreElementOffsets = () => {
			Object.defineProperties( global.HTMLElement.prototype, {
				offsetLeft: oldOffsetLeft,
				offsetTop: oldOffsetTop,
				offsetHeight: oldOffsetHeight,
				offsetWidth: oldOffsetWidth,
			} );
		};

		function createGetterDefinitionFor( property ) {
			return {
				get() {
					return (
						parseFloat(
							global.getComputedStyle( this )[ property ]
						) || 0
					);
				},
			};
		}

		Object.defineProperties( global.HTMLElement.prototype, {
			offsetLeft: createGetterDefinitionFor( 'marginLeft' ),
			offsetTop: createGetterDefinitionFor( 'marginTop' ),
			offsetHeight: createGetterDefinitionFor( 'height' ),
			offsetWidth: createGetterDefinitionFor( 'width' ),
		} );
	} );

	afterAll( () => {
		restoreElementOffsets();
	} );
}
