/**
 * WP Dashboard ActivateAnalyticsCTA component.
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
import TrafficGraph from '../../../svg/graphics/cta-graph-traffic.svg';
import MostPopularContent from '../../../svg/graphics/cta-most-popular-content.svg';
import AnalyticsCTA from '../ActivateAnalyticsCTA';
import PreviewGraph from '../PreviewGraph';

export default function WPDashboardActivateAnalyticsCTA() {
	return (
		<AnalyticsCTA>
			<PreviewGraph
				title={ __( 'Traffic', 'google-site-kit' ) }
				GraphSVG={ TrafficGraph }
				showIcons={ false }
			/>
			<PreviewGraph
				title={ __( 'Most popular content', 'google-site-kit' ) }
				GraphSVG={ MostPopularContent }
				showIcons={ false }
			/>
		</AnalyticsCTA>
	);
}
