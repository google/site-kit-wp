/**
 * CreateGoalCTA component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import PreviewGraph from '../../../../../components/PreviewGraph';
import GoalsGraphIcon from '../../../../../../svg/graphics/cta-graph-goals.svg';
import { trackEvent } from '../../../../../util';
import useViewContext from '../../../../../hooks/useViewContext';
const { useSelect } = Data;

export default function CreateGoalCTA() {
	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_search-traffic-widget`;

	const supportURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/1032415',
			hash: 'create_or_edit_goals',
		} )
	);

	const handleOnClick = useCallback( () => {
		trackEvent( eventCategory, 'click_analytics_goal_cta' );
	}, [ eventCategory ] );

	useMount( () => {
		trackEvent( eventCategory, 'view_analytics_goal_cta' );
	} );

	return (
		<div className="googlesitekit-analytics-cta">
			<div className="googlesitekit-analytics-cta__preview-graphs">
				<PreviewGraph
					title={ __( 'Goals completed', 'google-site-kit' ) }
					GraphSVG={ GoalsGraphIcon }
				/>
			</div>
			<div className="googlesitekit-analytics-cta__details">
				<p className="googlesitekit-analytics-cta--description">
					{ __(
						'Set up goals to track how well your site fulfills your business objectives',
						'google-site-kit'
					) }
				</p>
				<Button
					href={ supportURL }
					target="_blank"
					onClick={ handleOnClick }
				>
					{ __( 'Create a new goal', 'google-site-kit' ) }
				</Button>
			</div>
		</div>
	);
}
