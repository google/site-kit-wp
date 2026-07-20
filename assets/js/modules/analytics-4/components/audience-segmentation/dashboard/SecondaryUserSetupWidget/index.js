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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { useFeature } from '@/js/hooks/useFeature';
import AudienceSegmentationErrorWidget from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSegmentationErrorWidget';
import AudienceSegmentationSetupErrorWidget from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSegmentationSetupErrorWidget';
import { AUDIENCE_SEGMENTATION_SETUP_DISMISSED_SLUG } from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSelectionPanel/constants';
import AudienceTileLoading from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceTilesWidget/AudienceTile/AudienceTileLoading';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { isInsufficientPermissionsError } from '@/js/util/errors';

export default function SecondaryUserSetupWidget( { Widget } ) {
	const [ setupError, setSetupError ] = useState( null );
	const setupFlowRefreshPhase4Enabled = useFeature(
		'setupFlowRefreshPhase4'
	);
	const isSettingUpAudiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isSettingUpAudiences()
	);
	const { enableSecondaryUserAudienceGroup } =
		useDispatch( MODULES_ANALYTICS_4 );
	const { dismissItem } = useDispatch( CORE_USER );

	async function handleRetry() {
		setSetupError( null );
		const { error } = await enableSecondaryUserAudienceGroup();
		if ( error ) {
			setSetupError( error );
		}
	}

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
		if ( setupFlowRefreshPhase4Enabled ) {
			return (
				<AudienceSegmentationSetupErrorWidget
					Widget={ Widget }
					errors={ setupError }
					onRetry={ handleRetry }
					onDismiss={ () =>
						dismissItem(
							AUDIENCE_SEGMENTATION_SETUP_DISMISSED_SLUG
						)
					}
				/>
			);
		}

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
