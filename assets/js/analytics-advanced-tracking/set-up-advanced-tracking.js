/**
 * Analytics advanced tracking logic, to be used in the frontend.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Sets up advanced tracking.
 *
 * This will for each provided event configuration add a DOM event listener that,
 * when triggered, results in a call to the provided sendEvent function.
 *
 * @since n.e.x.t
 *
 * @param {Object[]} eventConfigurations List of event configuration objects. Each event object must have properties
 *                                       `action`, `on`, `selector`, and optionally `metadata`.
 * @param {Function} sendEvent           Function that handles the event. It will receive the event action as first
 *                                       parameter and the event metadata (may be `null`) as second parameter.
 * @return {Function} Returns parameter-less function to destroy the tracking, i.e. remove all added listeners.
 */
export default function setUpAdvancedTracking( eventConfigurations, sendEvent ) {
	const toRemove = [];

	eventConfigurations.forEach( ( eventConfig ) => {
		const handleDOMEvent = ( domEvent ) => {
			if ( 'DOMContentLoaded' === eventConfig.on ) {
				sendEvent( eventConfig.action, eventConfig.metadata );
			} else if ( matches( domEvent.target, eventConfig.selector ) || matches( domEvent.target, eventConfig.selector.concat( ' *' ) ) ) {
				sendEvent( eventConfig.action, eventConfig.metadata );
			}
		};

		document.addEventListener( eventConfig.on, handleDOMEvent, true );
		toRemove.push( [ eventConfig.on, handleDOMEvent, true ] );
	} );

	return () => {
		toRemove.forEach( ( listenerArgs ) => {
			document.removeEventListener( ...listenerArgs );
		} );
	};
}

/**
 * Checks whether the given element matches the given selector.
 *
 * @since n.e.x.t
 *
 * @param {Element} el       A DOM element.
 * @param {string}  selector A selector to check for.
 * @return {boolean} True if the DOM element matches the selector, false otherwise.
 */
function matches( el, selector ) {
	const matcher =
		el.matches ||
		el.webkitMatchesSelector ||
		el.mozMatchesSelector ||
		el.msMatchesSelector ||
		el.oMatchesSelector;
	if ( matcher ) {
		return matcher.call( el, selector );
	}
	return false;
}
