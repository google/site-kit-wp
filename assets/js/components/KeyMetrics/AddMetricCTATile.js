/**
 * AddMetricCTATile component.
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
import propTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { useIntersection } from 'react-use';
import { __ } from '@wordpress/i18n';
import { ENTER, SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from './constants';
import PlusIcon from '../../../svg/icons/plus.svg';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';

export default function AddMetricCTATile( { Widget } ) {
	const trackingRef = useRef();
	const { setValue } = useDispatch( CORE_UI );
	const viewContext = useViewContext();
	const trackingCategory = `${ viewContext }_kmw`;

	const openMetricsSelectionPanel = useCallback(
		( event ) => {
			if (
				event.type === 'keydown' &&
				! [ ENTER, SPACE ].includes( event.keyCode )
			) {
				return;
			}

			// Prevent scroll when spacebar is hit.
			event.preventDefault();

			setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, true );
			trackEvent( trackingCategory, 'add_metric_click' );
		},
		[ setValue, trackingCategory ]
	);

	const intersectionEntry = useIntersection( trackingRef, {
		threshold: 0.25,
	} );
	const [ hasBeenInView, setHasBeenInView ] = useState( false );
	const inView = !! intersectionEntry?.intersectionRatio;

	useEffect( () => {
		if ( inView && ! hasBeenInView ) {
			trackEvent( trackingCategory, 'add_metric_view' );

			setHasBeenInView( true );
		}
	}, [ inView, trackingCategory, hasBeenInView ] );

	return (
		<Widget className="googlesitekit-widget--addMetricCTATile" noPadding>
			<div
				ref={ trackingRef }
				className="googlesitekit-km-add-metric-cta-tile"
				onClick={ openMetricsSelectionPanel }
				onKeyDown={ openMetricsSelectionPanel }
				tabIndex={ 0 }
				role="button"
			>
				<div className="googlesitekit-km-add-metric-cta-tile__icon">
					<PlusIcon width={ 16 } height={ 16 } />
				</div>
				<p className="googlesitekit-km-add-metric-cta-tile__text">
					{ __( 'Add a metric', 'google-site-kit' ) }
				</p>
			</div>
		</Widget>
	);
}

AddMetricCTATile.propTypes = {
	Widget: propTypes.elementType.isRequired,
};
