/**
 * WhatsNewTab component.
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
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import FeatureListItem from '@/js/components/feature-discovery/FeatureListItem';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureDismissalKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

const WhatsNewTab: FC = () => {
	// The list is held in state so that marking its features seen, which
	// changes how they sort, doesn't reorder the list under the user.
	const [ features, setFeatures ] = useState< Feature[] | undefined >();

	const whatsNewFeatures = useSelect(
		( select: Select ): Feature[] | undefined =>
			select( CORE_FEATURE_DISCOVERY ).getWhatsNewFeatures(),
		[]
	);

	const visibleFeatures = useSelect(
		( select: Select ) =>
			features?.filter( ( feature ) => {
				const key = getFeatureDismissalKey( feature.slug );
				return (
					! select( CORE_USER ).isItemDismissed( key ) &&
					! select( CORE_USER ).isDismissingItem( key )
				);
			} ),
		[ features ]
	);

	const { markFeaturesSeen } = useDispatch( CORE_FEATURE_DISCOVERY );

	useEffect( () => {
		if ( features !== undefined || whatsNewFeatures === undefined ) {
			return;
		}

		setFeatures( [ ...whatsNewFeatures ] );

		if ( whatsNewFeatures.length > 0 ) {
			markFeaturesSeen(
				whatsNewFeatures.map( ( feature ) => feature.slug )
			);
		}
	}, [ features, markFeaturesSeen, whatsNewFeatures ] );

	// Nothing is rendered until the list has resolved, so that the empty state
	// doesn't show in place of features that are still loading.
	if ( visibleFeatures === undefined ) {
		return <div className="googlesitekit-whats-new" />;
	}

	return (
		<div className="googlesitekit-whats-new">
			{ visibleFeatures.length === 0 ? (
				// TODO: #13327 -- Replace this placeholder with the empty
				// tab's icon, copy and CTA.
				<p className="googlesitekit-whats-new__empty-state">
					Feature Discovery Hub tab panel placeholder: nothing new to
					show.
				</p>
			) : (
				visibleFeatures.map( ( feature ) => (
					<FeatureListItem
						key={ feature.slug }
						slug={ feature.slug }
						isDismissible
						hideNewBadge
					/>
				) )
			) }
		</div>
	);
};

export default WhatsNewTab;
