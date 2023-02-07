/**
 * DataBlockAddons component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { numFmt } from '../util';
import ChangeArrow from './ChangeArrow';
import SourceLink from './SourceLink';

const DataBlockAddons = ( {
	sparklineComponent,
	change,
	changeDataUnit,
	period,
	invertChangeColor,
	source,
} ) => {
	let changeFormatted = change;

	// If changeDataUnit is given, try using it as currency first, otherwise add it as suffix.
	if ( changeDataUnit ) {
		if ( changeDataUnit === '%' ) {
			// Format percentage change with only 1 digit instead of the usual 2.
			changeFormatted = numFmt( change, {
				style: 'percent',
				signDisplay: 'never',
				maximumFractionDigits: 1,
			} );
		} else {
			changeFormatted = numFmt( change, changeDataUnit );
		}
	}

	// If period is given (requires %s placeholder), add it.
	if ( period ) {
		changeFormatted = sprintf( period, changeFormatted );
	}

	return (
		<Fragment>
			{ sparklineComponent && (
				<div className="googlesitekit-data-block__sparkline">
					{ sparklineComponent }
				</div>
			) }
			<div className="googlesitekit-data-block__change-source-wrapper">
				<div
					className={ classnames(
						'googlesitekit-data-block__change',
						{
							'googlesitekit-data-block__change--no-change':
								! change,
						}
					) }
				>
					<Fragment>
						{ !! change && (
							<span className="googlesitekit-data-block__arrow">
								<ChangeArrow
									direction={
										0 < parseFloat( change ) ? 'up' : 'down'
									}
									invertColor={ invertChangeColor }
								/>
							</span>
						) }
						<span className="googlesitekit-data-block__value">
							{ changeFormatted }
						</span>
					</Fragment>
				</div>
				{ source && (
					<SourceLink
						className="googlesitekit-data-block__source"
						name={ source.name }
						href={ source.link }
						external={ source?.external }
					/>
				) }
			</div>
		</Fragment>
	);
};

DataBlockAddons.propTypes = {
	sparklineComponent: PropTypes.element,
	change: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] ),
	changeDataUnit: PropTypes.oneOfType( [ PropTypes.string, PropTypes.bool ] ),
	period: PropTypes.string,
	invertChangeColor: PropTypes.bool,
	source: PropTypes.object,
};

export default DataBlockAddons;
