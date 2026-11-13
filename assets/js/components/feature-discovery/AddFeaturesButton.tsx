/**
 * AddFeaturesButton component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Typography from '@/js/components/Typography';
import { SIZE_SMALL, TYPE_LABEL } from '@/js/components/Typography/constants';
import VisuallyHidden from '@/js/components/VisuallyHidden';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { useFeature } from '@/js/hooks/useFeature';
import useViewContext from '@/js/hooks/useViewContext';
import useViewOnly from '@/js/hooks/useViewOnly';
import { trackEvent } from '@/js/util';
import PlusHeavy from '@/svg/icons/plus-heavy.svg';

const AddFeaturesButton: FC = () => {
	const featureDiscoveryHubEnabled = useFeature( 'featureDiscoveryHub' );
	const viewOnlyDashboard = useViewOnly();
	const viewContext = useViewContext();

	const instanceID = useInstanceId( AddFeaturesButton );
	const ariaDescribedBy = `googlesitekit-add-features-button-description-${ instanceID }`;

	const featuresURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getAdminURL( 'googlesitekit-features' ),
		[]
	);

	const isButtonVisible = featureDiscoveryHubEnabled && ! viewOnlyDashboard;

	// The count is `undefined` while the per-user newness state loads, which
	// leaves the dot off until it is known to be needed.
	const hasNewFeatures = useSelect(
		( select: Select ) =>
			isButtonVisible && // Skip the newness check if the button is not visible.
			select( CORE_FEATURE_DISCOVERY ).getNewFeatureCount() > 0,
		[ isButtonVisible ]
	);

	const onClick = useCallback( () => {
		trackEvent(
			`${ viewContext }_headerbar`,
			'click_add_features',
			hasNewFeatures ? 'new_features' : 'no_new_features'
		);
	}, [ hasNewFeatures, viewContext ] );

	if ( ! isButtonVisible ) {
		return null;
	}

	return (
		<div className="googlesitekit-add-features-button-wrapper">
			<a
				aria-describedby={
					hasNewFeatures ? ariaDescribedBy : undefined
				}
				className="googlesitekit-add-features-button"
				href={ featuresURL }
				onClick={ onClick }
			>
				<PlusHeavy
					className="googlesitekit-add-features-button__icon"
					width={ 13 }
					height={ 13 }
				/>
				<Typography
					className="googlesitekit-add-features-button__label"
					size={ SIZE_SMALL }
					type={ TYPE_LABEL }
				>
					{ __( 'Add features', 'google-site-kit' ) }
				</Typography>
			</a>
			{ hasNewFeatures && (
				<span
					className="googlesitekit-add-features-button__new-indicator"
					id={ ariaDescribedBy }
				>
					<VisuallyHidden>
						{ __( 'New features available', 'google-site-kit' ) }
					</VisuallyHidden>
				</span>
			) }
		</div>
	);
};

export default AddFeaturesButton;
