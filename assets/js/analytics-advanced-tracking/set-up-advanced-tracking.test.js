/**
 * Analytics advanced tracking logic tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import setUpAdvancedTracking from './set-up-advanced-tracking';

const createDOMEvent = ( on ) => {
	const event = document.createEvent( 'HTMLEvents' );
	event.initEvent( on, false, true );
	return event;
};

describe( 'setUpAdvancedTracking', () => {
	const button1DOMString = '<button class="button1">Button 1</button>';
	const button2DOMString = '<button class="button2">Button 2</button>';
	const button1EventConfig = {
		action: 'click_button_1',
		selector: '.button1',
		on: 'click',
		metadata: {
			event_category: 'engagement',
			event_label: 'Button 1',
		},
	};
	const button2EventConfig = {
		action: 'click_button_2',
		selector: '.button2',
		on: 'click',
		metadata: {
			event_category: 'engagement',
			event_label: 'Button 2',
		},
	};

	let sendEvent;
	let destroyAdvancedTracking;

	beforeEach( () => {
		sendEvent = jest.fn();
	} );

	afterEach( () => {
		if ( destroyAdvancedTracking ) {
			destroyAdvancedTracking();
			destroyAdvancedTracking = undefined;
		}
	} );

	it( 'sends basic events', () => {
		// Create DOM and set up tracking.
		document.body.innerHTML = button1DOMString + button2DOMString;
		destroyAdvancedTracking = setUpAdvancedTracking(
			[ button1EventConfig, button2EventConfig ],
			sendEvent
		);

		// Click button 2.
		document
			.querySelector( button2EventConfig.selector )
			.dispatchEvent( createDOMEvent( button2EventConfig.on ) );
		expect( sendEvent ).toHaveBeenCalledWith(
			button2EventConfig.action,
			button2EventConfig.metadata
		);

		// Click button 1.
		document
			.querySelector( button1EventConfig.selector )
			.dispatchEvent( createDOMEvent( button1EventConfig.on ) );
		expect( sendEvent ).toHaveBeenCalledWith(
			button1EventConfig.action,
			button1EventConfig.metadata
		);
	} );

	it( 'sends event without metadata', () => {
		// Create DOM and set up tracking (for only button 1).
		document.body.innerHTML = button1DOMString + button2DOMString;
		const button1EventConfigWithoutMetadata = { ...button1EventConfig };
		button1EventConfigWithoutMetadata.metadata = null;
		destroyAdvancedTracking = setUpAdvancedTracking(
			[ button1EventConfigWithoutMetadata ],
			sendEvent
		);

		// Click button 2 (nothing should happen because no event is configured).
		document
			.querySelector( button2EventConfig.selector )
			.dispatchEvent( createDOMEvent( button2EventConfig.on ) );
		expect( sendEvent ).not.toHaveBeenCalled();

		// Click button 1 (event should not have metadata).
		document
			.querySelector( button1EventConfig.selector )
			.dispatchEvent( createDOMEvent( button1EventConfig.on ) );
		expect( sendEvent ).toHaveBeenCalledWith(
			button1EventConfig.action,
			null
		);
	} );

	it( 'sends event also if injected into DOM later', () => {
		// Create DOM (without button 2) and set up tracking.
		document.body.innerHTML = button1DOMString;
		destroyAdvancedTracking = setUpAdvancedTracking(
			[ button1EventConfig, button2EventConfig ],
			sendEvent
		);

		// Inject button 2 after setting up tracking.
		document.body.innerHTML += button2DOMString;

		// Click button 2 (should result in event even though injected afterwards).
		document
			.querySelector( button2EventConfig.selector )
			.dispatchEvent( createDOMEvent( button2EventConfig.on ) );
		expect( sendEvent ).toHaveBeenCalledWith(
			button2EventConfig.action,
			button2EventConfig.metadata
		);

		// Click button 1 (as usual).
		document
			.querySelector( button1EventConfig.selector )
			.dispatchEvent( createDOMEvent( button1EventConfig.on ) );
		expect( sendEvent ).toHaveBeenCalledWith(
			button1EventConfig.action,
			button1EventConfig.metadata
		);
	} );
} );
