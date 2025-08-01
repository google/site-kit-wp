/**
 * Content component for DataBlock.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { numFmt } from '../../util';
import Sparkline from './Sparkline';
import Badge from '../Badge';
import Change from './Change';
import SourceLink from '../SourceLink';
import Typography from '../Typography';

export default function Content( {
	title = '',
	datapoint = null,
	datapointUnit = '',
	change = null,
	changeDataUnit = '',
	period = '',
	source,
	sparkline,
	invertChangeColor = false,
	gatheringData = false,
	badge,
} ) {
	const datapointFormatted =
		datapoint === undefined
			? datapoint
			: numFmt( datapoint, datapointUnit );

	return (
		<Fragment>
			<div className="googlesitekit-data-block__title-datapoint-wrapper">
				<Typography
					as="h3"
					size="small"
					type="title"
					className="
						googlesitekit-subheading-1
						googlesitekit-data-block__title
					"
				>
					{ badge === true ? (
						<Badge
							aria-hidden="true"
							className="googlesitekit-badge--hidden"
							label="X" // This is a minimal placeholder value to provide the correct height without too much width.
						/>
					) : (
						badge
					) }
					<span className="googlesitekit-data-block__title-inner">
						{ title }
					</span>
				</Typography>

				{ ! gatheringData && (
					<div className="googlesitekit-data-block__datapoint">
						{ /* Span required for DataBlockGroup dynamic font resizing. */ }
						<span className="googlesitekit-data-block__datapoint--resize">
							{ datapointFormatted }
						</span>
					</div>
				) }
			</div>

			{ ! gatheringData && sparkline && (
				<Sparkline
					sparkline={ sparkline }
					invertChangeColor={ invertChangeColor }
				/>
			) }

			{ ! gatheringData && (
				<div className="googlesitekit-data-block__change-source-wrapper">
					<Change
						change={ change }
						changeDataUnit={ changeDataUnit }
						period={ period }
						invertChangeColor={ invertChangeColor }
					/>
					{ source && (
						<SourceLink
							className="googlesitekit-data-block__source"
							name={ source.name }
							href={ source.link }
							external={ source?.external }
						/>
					) }
				</div>
			) }
		</Fragment>
	);
}

Content.propTypes = {
	title: PropTypes.string,
	datapoint: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] ),
	datapointUnit: PropTypes.string,
	change: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] ),
	changeDataUnit: PropTypes.oneOfType( [ PropTypes.string, PropTypes.bool ] ),
	period: PropTypes.string,
	source: PropTypes.object,
	sparkline: PropTypes.element,
	invertChangeColor: PropTypes.bool,
	gatheringData: PropTypes.bool,
	badge: PropTypes.oneOfType( [ PropTypes.bool, PropTypes.node ] ),
};
