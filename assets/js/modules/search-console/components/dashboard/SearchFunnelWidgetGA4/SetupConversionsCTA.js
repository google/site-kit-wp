/**
 * SetupConversionsCTA component for SearchFunnelWidgetGA4.
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import PreviewGraph from '../../../../../components/PreviewGraph';
import ConversionsGraphIcon from '../../../../../../svg/graphics/cta-graph-goals.svg';
import { trackEvent } from '../../../../../util';
import useViewContext from '../../../../../hooks/useViewContext';
import { MODULES_ANALYTICS_4 } from '../../../../analytics-4/datastore/constants';
import { MODULES_ANALYTICS } from '../../../../analytics/datastore/constants';
import { escapeURI } from '../../../../../util/escape-uri';
const { useSelect } = Data;

export default function SetupConversionsCTA() {
	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_search-traffic-widget`;

	const ga4PropertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const createConversionEventsURL = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getServiceURL( {
			path: escapeURI`/a${ accountID }p${ ga4PropertyID }/admin/events/overview`,
		} )
	);

	const handleOnClick = useCallback( () => {
		trackEvent( eventCategory, 'click_analytics_conversions_cta' );
	}, [ eventCategory ] );

	useMount( () => {
		trackEvent( eventCategory, 'view_analytics_conversions_cta' );
	} );

	return (
		<div className="googlesitekit-analytics-cta">
			<div className="googlesitekit-analytics-cta__preview-graphs">
				<PreviewGraph
					title={ __( 'Conversions completed', 'google-site-kit' ) }
					GraphSVG={ ConversionsGraphIcon }
				/>
			</div>
			<div className="googlesitekit-analytics-cta__details">
				<p className="googlesitekit-analytics-cta--description">
					{ __(
						'Set up conversion events to track how well your site fulfils your business objectives.',
						'google-site-kit'
					) }
				</p>
				<Button
					href={ createConversionEventsURL }
					target="_blank"
					onClick={ handleOnClick }
				>
					{ __( 'Set up conversions', 'google-site-kit' ) }
				</Button>
			</div>
		</div>
	);
}
