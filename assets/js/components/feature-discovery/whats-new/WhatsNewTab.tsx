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
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import FeatureListItem from '@/js/components/feature-discovery/FeatureListItem';
import Notifications from '@/js/components/notifications/Notifications';
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_HEADLINE,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureDismissalKey } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';
import whatsNewEmptyURL from '@/svg/graphics/whats-new-empty.svg?path';

const WhatsNewTab: FC = () => {
	const history = useHistory();

	function onClickEmpty() {
		history.push( '/all-services' );
	}

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
			<div className="googlesitekit-whats-new__notifications">
				<Notifications
					areaSlug={
						NOTIFICATION_AREAS.FEATURE_DISCOVERY_WHATS_NEW_TOP
					}
					groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
				/>
			</div>
			{ visibleFeatures.length === 0 ? (
				<div className="googlesitekit-whats-new__empty-state">
					<img
						src={ whatsNewEmptyURL }
						alt=""
						width={ 189 }
						height={ 193 }
					/>

					<Typography
						as="h2"
						className="googlesitekit-whats-new__empty-state-heading"
						size={ SIZE_SMALL }
						type={ TYPE_HEADLINE }
					>
						{ __( 'You’re up to date!', 'google-site-kit' ) }
					</Typography>

					<P
						className="googlesitekit-whats-new__empty-state-description"
						size={ SIZE_MEDIUM }
					>
						{ __(
							'There are no new feature announcements right now, but you can explore other features that will help you grow your site',
							'google-site-kit'
						) }
					</P>

					{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
					<Button
						className="googlesitekit-whats-new__empty-state-button"
						onClick={ onClickEmpty }
					>
						{ __( 'Explore features', 'google-site-kit' ) }
					</Button>
				</div>
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
