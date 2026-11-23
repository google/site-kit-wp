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
import { useHistory } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { ALL_SERVICES_TAB_PATH } from '@/js/components/feature-discovery/constants';
import FeatureListItem from '@/js/components/feature-discovery/FeatureListItem';
import Notifications from '@/js/components/notifications/Notifications';
import {
	CORE_FEATURE_DISCOVERY,
	SUCCEEDED_FEATURES_UI_KEY,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureDismissalKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';
import WhatsNewEmptyState from './WhatsNewEmptyState';

const WhatsNewEmptyStateWithIntersectionObserver =
	withIntersectionObserver( WhatsNewEmptyState );

const WhatsNewTab: FC = () => {
	const history = useHistory();
	const viewContext = useViewContext();

	const trackEventCategory = `${ viewContext }_whats-new`;

	const onInView = useCallback( () => {
		trackEvent( trackEventCategory, 'view_empty_state' );
	}, [ trackEventCategory ] );

	const onClickEmpty = useCallback( () => {
		trackEvent( trackEventCategory, 'click_explore_features' );
		history.push( ALL_SERVICES_TAB_PATH );
	}, [ history, trackEventCategory ] );

	// The list is held in state so that marking its features seen, which
	// changes how they sort, doesn't reorder the list under the user.
	const [ features, setFeatures ] = useState< Feature[] | undefined >();

	const whatsNewFeatures = useSelect(
		( select: Select ): Feature[] | undefined =>
			select( CORE_FEATURE_DISCOVERY ).getWhatsNewFeatures(),
		[]
	);

	const visibleFeatures = useSelect(
		( select: Select ) => {
			const succeededFeatures: string[] =
				select( CORE_UI ).getValue( SUCCEEDED_FEATURES_UI_KEY ) || [];

			return features?.filter( ( feature ) => {
				const key = getFeatureDismissalKey( feature.slug );

				if (
					select( CORE_USER ).isItemDismissed( key ) ||
					select( CORE_USER ).isDismissingItem( key )
				) {
					return false;
				}

				// A feature set up from this tab is kept only while its
				// success notice shows, and drops out once it is dismissed.
				const isConnected = select(
					CORE_FEATURE_DISCOVERY
				).isFeatureConnected( feature.slug );

				return (
					isConnected === false ||
					( isConnected === true &&
						succeededFeatures.includes( feature.slug ) )
				);
			} );
		},
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
			<div className="googlesitekit-whats-new__notifications">
				<Notifications
					areaSlug={
						NOTIFICATION_AREAS.FEATURE_DISCOVERY_WHATS_NEW_TOP
					}
					groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
				/>
			</div>
			{ visibleFeatures.length === 0 ? (
				<WhatsNewEmptyStateWithIntersectionObserver
					onClickEmpty={ onClickEmpty }
					onInView={ onInView }
				/>
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
