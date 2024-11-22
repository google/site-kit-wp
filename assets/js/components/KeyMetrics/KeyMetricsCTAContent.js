/**
 * KeyMetricsCTAContent component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useIntersection } from 'react-use';
import { useWindowWidth } from '@react-hook/window-size/throttled';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import {
	useBreakpoint,
	BREAKPOINT_TABLET,
	BREAKPOINT_SMALL,
} from '../../hooks/useBreakpoint';
import { WEEK_IN_SECONDS, trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import { Cell, Grid, Row } from '../../material-components';
import KeyMetricsSetupDesktopSVG from './KeyMetricsSetupDesktopSVG';
import KeyMetricsSetupSmallDesktopSVG from './KeyMetricsSetupSmallDesktopSVG';
import KeyMetricsSetupTabletSVG from './KeyMetricsSetupTabletSVG';
import KeyMetricsSetupMobileSVG from './KeyMetricsSetupMobileSVG';

export default function KeyMetricsCTAContent( {
	className,
	title,
	description,
	actions,
	ga4Connected,
} ) {
	const trackingRef = useRef();
	const breakpoint = useBreakpoint();
	const onlyWidth = useWindowWidth();
	const viewContext = useViewContext();
	const isMobileBreakpoint = breakpoint === BREAKPOINT_SMALL;
	let isTabletBreakpoint =
		breakpoint === BREAKPOINT_TABLET && onlyWidth < 960;
	// onlyWidth is used directly here since BREAKPOINT_XLARGE only
	// accounts for screens that are over 1280px and current layout graphic should
	// show on the screens starting from size of 1280px and over.
	const isDesktopBreakpoint = onlyWidth >= 1280;
	// Also here, BREAKPOINT_DESKTOP accounts for screens over 960, in this particular case
	// graphic should be shown on screens starting from 960px.
	let isSmallDesktopBreakpoint = onlyWidth >= 960 && onlyWidth < 1280;

	if ( ! ga4Connected ) {
		// When 4 metrics were selected and then GA4 was disconnected
		// the full width disconnected banner can display desktop layout
		// graphic, since it has very short text.
		isTabletBreakpoint =
			breakpoint === BREAKPOINT_TABLET && onlyWidth < 800;
		isSmallDesktopBreakpoint = onlyWidth >= 800 && onlyWidth < 1280;
	}

	const intersectionEntry = useIntersection( trackingRef, {
		threshold: 0.25,
	} );
	const [ hasBeenInView, setHasBeenInView ] = useState( false );
	const inView = !! intersectionEntry?.intersectionRatio;

	const { triggerSurvey } = useDispatch( CORE_USER );

	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);

	useEffect( () => {
		if ( inView && ! hasBeenInView ) {
			if ( ga4Connected ) {
				trackEvent(
					`${ viewContext }_kmw-cta-notification`,
					'view_notification'
				);
			}

			if ( usingProxy ) {
				triggerSurvey( 'view_kmw_setup_cta', { ttl: WEEK_IN_SECONDS } );
			}

			setHasBeenInView( true );
		}
	}, [
		inView,
		viewContext,
		ga4Connected,
		hasBeenInView,
		usingProxy,
		triggerSurvey,
	] );

	return (
		<section
			ref={ trackingRef }
			className={ classnames(
				'googlesitekit-setup__wrapper',
				'googlesitekit-setup__wrapper--key-metrics-setup-cta',
				className
			) }
		>
			<Grid>
				<Row>
					<Cell
						smSize={ 5 }
						mdSize={ 6 }
						lgSize={ 5 }
						className="googlesitekit-widget-key-metrics-content__wrapper"
					>
						<div className="googlesitekit-widget-key-metrics-text__wrapper">
							<h3 className="googlesitekit-publisher-win__title">
								{ title }
							</h3>
							<p>{ description }</p>
						</div>
						<div className="googlesitekit-widget-key-metrics-actions__wrapper">
							{ actions }
						</div>
						{ isTabletBreakpoint && (
							<Cell className="googlesitekit-widget-key-metrics-svg__wrapper">
								<KeyMetricsSetupTabletSVG />
							</Cell>
						) }
						{ isMobileBreakpoint && (
							<Cell className="googlesitekit-widget-key-metrics-svg__wrapper">
								<KeyMetricsSetupMobileSVG />
							</Cell>
						) }
					</Cell>
					{ isSmallDesktopBreakpoint && (
						<Cell className="googlesitekit-widget-key-metrics-svg__wrapper">
							<KeyMetricsSetupSmallDesktopSVG />
						</Cell>
					) }
					{ isDesktopBreakpoint && (
						<Cell
							className="googlesitekit-widget-key-metrics-svg__wrapper"
							smSize={ 6 }
							mdSize={ 3 }
							lgSize={ 6 }
						>
							<KeyMetricsSetupDesktopSVG />
						</Cell>
					) }
				</Row>
			</Grid>
		</section>
	);
}

KeyMetricsCTAContent.propTypes = {
	title: PropTypes.string,
	description: PropTypes.string,
	actions: PropTypes.node,
};
