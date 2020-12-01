/**
 * Recommendations component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Data from 'googlesitekit-data';
import { STORE_NAME, STRATEGY_MOBILE, STRATEGY_DESKTOP } from '../../datastore/constants';
import Recommendation from './Recommendation';
const { useSelect } = Data;

export default function Recommendations( { referenceURL, strategy } ) {
	const finishedResolution = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ referenceURL, strategy ] ) );
	const recommendations = useSelect( ( select ) => {
		const allAudits = select( STORE_NAME ).getAudits( referenceURL, strategy, true );
		if ( ! allAudits || ! Object.keys( allAudits ).length ) {
			return [];
		}

		const audits = [];
		Object.keys( allAudits ).forEach( ( auditSlug ) => {
			const audit = allAudits[ auditSlug ];

			if ( ( audit.scoreDisplayMode !== 'numeric' && audit.scoreDisplayMode !== 'binary' ) || audit.score >= .9 ) {
				return;
			}

			audits.push( {
				id: audit.id,
				title: audit.title,
			} );
		} );

		return audits;
	}, [ referenceURL, strategy, finishedResolution ] );

	if ( ! recommendations?.length ) {
		return null;
	}

	return (
		<div className="googlesitekit-pagespeed--recommendations">
			<div className="googlesitekit-pagespeed-recommendations__title">
				{ __( 'Recommendations on how to improve your site', 'google-site-kit' ) }
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
	referenceURL: PropTypes.string.isRequired,
	strategy: PropTypes.oneOf( [ STRATEGY_MOBILE, STRATEGY_DESKTOP ] ).isRequired,
};
