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
import { map } from 'lodash';
import { useMount, useMountedState, useIntersection } from 'react-use';
import { useWindowWidth } from '@react-hook/window-size/throttled';

/*
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	Fragment,
	isValidElement,
} from '@wordpress/element';
import { isURL } from '@wordpress/url';

/*
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import GoogleLogoIcon from '../../../../svg/graphics/logo-g.svg';
import { Cell, Row } from '../../../material-components';
import {
	getContextScrollTop,
	getStickyHeaderHeightWithoutNav,
} from '../../../util/scroll';
import { isHashOnly } from '../../../util/urls';
import { sanitizeHTML } from '../../../util/sanitize';
import DataBlock from '../../DataBlock';
import Warning from '../../../../svg/icons/warning.svg';
import ErrorIcon from '../../../../svg/icons/error.svg';
import Link from '../../Link';
import ModuleIcon from '../../ModuleIcon';
import { getItem, setItem, deleteItem } from '../../../googlesitekit/api/cache';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import Banner from './Banner';
import BannerTitle from './BannerTitle';
import BannerActions from './BannerActions';
import {
	getContentCellOrderProperties,
	getContentCellSizeProperties,
	getImageCellSizeProperties,
	getImageCellOrderProperties,
} from './utils';
import { stringToDate } from '../../../util/date-range/string-to-date';
import { finiteNumberOrZero } from '../../../util/finite-number-or-zero';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
const { useSelect, useDispatch } = Data;

export const LEARN_MORE_TARGET = {
	EXTERNAL: 'external',
	INTERNAL: 'internal',
};

// eslint-disable-next-line complexity
function BannerNotification( props ) {
	const {
		anchorLink,
		anchorLinkLabel,
		badgeLabel,
		blockData,
		children,
		className,
		ctaLabel,
		ctaLink,
		ctaTarget,
		description,
		descriptionIcon,
		dismiss,
		dismissExpires,
		format = '',
		id,
		isDismissible,
		learnMoreDescription,
		learnMoreLabel,
		learnMoreURL,
		learnMoreTarget,
		logo,
		module,
		moduleName,
		onCTAClick,
		onView,
		onDismiss,
		onLearnMoreClick,
		pageIndex,
		showOnce,
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
	const persistDismissal = () =>
		setItem( cacheKeyDismissed, new Date(), { ttl: null } );

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

	async function handleDismiss( e ) {
		e.persist();
		e.preventDefault();

		if ( onDismiss ) {
			await onDismiss( e );
		}
		dismissNotification();
	}

	function dismissNotification() {
		setIsClosed( true );

		setTimeout( async () => {
			await persistDismissal();

			if ( isMounted() ) {
				setIsDismissed( true );
			}

			// Emit an event for the notification counter to listen for.
			const event = new Event( 'notificationDismissed' );
			document.dispatchEvent( event );
		}, 350 );
	}

	const isNavigatingToCTALink = useSelect( ( select ) =>
		ctaLink ? select( CORE_LOCATION ).isNavigatingTo( ctaLink ) : false
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );
	async function handleCTAClick( e ) {
		e.persist();

		let dismissOnCTAClick = true;
		if ( onCTAClick ) {
			( { dismissOnCTAClick = true } = ( await onCTAClick( e ) ) || {} );
		}

		if ( isDismissible && dismissOnCTAClick ) {
			dismissNotification();
		}

		if (
			isURL( ctaLink ) &&
			ctaTarget !== '_blank' &&
			! e.defaultPrevented
		) {
			e.preventDefault();
			navigateTo( ctaLink );
		}
	}

	const handleAnchorLinkClick = useCallback(
		( event ) => {
			if ( isHashOnly( anchorLink ) ) {
				event.preventDefault();

				global.history.replaceState( {}, '', anchorLink );

				global.scrollTo( {
					top: getContextScrollTop( anchorLink, breakpoint ),
					behavior: 'smooth',
				} );
			}
		},
		[ anchorLink, breakpoint ]
	);

	function handleLearnMore( e ) {
		e.persist();

		onLearnMoreClick?.();
	}

	async function expireDismiss() {
		const { value: dismissed } = await getItem( cacheKeyDismissed );

		if ( dismissed ) {
			const expiration = stringToDate( dismissed );
			expiration.setSeconds(
				expiration.getSeconds() + parseInt( dismissExpires, 10 )
			);

			if ( expiration < new Date() ) {
				await deleteItem( cacheKeyDismissed );
			}
		}
	}

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
	const inlineLayout = 'large' === format && 'win-stats-increase' === type;

	const imageCellSizeProperties = getImageCellSizeProperties( format );
	const imageCellOrderProperties = getImageCellOrderProperties( format );
	const contentCellOrderProperties = getContentCellOrderProperties( format );
	const contentCellSizeProperties = getContentCellSizeProperties( {
		format,
		inlineLayout,
		hasErrorOrWarning: 'win-error' === type || 'win-warning' === type,
		hasSmallImageSVG: !! SmallImageSVG,
		hasWinImageSVG: !! WinImageSVG,
	} );

	let icon;
	if ( 'win-warning' === type ) {
		icon = <Warning width={ 34 } />;
	} else if ( 'win-error' === type ) {
		icon = <ErrorIcon width={ 28 } />;
	} else {
		icon = '';
	}

	const dataBlockMarkup = (
		<Fragment>
			{ blockData && (
				<Row>
					{ map( blockData, ( block, i ) => {
						return (
							<Cell key={ i } lgSize={ inlineLayout ? 5 : 4 }>
								<div className="googlesitekit-publisher-win__stats">
									<DataBlock { ...block } />
								</div>
							</Cell>
						);
					} ) }
				</Row>
			) }
		</Fragment>
	);

	const learnMoreAndPageIndex = (
		<Fragment>
			{ learnMoreLabel && (
				<Fragment>
					<Link
						onClick={ handleLearnMore }
						href={ learnMoreURL }
						external={
							learnMoreTarget === LEARN_MORE_TARGET.EXTERNAL
						}
					>
						{ learnMoreLabel }
					</Link>
					{ learnMoreDescription }
				</Fragment>
			) }
			{ pageIndex && (
				<span className="googlesitekit-publisher-win__detect">
					{ pageIndex }
				</span>
			) }
		</Fragment>
	);

	const inlineMarkup = (
		<Fragment>
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

			{ anchorLink && anchorLinkLabel && (
				<p className="googlesitekit-publisher-win__link">
					<Link href={ anchorLink } onClick={ handleAnchorLinkClick }>
						{ anchorLinkLabel }
					</Link>
				</p>
			) }
			{ description && (
				<div className="googlesitekit-publisher-win__desc">
					{ descriptionIcon && (
						<div className="googlesitekit-publisher-win__icon">
							{ descriptionIcon }
						</div>
					) }

					{ isValidElement( description ) ? (
						<Fragment>
							{ description }
							<p>{ learnMoreAndPageIndex }</p>
						</Fragment>
					) : (
						<p>
							<span
								dangerouslySetInnerHTML={ sanitizeHTML(
									description,
									{
										ALLOWED_TAGS: [
											'strong',
											'em',
											'br',
											'a',
										],
										ALLOWED_ATTR: [ 'href' ],
									}
								) }
							/>
							{ learnMoreAndPageIndex }
						</p>
					) }
				</div>
			) }
			{ children }
		</Fragment>
	);

	const logoSVG = module ? (
		<ModuleIcon slug={ module } size={ 19 } />
	) : (
		<GoogleLogoIcon height="34" width="32" />
	);

	const logoCellProps = inlineLayout
		? {
				size: 12,
				smOrder: 2,
				mdOrder: 1,
		  }
		: { size: 12 };

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
				<Cell { ...logoCellProps }>
					<div className="googlesitekit-publisher-win__logo">
						{ logoSVG }
					</div>
					{ moduleName && (
						<div className="googlesitekit-publisher-win__module-name">
							{ moduleName }
						</div>
					) }
				</Cell>
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
				{ inlineLayout ? (
					<Row>
						<Cell mdSize={ 8 } lgSize={ 5 }>
							{ inlineMarkup }
						</Cell>
						<Cell alignBottom mdSize={ 8 } lgSize={ 7 }>
							{ dataBlockMarkup }
						</Cell>
					</Row>
				) : (
					<Fragment>
						{ inlineMarkup }
						{ dataBlockMarkup }
					</Fragment>
				) }

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

			{ ( 'win-error' === type || 'win-warning' === type ) && (
				<Cell size={ 1 } smOrder={ 3 } mdOrder={ 3 } lgOrder={ 3 }>
					<div className="googlesitekit-publisher-win__icons">
						{ icon }
					</div>
				</Cell>
			) }
		</Banner>
	);
}

BannerNotification.propTypes = {
	id: PropTypes.string.isRequired,
	className: PropTypes.string,
	title: PropTypes.string.isRequired,
	description: PropTypes.node,
	descriptionIcon: PropTypes.node,
	learnMoreURL: PropTypes.string,
	learnMoreDescription: PropTypes.string,
	learnMoreLabel: PropTypes.string,
	learnMoreTarget: PropTypes.oneOf( Object.values( LEARN_MORE_TARGET ) ),
	blockData: PropTypes.array,
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
	pageIndex: PropTypes.string,
	dismissExpires: PropTypes.number,
	showOnce: PropTypes.bool,
	onCTAClick: PropTypes.func,
	onView: PropTypes.func,
	onDismiss: PropTypes.func,
	onLearnMoreClick: PropTypes.func,
	anchorLink: PropTypes.string,
	anchorLinkLabel: PropTypes.string,
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

BannerNotification.defaultProps = {
	isDismissible: true,
	className: '',
	dismissExpires: 0,
	showOnce: false,
	learnMoreTarget: LEARN_MORE_TARGET.EXTERNAL,
};

export default BannerNotification;
