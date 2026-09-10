/**
 * EffortIndicator component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import classNames from 'classnames';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_BODY } from '@/js/components/Typography/constants';
import { FEATURE_EFFORTS } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { FeatureEffort } from '@/js/googlesitekit/datastore/feature-discovery/types';
import WrenchIcon from '@/svg/icons/wrench.svg';

export interface EffortIndicatorProps {
	effort: FeatureEffort;
}

const EffortIndicator: FC< EffortIndicatorProps > = ( { effort } ) => {
	const labels: Record< FeatureEffort, string > = {
		[ FEATURE_EFFORTS.LOW ]: __( 'Just a few clicks', 'google-site-kit' ),
		[ FEATURE_EFFORTS.MEDIUM ]: __( 'A short setup', 'google-site-kit' ),
		[ FEATURE_EFFORTS.HIGH ]: __( 'In depth setup', 'google-site-kit' ),
	};

	return (
		<div className="googlesitekit-effort-indicator">
			<div
				aria-hidden="true"
				className="googlesitekit-effort-indicator__icons"
			>
				{ Object.values( FEATURE_EFFORTS ).map( ( f ) => (
					<WrenchIcon
						className={ classNames(
							'googlesitekit-effort-indicator__icon',
							{
								'googlesitekit-effort-indicator__icon--inactive':
									f > effort,
							}
						) }
						height={ 20 }
						key={ f }
						width={ 20 }
					/>
				) ) }
			</div>

			<Typography
				className="googlesitekit-effort-indicator__label"
				size={ SIZE_MEDIUM }
				type={ TYPE_BODY }
			>
				{ labels[ effort ] }
			</Typography>
		</div>
	);
};

export default EffortIndicator;
