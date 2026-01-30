/**
 * Admin pointer tracking helpers.
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
 * Internal dependencies.
 */
import { trackEvent } from './util';

const TRACKING_KEYS = [ 'view', 'click', 'dismiss' ];

function fireTrackingEvent( eventConfig ) {
	if ( ! eventConfig || ! eventConfig.category || ! eventConfig.action ) {
		return null;
	}

	const { category, action, label } = eventConfig;
	if ( undefined !== label ) {
		return trackEvent( category, action, label );
	}

	return trackEvent( category, action );
}

function registerPointerTracking( slug, tracking ) {
	if ( ! tracking || ! Object.keys( tracking ).length ) {
		return { onDismiss: null };
	}

	const fired = TRACKING_KEYS.reduce(
		( acc, key ) => ( { ...acc, [ key ]: false } ),
		{}
	);

	function fireOnce( key ) {
		if ( fired[ key ] || ! tracking[ key ] ) {
			return null;
		}

		fired[ key ] = true;
		return fireTrackingEvent( tracking[ key ] );
	}

	// Fire view event immediately.
	fireOnce( 'view' );

	const pointerElement = document.querySelector( `.${ slug }` );
	const ownerDocument =
		( pointerElement && pointerElement.ownerDocument ) ||
		document.documentElement.ownerDocument;
	const ctaSelector = `.${ slug } .googlesitekit-pointer-cta`;

	function handleClick( event ) {
		const target = event.target instanceof Element ? event.target : null;
		if ( ! target || ! target.closest( ctaSelector ) ) {
			return;
		}

		const cta = target.closest( 'a' );
		const href = cta && cta.getAttribute( 'href' );
		const shouldDeferNavigation = href && ! cta.getAttribute( 'target' );

		if ( shouldDeferNavigation ) {
			event.preventDefault();
		}

		const track = Promise.resolve( fireOnce( 'click' ) );

		if ( shouldDeferNavigation ) {
			track.finally( () => {
				ownerDocument.defaultView.location.assign( href );
			} );
		}
	}

	ownerDocument.addEventListener( 'click', handleClick, true );

	return {
		onDismiss: () => {
			if ( fired.click ) {
				// Prevent firing dismiss if click was already fired.
				ownerDocument.removeEventListener( 'click', handleClick, true );
				return;
			}

			fireOnce( 'dismiss' );
			ownerDocument.removeEventListener( 'click', handleClick, true );
		},
	};
}

window.googlesitekitAdminPointersTracking =
	window.googlesitekitAdminPointersTracking || {};
window.googlesitekitAdminPointersTracking.register = registerPointerTracking;
