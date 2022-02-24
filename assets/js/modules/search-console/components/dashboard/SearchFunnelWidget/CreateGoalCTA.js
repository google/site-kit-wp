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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import Button from '../../../../../components/Button';
import PreviewGraph from './PreviewGraph';
import GoalsGraph from '../../../../../../svg/graphics/cta-graph-goals.svg';
const { useSelect } = Data;

export default function CreateGoalCTA() {
	const supportURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/1032415',
			hash: 'create_or_edit_goals',
		} )
	);

	return (
		<div className="googlesitekit-analytics-cta googlesitekit-analytics-cta--half">
			<div className="googlesitekit-analytics-cta__preview-graphs">
				<PreviewGraph
					title={ __( 'Goals completed', 'google-site-kit' ) }
					GraphSVG={ GoalsGraph }
				/>
			</div>
			<div className="googlesitekit-analytics-cta__details">
				<p className="googlesitekit-analytics-cta--description">
					{ __(
						'Set up goals to track how well your site fullfils your business objectives',
						'google-site-kit'
					) }
				</p>
				<Button href={ supportURL } target="_blank">
					{ __( 'Create a new goal', 'google-site-kit' ) }
				</Button>
			</div>
		</div>
	);
}
