/**
 * CreateConversionCTA component for SearchFunnelWidgetGA4.
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
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
const { useSelect } = Data;

export default function CreateConversionCTA() {
	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_search-traffic-widget`;

	const createConversionEventsSupportURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/12844695',
		} )
	);

	const handleOnClick = useCallback( () => {
		trackEvent( eventCategory, 'click_ga4_conversions_cta' );
	}, [ eventCategory ] );

	useMount( () => {
		trackEvent( eventCategory, 'view_ga4_conversions_cta' );
	} );

	return (
		<div className="googlesitekit-analytics-cta googlesitekit-analytics-cta--setup-conversions">
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
					href={ createConversionEventsSupportURL }
					target="_blank"
					onClick={ handleOnClick }
				>
					{ __( 'Set up conversions', 'google-site-kit' ) }
				</Button>
			</div>
		</div>
	);
}
