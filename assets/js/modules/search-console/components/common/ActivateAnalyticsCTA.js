/**
 * Search Funnel Widget ActivateAnalyticsCTA component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import VisitorsGraph from '../../../../../svg/graphics/cta-graph-visitors.svg';
import GoalsGraph from '../../../../../svg/graphics/cta-graph-goals.svg';
import AnalyticsCTA from '../../../../components/ActivateAnalyticsCTA';
import PreviewGraph from '../../../../components/PreviewGraph';

export default function ActivateAnalyticsCTA( { title } ) {
	return (
		<AnalyticsCTA>
			<PreviewGraph
				title={ __( 'Unique visitors from Search', 'google-site-kit' ) }
				GraphSVG={ VisitorsGraph }
			/>
			<PreviewGraph title={ title } GraphSVG={ GoalsGraph } />
		</AnalyticsCTA>
	);
}

ActivateAnalyticsCTA.propTypes = {
	title: PropTypes.string.isRequired,
};
