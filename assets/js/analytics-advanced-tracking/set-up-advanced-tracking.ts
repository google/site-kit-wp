/**
 * Analytics advanced tracking logic, to be used in the frontend.
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
import { AdvancedTrackingEvent } from './types';

type SendEvent = (
	action: string,
	metadata: Record< string, unknown > | null | undefined
) => void;

/**
 * Sets up advanced tracking.
 *
 * This will for each provided event configuration add a DOM event listener that,
 * when triggered, results in a call to the provided sendEvent function.
 *
 * @since 1.18.0
 *
 * @param {Object[]} eventConfigurations List of event configuration objects. Each event object must have properties
 *                                       `action`, `on`, `selector`, and optionally `metadata`.
 * @param {Function} sendEvent           Function that handles the event. It will receive the event action as first
 *                                       parameter and the event metadata (may be `null`) as second parameter.
 * @return {Function} Returns parameter-less function to destroy the tracking, i.e. remove all added listeners.
 */
export default function setUpAdvancedTracking(
	eventConfigurations: AdvancedTrackingEvent[],
	sendEvent: SendEvent
) {
	const ownerDocument = global.document.documentElement.ownerDocument;
	const toRemove: Array< [ string, EventListener, boolean ] > = [];

	eventConfigurations.forEach( ( eventConfig ) => {
		function handleDOMEvent( domEvent: Event ) {
			if ( 'DOMContentLoaded' === eventConfig.on ) {
				sendEvent( eventConfig.action, eventConfig.metadata );
			} else if (
				matches( domEvent.target, eventConfig.selector ) ||
				matches( domEvent.target, eventConfig.selector.concat( ' *' ) )
			) {
				sendEvent( eventConfig.action, eventConfig.metadata );
			}
		}

		ownerDocument.addEventListener( eventConfig.on, handleDOMEvent, true );

		toRemove.push( [ eventConfig.on, handleDOMEvent, true ] );
	} );

	return () => {
		toRemove.forEach( ( [ type, listener, useCapture ] ) => {
			ownerDocument.removeEventListener( type, listener, useCapture );
		} );
	};
}

/**
 * Checks whether the given element matches the given selector.
 *
 * @since 1.18.0
 *
 * @param {Element} element  A DOM element.
 * @param {string}  selector A selector to check for.
 * @return {boolean} True if the DOM element matches the selector, false otherwise.
 */
function matches( element: EventTarget | null, selector: string ): boolean {
	if ( ! element ) {
		return false;
	}
	// Cast to access legacy vendor-prefixed match APIs alongside the standard one.
	const element_ = element as Element & {
		matchesSelector?: ( s: string ) => boolean;
		webkitMatchesSelector?: ( s: string ) => boolean;
		mozMatchesSelector?: ( s: string ) => boolean;
		msMatchesSelector?: ( s: string ) => boolean;
		oMatchesSelector?: ( s: string ) => boolean;
	};
	// Use fallbacks for older browsers.
	// See https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill.
	const matcher =
		element_.matches ||
		element_.matchesSelector ||
		element_.webkitMatchesSelector ||
		element_.mozMatchesSelector ||
		element_.msMatchesSelector ||
		element_.oMatchesSelector ||
		function ( this: Element & { document?: Document }, s: string ) {
			const elements = (
				this.document || this.ownerDocument
			).querySelectorAll( s );
			let index = elements.length;
			while ( --index >= 0 && elements.item( index ) !== this ) {}
			return index > -1;
		};

	if ( matcher ) {
		return matcher.call( element, selector );
	}

	return false;
}
