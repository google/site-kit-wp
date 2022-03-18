/**
 * ActivateAnalyticsCTA component.
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useActivateModuleCallback from '../hooks/useActivateModuleCallback';
import Button from './Button';
import PreviewGraph from './PreviewGraph';
import VisitorsGraph from '../../svg/graphics/cta-graph-visitors.svg';
import GoalsGraph from '../../svg/graphics/cta-graph-goals.svg';

export default function ActivateAnalyticsCTA() {
	const activateModuleCallback = useActivateModuleCallback( 'analytics' );

	if ( ! activateModuleCallback ) return null;

	return (
		<div className="googlesitekit-analytics-cta">
			<div className="googlesitekit-analytics-cta__preview-graphs">
				<PreviewGraph
					title={ __(
						'Unique visitors from Search',
						'google-site-kit'
					) }
					GraphSVG={ VisitorsGraph }
				/>
				<PreviewGraph
					title={ __( 'Goals completed', 'google-site-kit' ) }
					GraphSVG={ GoalsGraph }
				/>
			</div>
			<div className="googlesitekit-analytics-cta__details">
				<p className="googlesitekit-analytics-cta--description">
					{ createInterpolateElement(
						__(
							'See how many people visit your site from Search and track how you’re achieving your goals: <strong>install Google Analytics.</strong>',
							'google-site-kit'
						),
						{
							strong: <strong />,
						}
					) }
				</p>
				<Button onClick={ activateModuleCallback }>
					{ __( 'Set up Google Analytics', 'google-site-kit' ) }
				</Button>
			</div>
		</div>
	);
}
