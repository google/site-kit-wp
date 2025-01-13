/**
 * SecondaryUserSetupWidget component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import AudienceTileLoading from '../AudienceTilesWidget/AudienceTile/AudienceTileLoading';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import AudienceSegmentationErrorWidget from '../AudienceSegmentationErrorWidget';
import { isInsufficientPermissionsError } from '../../../../../../util/errors';

export default function SecondaryUserSetupWidget( { Widget } ) {
	const [ setupError, setSetupError ] = useState( null );
	const isSettingUpAudiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isSettingUpAudiences()
	);
	const { enableSecondaryUserAudienceGroup } =
		useDispatch( MODULES_ANALYTICS_4 );

	const handleRetry = async () => {
		setSetupError( null );
		const { error } = await enableSecondaryUserAudienceGroup();
		if ( error ) {
			setSetupError( error );
		}
	};

	useMount( () => {
		if ( isSettingUpAudiences ) {
			return;
		}

		( async () => {
			const { error } = await enableSecondaryUserAudienceGroup();
			if ( error ) {
				setSetupError( error );
			}
		} )();
	} );

	if ( setupError ) {
		return (
			<AudienceSegmentationErrorWidget
				Widget={ Widget }
				errors={ setupError }
				onRetry={ handleRetry }
				showRetryButton={
					! isInsufficientPermissionsError( setupError )
				}
			/>
		);
	}

	return (
		<Widget className="googlesitekit-widget-audience-tiles" noPadding>
			<div className="googlesitekit-widget-audience-tiles__body">
				<Widget noPadding>
					<AudienceTileLoading />
				</Widget>
				<Widget noPadding>
					<AudienceTileLoading />
				</Widget>
			</div>
		</Widget>
	);
}

SecondaryUserSetupWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};
