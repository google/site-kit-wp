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
import { Suspense, lazy, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import FeatureListItem from '@/js/components/feature-discovery/FeatureListItem';
import MediaErrorHandler from '@/js/components/MediaErrorHandler';
import PreviewBlock from '@/js/components/PreviewBlock';
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_HEADLINE,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';

const LazyWhatsNewEmptySVG = lazy(
	() => import( '../../../../svg/graphics/whats-new-empty.svg' )
);

function useNavigate() {
	const history = useHistory();

	return ( path: string ) => history.push( path );
}

const WhatsNewTab: FC = () => {
	const navigate = useNavigate();

	function onClickEmpty() {
		navigate( '/all-services' );
	}

	// The list is held in state so that marking its features seen, which
	// changes how they sort, doesn't reorder the list under the user.
	const [ features, setFeatures ] = useState< Feature[] | undefined >();

	const whatsNewFeatures = useSelect(
		( select: Select ): Feature[] | undefined =>
			select( CORE_FEATURE_DISCOVERY ).getWhatsNewFeatures(),
		[]
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
	if ( features === undefined ) {
		return <div className="googlesitekit-whats-new" />;
	}

	return (
		<div className="googlesitekit-whats-new">
			{ features.length === 0 ? (
				<div className="googlesitekit-whats-new__empty-state">
					<Suspense
						fallback={
							<PreviewBlock width="179px" height="193px" />
						}
					>
						<MediaErrorHandler
							errorMessage={ __(
								'Failed to load graphic',
								'google-site-kit'
							) }
						>
							<LazyWhatsNewEmptySVG aria-hidden="true" />
						</MediaErrorHandler>
					</Suspense>

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
				features.map( ( feature ) => (
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
