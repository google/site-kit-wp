/**
 * BannerNotification component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import classnames from 'classnames';
import { useMount, useMountedState, useIntersection } from 'react-use';
import { useWindowWidth } from '@react-hook/window-size/throttled';

/*
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { isURL } from '@wordpress/url';

/*
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Cell } from '../../../material-components';
import { getStickyHeaderHeightWithoutNav } from '../../../util/scroll';
import { getItem, setItem, deleteItem } from '../../../googlesitekit/api/cache';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import Banner from './Banner';
import BannerTitle from './BannerTitle';
import BannerActions from './BannerActions';
import BannerIcon from './BannerIcon';
import BannerLogo from './BannerLogo';
import { LEARN_MORE_TARGET } from './constants';
import {
	getContentCellOrderProperties,
	getContentCellSizeProperties,
	getImageCellSizeProperties,
	getImageCellOrderProperties,
} from './utils';
import { finiteNumberOrZero } from '../../../util/finite-number-or-zero';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import BannerDescription from './BannerDescription';
const { useSelect, useDispatch } = Data;

export * from './constants';

export default function BannerNotification( props ) {
	const {
		badgeLabel,
		children,
		className = '',
		ctaLabel,
		ctaLink,
		ctaTarget,
		description,
		dismiss,
		dismissExpires = 0,
		format = '',
		id,
		isDismissible = true,
		learnMoreDescription,
		learnMoreLabel,
		learnMoreURL,
		learnMoreTarget = LEARN_MORE_TARGET.EXTERNAL,
		logo,
		module,
		moduleName,
		onCTAClick,
		onView,
		onDismiss,
		onLearnMoreClick,
		showOnce = false,
		SmallImageSVG,
		title,
		type,
		WinImageSVG,
		showSmallWinImage = true,
		smallWinImageSVGWidth = 75,
		smallWinImageSVGHeight = 75,
		mediumWinImageSVGWidth = 105,
		mediumWinImageSVGHeight = 105,
		rounded = false,
		footer,
		secondaryPane,
		ctaComponent,
	} = props;

	// Closed notifications are invisible, but still occupy space.
	const [ isClosed, setIsClosed ] = useState( false );
	// Start with an undefined dismissed state due to async resolution.
	const [ isDismissed, setIsDismissed ] = useState( false );
	const cacheKeyDismissed = `notification::dismissed::${ id }`;

	// Persists the notification dismissal to browser storage.
	// Dismissed notifications don't expire.
	// Don't use the getReferenceDate selector here since there is no need in it.
	const persistDismissal = () =>
		setItem( cacheKeyDismissed, new Date(), { ttl: null } ); // eslint-disable-line sitekit/no-direct-date

	const windowWidth = useWindowWidth();
	const breakpoint = useBreakpoint();
	const isMounted = useMountedState();

	const [ isViewed, setIsViewed ] = useState( false );

	const bannerNotificationRef = useRef();
	const intersectionEntry = useIntersection( bannerNotificationRef, {
		rootMargin: `${ -finiteNumberOrZero(
			getStickyHeaderHeightWithoutNav( breakpoint )
		) }px 0px 0px 0px`,
		threshold: 0,
	} );

	useEffect( () => {
		if ( ! isViewed && intersectionEntry?.isIntersecting ) {
			if ( typeof onView === 'function' ) {
				onView();
			}

			setIsViewed( true );
		}
	}, [ id, onView, isViewed, intersectionEntry ] );

	// There is a 1px difference between the tablet breakpoint determination in `useBreakpoint` and the `min-width: $bp-tablet` breakpoint the `@mixin googlesitekit-inner-padding` uses,
	// which in turn is used by the notification. This why we are using `useWindowWidth` here, instead of the breakpoint returned by `useBreakpoint`.
	const isMinWidthTablet = windowWidth >= 600;

	useMount( async () => {
		if ( dismissExpires > 0 ) {
			await expireDismiss();
		}

		if ( isDismissible ) {
			const { cacheHit } = await getItem( cacheKeyDismissed );
			setIsDismissed( cacheHit );
		}

		if ( showOnce ) {
			// Set the dismissed flag in cache without immediately hiding it.
			await persistDismissal();
		}
	} );

	const handleDismiss = async ( event ) => {
		event.persist();
		event.preventDefault();

		if ( onDismiss ) {
			await onDismiss( event );
		}

		dismissNotification();
	};

	const isCTALink = isURL( ctaLink ) && ctaTarget !== '_blank';
	const dismissNotification = () => {
		if ( ! isCTALink ) {
			setIsClosed( true );
		}

		return new Promise( ( resolve ) => {
			setTimeout( async () => {
				await persistDismissal();

				if ( isMounted() ) {
					setIsDismissed( true );
				}

				// Emit an event for the notification counter to listen for.
				const event = new Event( 'notificationDismissed' );
				document.dispatchEvent( event );
				resolve();
			}, 350 );
		} );
	};

	const isNavigatingToCTALink = useSelect( ( select ) =>
		ctaLink ? select( CORE_LOCATION ).isNavigatingTo( ctaLink ) : false
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const handleCTAClick = async ( event ) => {
		event.persist();
		if ( isCTALink && ! event.defaultPrevented ) {
			event.preventDefault();
		}

		let dismissOnCTAClick = true;
		if ( onCTAClick ) {
			( { dismissOnCTAClick = true } =
				( await onCTAClick( event ) ) || {} );
		}

		if ( isDismissible && dismissOnCTAClick ) {
			await dismissNotification();
		}

		if ( isCTALink ) {
			navigateTo( ctaLink );
		}
	};

	const expireDismiss = async () => {
		const { value: dismissed } = await getItem( cacheKeyDismissed );

		if ( dismissed ) {
			const expiration = new Date( dismissed );

			expiration.setSeconds(
				expiration.getSeconds() + parseInt( dismissExpires, 10 )
			);

			// eslint-disable-next-line sitekit/no-direct-date
			if ( expiration < new Date() ) {
				await deleteItem( cacheKeyDismissed );
			}
		}
	};

	// isDismissed will be undefined until resolved from browser storage.
	// isNavigating will be true until the navigation is complete.
	if (
		! isNavigatingToCTALink &&
		isDismissible &&
		( undefined === isDismissed || isDismissed )
	) {
		return null;
	}

	const closedClass =
		! isNavigatingToCTALink && isClosed ? 'is-closed' : 'is-open';

	const imageCellSizeProperties = getImageCellSizeProperties( format );
	const imageCellOrderProperties = getImageCellOrderProperties( format );
	const contentCellOrderProperties = getContentCellOrderProperties( format );
	const contentCellSizeProperties = getContentCellSizeProperties( {
		format,
		hasErrorOrWarning: 'win-error' === type || 'win-warning' === type,
		hasSmallImageSVG: !! SmallImageSVG,
		hasWinImageSVG: !! WinImageSVG,
	} );

	return (
		<Banner
			id={ id }
			className={ classnames( className, {
				[ `googlesitekit-publisher-win--${ format }` ]: format,
				[ `googlesitekit-publisher-win--${ type }` ]: type,
				[ `googlesitekit-publisher-win--${ closedClass }` ]:
					closedClass,
				'googlesitekit-publisher-win--rounded': rounded,
			} ) }
			secondaryPane={ secondaryPane }
			ref={ bannerNotificationRef }
		>
			{ logo && (
				<BannerLogo module={ module } moduleName={ moduleName } />
			) }

			{ SmallImageSVG && (
				<Cell
					size={ 1 }
					className="googlesitekit-publisher-win__small-media"
				>
					<SmallImageSVG />
				</Cell>
			) }

			<Cell
				{ ...contentCellSizeProperties }
				{ ...contentCellOrderProperties }
				className="googlesitekit-publisher-win__content"
			>
				<BannerTitle
					title={ title }
					badgeLabel={ badgeLabel }
					smallWinImageSVGHeight={ smallWinImageSVGHeight }
					smallWinImageSVGWidth={ smallWinImageSVGWidth }
					winImageFormat={ format }
					WinImageSVG={
						! isMinWidthTablet && showSmallWinImage
							? WinImageSVG
							: undefined
					}
				/>

				<BannerDescription
					description={ description }
					learnMoreURL={ learnMoreURL }
					learnMoreLabel={ learnMoreLabel }
					learnMoreTarget={ learnMoreTarget }
					learnMoreDescription={ learnMoreDescription }
					onLearnMoreClick={ onLearnMoreClick }
				/>

				{ children }

				<BannerActions
					ctaLink={ ctaLink }
					ctaLabel={ ctaLabel }
					ctaComponent={ ctaComponent }
					ctaTarget={ ctaTarget }
					ctaCallback={ handleCTAClick }
					dismissLabel={ isDismissible ? dismiss : undefined }
					dismissCallback={ handleDismiss }
				/>

				{ footer && (
					<div className="googlesitekit-publisher-win__footer">
						{ footer }
					</div>
				) }
			</Cell>

			{ WinImageSVG && ( isMinWidthTablet || ! showSmallWinImage ) && (
				<Cell
					{ ...imageCellSizeProperties }
					{ ...imageCellOrderProperties }
					alignBottom={ format === 'larger' }
					className="googlesitekit-publisher-win__image"
				>
					<div
						className={ `googlesitekit-publisher-win__image-${ format }` }
					>
						<WinImageSVG
							style={ {
								maxWidth: mediumWinImageSVGWidth,
								maxHeight: mediumWinImageSVGHeight,
							} }
						/>
					</div>
				</Cell>
			) }

			<BannerIcon type={ type } />
		</Banner>
	);
}

BannerNotification.propTypes = {
	id: PropTypes.string.isRequired,
	className: PropTypes.string,
	title: PropTypes.string.isRequired,
	description: PropTypes.node,
	learnMoreURL: PropTypes.string,
	learnMoreDescription: PropTypes.string,
	learnMoreLabel: PropTypes.string,
	learnMoreTarget: PropTypes.oneOf( Object.values( LEARN_MORE_TARGET ) ),
	WinImageSVG: PropTypes.elementType,
	SmallImageSVG: PropTypes.elementType,
	format: PropTypes.string,
	ctaLink: PropTypes.string,
	ctaLabel: PropTypes.string,
	type: PropTypes.string,
	dismiss: PropTypes.string,
	isDismissible: PropTypes.bool,
	logo: PropTypes.bool,
	module: PropTypes.string,
	moduleName: PropTypes.string,
	dismissExpires: PropTypes.number,
	showOnce: PropTypes.bool,
	onCTAClick: PropTypes.func,
	onView: PropTypes.func,
	onDismiss: PropTypes.func,
	onLearnMoreClick: PropTypes.func,
	badgeLabel: PropTypes.string,
	rounded: PropTypes.bool,
	footer: PropTypes.node,
	secondaryPane: PropTypes.node,
	showSmallWinImage: PropTypes.bool,
	smallWinImageSVGWidth: PropTypes.number,
	smallWinImageSVGHeight: PropTypes.number,
	mediumWinImageSVGWidth: PropTypes.number,
	mediumWinImageSVGHeight: PropTypes.number,
};
