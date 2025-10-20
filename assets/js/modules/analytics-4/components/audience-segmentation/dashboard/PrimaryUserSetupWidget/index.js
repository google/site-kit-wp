/**
 * PrimaryUserSetupWidget component.
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
import { useMount } from 'react-use';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import AudienceTileLoading from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceTilesWidget/AudienceTile/AudienceTileLoading';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import AudienceSegmentationErrorWidget from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSegmentationErrorWidget';
import { isInsufficientPermissionsError } from '@/js/util/errors';
import useEnableAudienceGroup from '@/js/modules/analytics-4/hooks/useEnableAudienceGroup';

export default function PrimaryUserSetupWidget( { Widget } ) {
	const { apiErrors, isSaving, failedAudiences, onEnableGroups } =
		useEnableAudienceGroup();

	const isSettingUpAudiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isSettingUpAudiences()
	);

	useMount( () => {
		if ( isSettingUpAudiences ) {
			return;
		}

		onEnableGroups();
	} );

	if ( ( apiErrors.length || failedAudiences.length ) && ! isSaving ) {
		return (
			<AudienceSegmentationErrorWidget
				Widget={ Widget }
				errors={ apiErrors }
				onRetry={ onEnableGroups }
				failedAudiences={ failedAudiences }
				showRetryButton={
					! isInsufficientPermissionsError( apiErrors[ 0 ] )
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

PrimaryUserSetupWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};
