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
import { FC, useCallback } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Badge from '@/js/components/Badge';
import EffortIndicator from '@/js/components/feature-discovery/EffortIndicator';
import Link from '@/js/components/Link';
import FeedbackMenu, {
	FeedbackMenuOption,
} from '@/js/components/surveys/FeedbackMenu';
import Typography from '@/js/components/Typography';
import {
	SIZE_LARGE,
	SIZE_MEDIUM,
	TYPE_BODY,
	TYPE_TITLE,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_BADGES,
	FEATURE_BADGE_PROPS,
	FEATURE_RELEVANCY_REASONS,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { getFeatureRelevancyTriggerID } from '@/js/googlesitekit/datastore/feature-discovery/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import SiteKitIcon from '@/svg/graphics/logo-g.svg';
import CloseIcon from '@/svg/icons/close.svg';

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
	const [ showUnreadDot, setShowUnreadDot ] = useState( false );
	const [ isFeedbackMenuOpen, setIsFeedbackMenuOpen ] = useState( false );
	const dismissButtonRef = useRef< HTMLButtonElement >( null );
	const menuWrapperRef = useRef< HTMLDivElement >( null );
	const menuID = useInstanceId(
		FeatureCard,
		'feature-feedback-menu'
	) as string;
	const { dismissFeature } = useDispatch( CORE_FEATURE_DISCOVERY );
	const { triggerSurvey } = useDispatch( CORE_USER );

	const feedbackOptions = useMemo< FeedbackMenuOption[] >(
		() => [
			{
				id: FEATURE_RELEVANCY_REASONS.JUST_HIDE,
				label: __( 'Just hide this suggestion', 'google-site-kit' ),
			},
			{
				id: FEATURE_RELEVANCY_REASONS.NOT_RELEVANT,
				label: __(
					"It’s not relevant to my site goals",
					'google-site-kit'
				),
				value: getFeatureRelevancyTriggerID(
					slug,
					FEATURE_RELEVANCY_REASONS.NOT_RELEVANT
				),
			},
			{
				id: FEATURE_RELEVANCY_REASONS.ALREADY_USING,
				label: __(
					"I’m already using another tool",
					'google-site-kit'
				),
				value: getFeatureRelevancyTriggerID(
					slug,
					FEATURE_RELEVANCY_REASONS.ALREADY_USING
				),
			},
			{
				id: FEATURE_RELEVANCY_REASONS.TOO_COMPLICATED,
				label: __( 'Setup seems complex', 'google-site-kit' ),
				value: getFeatureRelevancyTriggerID(
					slug,
					FEATURE_RELEVANCY_REASONS.TOO_COMPLICATED
				),
			},
		],
		[ slug ]
	);

	const onCloseFeedbackMenu = useCallback( () => {
		setIsFeedbackMenuOpen( false );
	}, [] );

	const onSelectFeedback = useCallback(
		( value: string | undefined ) => {
			dismissFeature( slug );

			if ( value ) {
				// Feedback is independent of dismissal and must not delay it.
				triggerSurvey( value );
			}
		},
		[ dismissFeature, slug, triggerSurvey ]
	);

	const isFeatureNew = useSelect(
		( select: Select ) =>
			select( CORE_FEATURE_DISCOVERY ).isFeatureNew( slug ) === true,
		[ slug ]
	);

	const isFeatureUnread = useSelect(
		( select: Select ) =>
			select( CORE_FEATURE_DISCOVERY ).isFeatureUnread( slug ) === true,
		[ slug ]
	);

	const feature = useSelect(
		( select: Select ): Feature | null =>
			select( CORE_FEATURE_DISCOVERY ).getFeature( slug ),
		[ slug ]
	);

	const module = useSelect(
		( select: Select ) =>
			feature?.moduleSlug
				? select( CORE_MODULES ).getModule( feature.moduleSlug )
				: undefined,
		[ feature ]
	);

	const ModuleIcon = module?.Icon || SiteKitIcon;

	const moduleName =
		module?.name || __( 'Site Kit feature', 'google-site-kit' );

	const onClickDismiss = useCallback( () => {
		setIsFeedbackMenuOpen( ( isOpen ) => ! isOpen );
	}, [] );

	const onClickReadMore = useCallback( () => {
		// TODO: #13330 -- Implement feature detail panel shell.
	}, [] );

	useEffect( () => {
		if ( isFeatureUnread ) {
			setShowUnreadDot( true );
			return undefined;
		}

		const visibilityTimeout = setTimeout( () => {
			setShowUnreadDot( false );
		}, 3000 );

		return () => {
			clearTimeout( visibilityTimeout );
		};
	}, [ isFeatureUnread ] );

	if ( ! feature ) {
		return null;
	}

	const { title, shortDescription, effort, badges = [] } = feature;

	const userBadges =
		isFeatureNew && ! hideNewBadge ? [ FEATURE_BADGES.NEW ] : [];

	const allBadges = [ ...userBadges, ...badges ];

	return (
		<article className="googlesitekit-feature-card">
			<div className="googlesitekit-feature-card__status">
				<span
					aria-hidden="true"
					className={ classnames( 'googlesitekit-feature-card__dot', {
						'googlesitekit-feature-card__dot--visible':
							showUnreadDot && ! hideUnreadDot,
					} ) }
				/>
			</div>

			<div className="googlesitekit-feature-card__content">
				<div className="googlesitekit-feature-card__header">
					<div className="googlesitekit-feature-card__title">
						<Typography
							as="h3"
							className="googlesitekit-feature-card__heading"
							size={ SIZE_LARGE }
							type={ TYPE_TITLE }
						>
							{ title }
						</Typography>

						{ allBadges.map( ( badge ) => (
							<Badge
								{ ...FEATURE_BADGE_PROPS[ badge ] }
								key={ badge }
							/>
						) ) }
					</div>

					{ isDismissible && (
						<div
							ref={ menuWrapperRef }
							className="googlesitekit-feature-card__dismiss-menu mdc-menu-surface--anchor"
						>
							<Link
								aria-controls={ menuID }
								aria-expanded={ isFeedbackMenuOpen }
								aria-haspopup="menu"
								ref={ dismissButtonRef }
								aria-label={ sprintf(
									/* translators: %s: feature name */
									__( 'Dismiss %s', 'google-site-kit' ),
									title
								) }
								className="googlesitekit-feature-card__dismiss"
								onClick={ onClickDismiss }
								linkButton
							>
								<CloseIcon width={ 12 } height={ 12 } />
							</Link>
							<FeedbackMenu
								id={ menuID }
								isOpen={ isFeedbackMenuOpen }
								onClose={ onCloseFeedbackMenu }
								onSelect={ onSelectFeedback }
								options={ feedbackOptions }
								sourceRef={ dismissButtonRef }
								wrapperRef={ menuWrapperRef }
							/>
						</div>
					) }
				</div>

				<div className="googlesitekit-feature-card__details">
					<P
						className="googlesitekit-feature-card__description"
						size={ SIZE_MEDIUM }
					>
						{ shortDescription }
					</P>

					<EffortIndicator effort={ effort } />
				</div>
			</div>

			<footer className="googlesitekit-feature-card__footer">
				<div className="googlesitekit-feature-card__service">
					<ModuleIcon aria-hidden="true" height={ 36 } width={ 36 } />

					{ /* @ts-expect-error - The `Typography` component is not typed yet. */ }
					<Typography size={ SIZE_LARGE } type={ TYPE_BODY }>
						{ moduleName }
					</Typography>
				</div>

				<div className="googlesitekit-feature-card__actions">
					{ /* TODO: #13322 -- Implement FeatureCTA  */ }
					<code>&lt;FeatureCTA /&gt;</code>

					{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
					<Button onClick={ onClickReadMore }>
						{ __( 'Read more', 'google-site-kit' ) }
					</Button>
				</div>
			</footer>
		</article>
	);
};

export default FeatureCard;
