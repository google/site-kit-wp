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
	let oldHistory;

	const locationAssignMock = jest.fn();

	const historyReplaceStateMock = jest.fn( ( state, title, url ) => {
		global.location.href = url;
	} );

	beforeAll( () => {
		oldLocation = global.location;
		oldHistory = global.history;

		delete global.location;
		delete global.history;

		global.location = Object.defineProperties(
			{},
			{
				assign: {
					configurable: true,
					value: locationAssignMock,
				},
				href: {
					configurable: true,
					writable: true,
					value: '',
				},
			}
		);

		global.history = {
			replaceState: historyReplaceStateMock,
		};
	} );

	afterAll( () => {
		global.location = oldLocation;
		global.history = oldHistory;
	} );

	beforeEach( () => {
		locationAssignMock.mockReset();
		historyReplaceStateMock.mockClear();
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

/**
 * Mocks the `scrollIntoView` method that is missing from the jsdom environment. Sets up in beforeAll and tears down in afterAll.
 *
 * @since 1.179.0
 */
export function mockBrowserScrolling() {
	let oldScrollIntoView;

	beforeAll( () => {
		oldScrollIntoView = Element.prototype.scrollIntoView;

		Element.prototype.scrollIntoView = jest.fn();
	} );

	afterAll( () => {
		Element.prototype.scrollIntoView = oldScrollIntoView;
	} );

	beforeEach( () => {
		Element.prototype.scrollIntoView.mockReset();
	} );
}

/**
 * Mocks the `IntersectionObserver` API in jsdom and provides helpers to
 * inspect observed elements and simulate intersection changes.
 *
 * Sets up in beforeAll, resets observer state in beforeEach, and restores in
 * afterAll.
 *
 * @since 1.186.0
 *
 * @return {{
 *   getObservedElements: function(): Element[],
 *   simulateIntersection: function(Element, boolean=): void,
 *   simulateAllIntersections: function(boolean=): void,
 * }} Intersection observer test helpers.
 */
export function mockIntersectionObserver() {
	let oldIntersectionObserver;
	let observers = [];

	function createEntry( target, isIntersecting ) {
		return {
			isIntersecting,
			intersectionRatio: isIntersecting ? 1 : 0,
			target,
		};
	}

	beforeAll( () => {
		oldIntersectionObserver = global.IntersectionObserver;

		global.IntersectionObserver = function MockIntersectionObserver(
			callback
		) {
			this.observe = function observe( target ) {
				observers.push( { callback, target } );
			};
			this.disconnect = jest.fn();
			this.unobserve = jest.fn();
			this.takeRecords = jest.fn().mockReturnValue( [] );
		};
	} );

	beforeEach( () => {
		observers = [];
	} );

	afterAll( () => {
		if ( typeof oldIntersectionObserver === 'undefined' ) {
			delete global.IntersectionObserver;
			return;
		}

		global.IntersectionObserver = oldIntersectionObserver;
	} );

	return {
		getObservedElements: () =>
			observers.map( ( observer ) => observer.target ),
		simulateIntersection: ( target, isIntersecting = true ) => {
			const observer = observers.find(
				( currentObserver ) => currentObserver.target === target
			);

			if ( ! observer ) {
				return;
			}

			observer.callback(
				[ createEntry( target, isIntersecting ) ],
				{} // This argument is unused by code under test.
			);
		},
		simulateAllIntersections: ( isIntersecting = true ) => {
			observers.forEach( ( observer ) => {
				observer.callback(
					[ createEntry( observer.target, isIntersecting ) ],
					{} // This argument is unused by code under test.
				);
			} );
		},
	};
}
