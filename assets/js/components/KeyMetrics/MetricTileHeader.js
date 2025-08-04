/**
 * MetricTileHeader component.
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
 * Internal dependencies
 */
import InfoTooltip from '../InfoTooltip';
import VisuallyHidden from '../VisuallyHidden';
import Typography from '../Typography';

export default function MetricTileHeader( { title, infoTooltip, loading } ) {
	return (
		<div className="googlesitekit-km-widget-tile__title-container">
			<Typography
				as="h3"
				size="small"
				type="label"
				className="googlesitekit-km-widget-tile__title"
			>
				{ title }
			</Typography>
			{ loading ? (
				<VisuallyHidden>
					<InfoTooltip title={ infoTooltip } />
				</VisuallyHidden>
			) : (
				<InfoTooltip title={ infoTooltip } />
			) }
		</div>
	);
}

MetricTileHeader.propTypes = {
	title: PropTypes.string,
	infoTooltip: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	loading: PropTypes.bool,
};
