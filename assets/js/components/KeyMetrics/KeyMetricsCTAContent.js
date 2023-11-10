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

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { BREAKPOINT_SMALL, useBreakpoint } from '../../hooks/useBreakpoint';
import { DAY_IN_SECONDS, trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import { Cell, Grid, Row } from '../../material-components';
import GhostCardsSVG from './GhostCards';

const { useDispatch, useSelect } = Data;

export default function KeyMetricsCTAContent( {
	className,
	title,
	description,
	actions,
	ga4Connected,
} ) {
	const trackingRef = useRef();
	const breakpoint = useBreakpoint();
	const viewContext = useViewContext();
	const isMobileBreakpoint = breakpoint === BREAKPOINT_SMALL;

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
				triggerSurvey( 'view_kmw_setup_cta', { ttl: DAY_IN_SECONDS } );
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
					<Cell smSize={ 6 } mdSize={ 5 } lgSize={ 6 }>
						<div className="googlesitekit-widget-key-metrics-text__wrapper">
							<h3 className="googlesitekit-publisher-win__title">
								{ title }
							</h3>
							<p>{ description }</p>
						</div>
						{ isMobileBreakpoint && (
							<Cell className="googlesitekit-widget-key-metrics-svg__wrapper">
								<GhostCardsSVG />
							</Cell>
						) }
						<div className="googlesitekit-widget-key-metrics-actions__wrapper">
							{ actions }
						</div>
					</Cell>
					{ ! isMobileBreakpoint && (
						<Cell
							className="googlesitekit-widget-key-metrics-svg__wrapper"
							smSize={ 6 }
							mdSize={ 3 }
							lgSize={ 6 }
						>
							<GhostCardsSVG />
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
