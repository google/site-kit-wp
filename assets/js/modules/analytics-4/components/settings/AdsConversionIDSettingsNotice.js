/**
 * AdsConversionIDSettingsNotice component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * External dependencies
 */
// import { useIntersection } from 'react-use';
/**
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ADS_CONVERSION_ID_NOTICE_DISMISSED_ITEM_KEY } from '../../constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { DAY_IN_SECONDS, trackEvent } from '../../../../util';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import SettingsNotice, {
	TYPE_INFO,
} from '../../../../components/SettingsNotice';
import InfoCircleIcon from '../../../../../../assets/svg/icons/info-circle.svg';
import Link from '../../../../components/Link';
import useViewContext from '../../../../hooks/useViewContext';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';

const { useSelect } = Data;

/*
// This is the `useIntersection()` implementation from our version of `react-use`.
const useIntersection = ( ref, options ) => {
	const [ intersectionObserverEntry, setIntersectionObserverEntry ] =
		useState( null );

	useEffect( () => {
		if ( ref.current && typeof IntersectionObserver === 'function' ) {
			const handler = ( entries ) => {
				setIntersectionObserverEntry( entries[ 0 ] );
			};

			const observer = new IntersectionObserver( handler, options );
			observer.observe( ref.current );

			return () => {
				setIntersectionObserverEntry( null );
				observer.disconnect();
			};
		}
		return () => {};
	}, [
		ref.current,
		options.threshold,
		options.root,
		options.rootMargin,
	] );

	return intersectionObserverEntry;
};
*/

// Testing the `useIntersectionObserver()` implementation from https://usehooks-ts.com/react-hook/use-intersection-observer#api.
export function useIntersection( {
	threshold = 0,
	root = null,
	rootMargin = '0%',
	freezeOnceVisible = false,
	initialIsIntersecting = false,
	onChange,
} = {} ) {
	const [ ref, setRef ] = useState( null );

	const [ state, setState ] = useState( () => ( {
		isIntersecting: initialIsIntersecting,
		entry: undefined,
	} ) );

	const callbackRef = useRef();

	callbackRef.current = onChange;

	const frozen = state.entry?.isIntersecting && freezeOnceVisible;

	useEffect( () => {
		// Ensure we have a ref to observe
		if ( ! ref ) {
			return;
		}

		// Ensure the browser supports the Intersection Observer API
		if ( ! ( 'IntersectionObserver' in global ) ) {
			return;
		}

		// Skip if frozen
		if ( frozen ) {
			return;
		}

		let unobserve;

		const observer = new IntersectionObserver(
			( entries ) => {
				const thresholds = Array.isArray( observer.thresholds )
					? observer.thresholds
					: [ observer.thresholds ];

				entries.forEach( ( entry ) => {
					const isIntersecting =
						entry.isIntersecting &&
						thresholds.some(
							// eslint-disable-next-line no-shadow
							( threshold ) =>
								entry.intersectionRatio >= threshold
						);

					setState( { isIntersecting, entry } );

					if ( callbackRef.current ) {
						callbackRef.current( isIntersecting, entry );
					}

					if ( isIntersecting && freezeOnceVisible && unobserve ) {
						unobserve();
						unobserve = undefined;
					}
				} );
			},
			{ threshold, root, rootMargin }
		);

		observer.observe( ref );

		return () => {
			observer.disconnect();
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		ref,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		JSON.stringify( threshold ),
		root,
		rootMargin,
		frozen,
		freezeOnceVisible,
	] );

	// ensures that if the observed element changes, the intersection observer is reinitialized
	const prevRef = useRef( null );

	useEffect( () => {
		if (
			! ref &&
			state.entry?.target &&
			! freezeOnceVisible &&
			! frozen &&
			prevRef.current !== state.entry.target
		) {
			prevRef.current = state.entry.target;
			setState( {
				isIntersecting: initialIsIntersecting,
				entry: undefined,
			} );
		}
	}, [ ref, state.entry, freezeOnceVisible, frozen, initialIsIntersecting ] );

	const result = [ setRef, !! state.isIntersecting, state.entry ];

	// Support object destructuring, by adding the specific values.
	result.ref = result[ 0 ];
	result.isIntersecting = result[ 1 ];
	result.entry = result[ 2 ];

	return result;
}

export default function AdsConversionIDSettingsNotice() {
	const settingsAdminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);
	const adsConversionIDMigratedAtMs = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAdsConversionIDMigratedAtMs()
	);
	const isNoticeDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			ADS_CONVERSION_ID_NOTICE_DISMISSED_ITEM_KEY
		)
	);
	const shouldShowNotice =
		false === isNoticeDismissed && // User has not dismissed the notice.
		adsConversionIDMigratedAtMs && // Data migration has happened.
		Date.now() - adsConversionIDMigratedAtMs <= 28 * DAY_IN_SECONDS * 1000; // If it has been <= 28 days since the migration
	const viewContext = useViewContext();
	const trackDismissNotificationEvent = () => {
		trackEvent(
			`${ viewContext }_GA_Ads_redirect`,
			'dismiss_notification'
		);
	};
	const trackConfirmNotificationEvent = () => {
		trackEvent(
			`${ viewContext }_GA_Ads_redirect`,
			'confirm_notification'
		);
	};
	// const trackingRef = useRef();
	// const intersectionEntry = useIntersection( trackingRef, {
	// 	root: null,
	// 	threshold: 0.45,
	// } );
	// eslint-disable-next-line no-unused-vars
	const [ trackingRef, _, intersectionEntry ] = useIntersection( {
		threshold: 0.45,
		root: null,
	} );
	const [ hasBeenInView, setHasBeenInView ] = useState( false );
	const inView =
		!! intersectionEntry?.isIntersecting &&
		!! intersectionEntry?.intersectionRatio;

	global.intersectionEntries = global.intersectionEntries || [];
	global.intersectionEntries.push( intersectionEntry );

	useEffect( () => {
		if ( ! intersectionEntry || ! shouldShowNotice ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.info( {
			inView,
			hasBeenInView,
			isIntersecting: intersectionEntry?.isIntersecting,
		} );

		if ( inView && ! hasBeenInView ) {
			trackEvent(
				`${ viewContext }_GA_Ads_redirect`,
				'view_notification'
			);
			setHasBeenInView( true );
		}
	}, [
		hasBeenInView,
		inView,
		intersectionEntry,
		shouldShowNotice,
		viewContext,
	] );

	// eslint-disable-next-line no-console
	console.info( { shouldShowNotice } );

	// Do not show the notice if the view conditions have not been met.
	if ( ! shouldShowNotice ) {
		return null;
	}

	return (
		<SettingsNotice
			ref={ trackingRef }
			className="googlesitekit-settings-analytics-ads-conversion-id-notice"
			dismiss={ ADS_CONVERSION_ID_NOTICE_DISMISSED_ITEM_KEY }
			dismissCallback={ trackDismissNotificationEvent }
			dismissLabel={ __( 'Got it', 'google-site-kit' ) }
			type={ TYPE_INFO }
			Icon={ InfoCircleIcon }
			notice={ createInterpolateElement(
				__(
					'Ads Conversion Tracking ID has been moved to <a>Ads settings</a>',
					'google-site-kit'
				),
				{
					a: (
						<Link
							href={ `${ settingsAdminURL }#/connected-services/ads` }
							onClick={ () => trackConfirmNotificationEvent() }
						/>
					),
				}
			) }
		/>
	);
}
