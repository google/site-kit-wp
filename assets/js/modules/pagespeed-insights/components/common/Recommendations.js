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
import Data from 'googlesitekit-data';
import {
	MODULES_PAGESPEED_INSIGHTS,
	STRATEGY_MOBILE,
	STRATEGY_DESKTOP,
} from '../../datastore/constants';
import Recommendation from './Recommendation';
const { useSelect } = Data;

export default function Recommendations( {
	className,
	referenceURL,
	strategy,
} ) {
	const finishedResolution = useSelect( ( select ) =>
		select( MODULES_PAGESPEED_INSIGHTS ).hasFinishedResolution(
			'getReport',
			[ referenceURL, strategy ]
		)
	);
	const recommendations = useSelect(
		( select ) => {
			const allAudits = select(
				MODULES_PAGESPEED_INSIGHTS
			).getAuditsWithStackPack( referenceURL, strategy, 'wordpress' );
			if ( ! allAudits || ! Object.keys( allAudits ).length ) {
				return [];
			}

			const audits = [];
			Object.keys( allAudits ).forEach( ( auditSlug ) => {
				const audit = allAudits[ auditSlug ];
				if (
					( audit.scoreDisplayMode !== 'numeric' &&
						audit.scoreDisplayMode !== 'binary' ) ||
					audit.score >= 0.9
				) {
					return;
				}

				audits.push( {
					id: audit.id,
					title: audit.title,
					displayValue: audit.displayValue,
					score: audit.score,
				} );
			} );

			return audits;
		},
		[ referenceURL, strategy, finishedResolution ]
	);

	if ( ! recommendations?.length ) {
		return null;
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

			{ recommendations.map( ( { id, title, score, displayValue } ) => (
				<Recommendation
					key={ id }
					auditID={ id }
					title={ title }
					referenceURL={ referenceURL }
					strategy={ strategy }
					score={ score }
					displayValue={ displayValue }
				/>
			) ) }
		</div>
	);
}

Recommendations.propTypes = {
	className: PropTypes.string,
	referenceURL: PropTypes.string.isRequired,
	strategy: PropTypes.oneOf( [ STRATEGY_MOBILE, STRATEGY_DESKTOP ] )
		.isRequired,
};

Recommendations.defaultProps = {
	className: '',
};
