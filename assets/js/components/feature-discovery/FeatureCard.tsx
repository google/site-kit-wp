/**
 * FeatureCard component.
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
import classnames from 'classnames';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { Select, useSelect } from 'googlesitekit-data';
import Typography from '@/js/components/Typography';
import {
	SIZE_LARGE,
	SIZE_MEDIUM,
	TYPE_TITLE,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import CloseIcon from '@/svg/icons/close.svg';
import EffortIndicator from './EffortIndicator';
import FeatureBadges from './FeatureBadges';
import FeatureServiceIdentity from './FeatureServiceIdentity';

const UNREAD_DOT_DELAY_MS = 3000;

export interface FeatureCardProps {
	slug: string;
	isDismissible?: boolean;
	hideNewBadge?: boolean;
	hideUnreadDot?: boolean;
}

const FeatureCard: FC< FeatureCardProps > = ( {
	slug,
	isDismissible = false,
	hideNewBadge = false,
	hideUnreadDot = false,
} ) => {
	const feature = useSelect(
		( select: Select ): Feature | null =>
			select( CORE_FEATURE_DISCOVERY ).getFeature( slug ),
		[ slug ]
	);
	const isFeatureUnread = useSelect(
		( select: Select ) =>
			select( CORE_FEATURE_DISCOVERY ).isFeatureUnread?.( slug ) === true,
		[ slug ]
	);

	const [ isUnreadDotVisible, setIsUnreadDotVisible ] =
		useState( isFeatureUnread );

	useEffect( () => {
		if ( isFeatureUnread ) {
			setIsUnreadDotVisible( true );
			return undefined;
		}

		const visibilityTimeout = setTimeout( () => {
			setIsUnreadDotVisible( false );
		}, UNREAD_DOT_DELAY_MS );

		return () => {
			clearTimeout( visibilityTimeout );
		};
	}, [ isFeatureUnread ] );

	if ( ! feature ) {
		return null;
	}

	const { effort, shortDescription, title } = feature;

	return (
		<article className="googlesitekit-feature-card">
			<div className="googlesitekit-feature-card__title-row">
				{ ! hideUnreadDot && (
					<span
						className={ classnames(
							'googlesitekit-feature-card__unread-dot',
							{
								'googlesitekit-feature-card__unread-dot--visible':
									isUnreadDotVisible,
							}
						) }
						aria-hidden="true"
					/>
				) }
				<Typography
					as="h3"
					className="googlesitekit-feature-card__title"
					size={ SIZE_LARGE }
					type={ TYPE_TITLE }
				>
					{ title }
				</Typography>
				<FeatureBadges slug={ slug } hideNewBadge={ hideNewBadge } />
				{ isDismissible && (
					<Button
						// @ts-expect-error - The `Button` component is not typed yet.
						className="googlesitekit-button-icon googlesitekit-feature-card__dismiss"
						icon={ <CloseIcon width={ 14 } height={ 14 } /> }
						aria-label={ sprintf(
							/* translators: %s: feature name */
							__( 'Dismiss %s', 'google-site-kit' ),
							title
						) }
						text
					/>
				) }
			</div>

			<P
				className="googlesitekit-feature-card__description"
				size={ SIZE_MEDIUM }
			>
				{ shortDescription }
			</P>

			<EffortIndicator effort={ effort } />

			<div className="googlesitekit-feature-card__action-row">
				<FeatureServiceIdentity slug={ slug } />
				<div className="googlesitekit-feature-card__actions">
					<span className="googlesitekit-feature-card__cta-placeholder">
						{ __( 'Feature CTA', 'google-site-kit' ) }
					</span>
					{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
					<Button tertiary>
						{ __( 'Read more', 'google-site-kit' ) }
					</Button>
				</div>
			</div>
		</article>
	);
};

export default FeatureCard;
