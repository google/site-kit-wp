/**
 * ConversionInsightBanner component.
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import PreviewBlock from '@/js/components/PreviewBlock';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import CloseIcon from '@/svg/icons/close.svg';
import MagnifyingGlassIcon from '@/svg/icons/magnifying-glass.svg';
import { useConversionInsight } from './useConversionInsight';
import { useConversionInsightEvents } from './useConversionInsightEvents';

interface ConversionInsightBannerProps {
	/** The goal type this banner belongs to (e.g. `lead`, `ecommerce`). Scopes dismissal. */
	goalType: string;
	/** The GA4 key event names to analyze (the request batch). */
	keyEventNames: string[];
	/** Which event's insight to render. Defaults to the first key event. */
	displayKeyEventName?: string;
}

/**
 * Renders the AI-generated Conversion Insight for a Site Goals widget: a
 * dismissible banner summarizing the goal's recent trend. It fetches and
 * preprocesses its own GA4 data on the client (see `useConversionInsightEvents`).
 *
 * Fails soft — while the service endpoint is unavailable (the expected state
 * during the POC) the request errors and the banner renders nothing.
 *
 * @since n.e.x.t
 *
 * @param {Object}   props                       Component props.
 * @param {string}   props.goalType              Goal type this banner belongs to (scopes dismissal).
 * @param {string[]} props.keyEventNames         The GA4 key event names to analyze.
 * @param {string}   [props.displayKeyEventName] Which event's insight to render.
 * @return {JSX.Element|null} The banner, or `null` when there is nothing to show.
 */
export default function ConversionInsightBanner( {
	goalType,
	keyEventNames,
	displayKeyEventName,
}: ConversionInsightBannerProps ): JSX.Element | null {
	const dismissSlug = `site-goals-conversion-insight-${ goalType }`;

	const isDismissed = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed( dismissSlug ),
		[ dismissSlug ]
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const {
		events,
		isLoading: reportsLoading,
		error: reportsError,
	} = useConversionInsightEvents( keyEventNames );

	const displayName = displayKeyEventName ?? keyEventNames[ 0 ];

	const {
		insight,
		isLoading: insightLoading,
		error: insightError,
	} = useConversionInsight( events, displayName );

	const handleDismiss = useCallback( () => {
		dismissItem( dismissSlug );
	}, [ dismissItem, dismissSlug ] );

	// Don't flash while the dismissal state is unknown, and stay hidden once dismissed.
	if ( isDismissed !== false ) {
		return null;
	}

	// Nothing to analyze (no key events configured), so there's no banner.
	if ( ! keyEventNames.length ) {
		return null;
	}

	// Fail soft: a failed request (reports or the endpoint not being live) shows nothing.
	if ( reportsError || insightError ) {
		return null;
	}

	const hasEvents = !! events && !! displayName;
	const loading =
		reportsLoading ||
		( hasEvents && ( insightLoading || insight === undefined ) );

	// Resolved with no insight for this event: render nothing.
	if ( ! loading && ! insight ) {
		return null;
	}

	return (
		<div
			className="googlesitekit-conversion-insight"
			data-scenario={ insight?.code }
		>
			<div className="googlesitekit-conversion-insight__icon">
				<MagnifyingGlassIcon width={ 20 } height={ 20 } />
			</div>
			<div className="googlesitekit-conversion-insight__content">
				{ loading ? (
					<PreviewBlock width="60%" height="16px" />
				) : (
					<p className="googlesitekit-conversion-insight__text">
						{ insight?.text }
					</p>
				) }
			</div>
			{ ! loading && (
				<button
					type="button"
					className="googlesitekit-conversion-insight__dismiss"
					onClick={ handleDismiss }
					aria-label={ __( 'Dismiss insight', 'google-site-kit' ) }
				>
					<CloseIcon width={ 14 } height={ 14 } />
				</button>
			) }
		</div>
	);
}
