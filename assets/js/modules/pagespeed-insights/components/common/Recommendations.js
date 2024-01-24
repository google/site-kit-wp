/**
 * Recommendations component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STRATEGY_MOBILE, STRATEGY_DESKTOP } from '../../datastore/constants';
import ZeroRecommendations from '../../../../../svg/graphics/zero-state-yellow.svg';
import Recommendation from './Recommendation';
import { Cell, Grid, Row } from '../../../../material-components';

export default function Recommendations( {
	className,
	recommendations,
	referenceURL,
	strategy,
} ) {
	if ( ! recommendations?.length ) {
		return (
			<Grid>
				<Row>
					<Cell>
						{ __(
							'No recommendations for now',
							'google-site-kit'
						) }
					</Cell>
					<Cell className="googlesitekit-pagespeed__zero-recommendations">
						<ZeroRecommendations />
					</Cell>
				</Row>
			</Grid>
		);
	}

	return (
		<div
			className={ classNames(
				'googlesitekit-pagespeed--recommendations',
				className
			) }
		>
			<div className="googlesitekit-pagespeed-recommendations__title">
				{ __(
					'Recommendations on how to improve your site',
					'google-site-kit'
				) }
			</div>

			{ recommendations.map( ( { id, title } ) => (
				<Recommendation
					key={ id }
					auditID={ id }
					title={ title }
					referenceURL={ referenceURL }
					strategy={ strategy }
				/>
			) ) }
		</div>
	);
}

Recommendations.propTypes = {
	className: PropTypes.string,
	recommendations: PropTypes.arrayOf( PropTypes.object ),
	referenceURL: PropTypes.string.isRequired,
	strategy: PropTypes.oneOf( [ STRATEGY_MOBILE, STRATEGY_DESKTOP ] )
		.isRequired,
};

Recommendations.defaultProps = {
	className: '',
};
