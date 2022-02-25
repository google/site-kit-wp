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
import map from 'lodash/map';
import { useMount } from 'react-use';

/*
 * WordPress dependencies
 */
import {
	useCallback,
	useState,
	useRef,
	Fragment,
	isValidElement,
} from '@wordpress/element';

/*
 * Internal dependencies
 */
import GoogleLogoIcon from '../../../../svg/graphics/logo-g.svg';
import { Cell, Grid, Row } from '../../../material-components';
import { getContextScrollTop } from '../../../util/scroll';
import { isHashOnly } from '../../../util/urls';
import { sanitizeHTML } from '../../../util/sanitize';
import DataBlock from '../../DataBlock';
import Button from '../../Button';
import Warning from '../../../../svg/icons/warning.svg';
import ErrorIcon from '../../../../svg/icons/error.svg';
import Link from '../../Link';
import Badge from '../../Badge';
import ModuleIcon from '../../ModuleIcon';
import { getItem, setItem, deleteItem } from '../../../googlesitekit/api/cache';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import {
	getContentCellOrderProperties,
	getContentCellSizeProperties,
	getImageCellSizeProperties,
	getImageCellOrderProperties,
} from './utils';

export const LEARN_MORE_TARGET = {
	EXTERNAL: 'external',
	INTERNAL: 'internal',
};

function BannerNotification( {
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
	dismiss,
	dismissExpires,
	format,
	id,
	isDismissible,
	learnMoreDescription,
	learnMoreLabel,
	learnMoreURL,
	learnMoreTarget,
	logo,
	module,
	moduleName,
	noBottomPadding,
	onCTAClick,
	onDismiss,
	onLearnMoreClick,
	pageIndex,
	showOnce,
	SmallImageSVG,
	title,
	type,
	WinImageSVG,
} ) {
	// Closed notifications are invisible, but still occupy space.
	const [ isClosed, setIsClosed ] = useState( false );
	// Start with an undefined dismissed state due to async resolution.
	const [ isDismissed, setIsDismissed ] = useState( false );
	const cardRef = useRef();
	const cacheKeyDismissed = `notification::dismissed::${ id }`;
	// Persists the notification dismissal to browser storage.
	// Dismissed notifications don't expire.
	const persistDismissal = () =>
		setItem( cacheKeyDismissed, new Date(), { ttl: null } );

	const breakpoint = useBreakpoint();

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
		const card = cardRef.current;

		setIsClosed( true );

		setTimeout( async () => {
			await persistDismissal();

			if ( card?.style ) {
				card.style.display = 'none';
			}

			// Emit an event for the notification counter to listen for.
			const event = new Event( 'notificationDismissed' );
			document.dispatchEvent( event );
		}, 350 );
	}

	async function handleCTAClick( e ) {
		e.persist();

		if ( onCTAClick ) {
			await onCTAClick( e );
		}

		if ( isDismissible ) {
			dismissNotification();
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

	async function handleLearnMore( e ) {
		e.persist();

		onLearnMoreClick?.();
	}

	async function expireDismiss() {
		const { value: dismissed } = await getItem( cacheKeyDismissed );

		if ( dismissed ) {
			const expiration = new Date( dismissed );
			expiration.setSeconds(
				expiration.getSeconds() + parseInt( dismissExpires, 10 )
			);

			if ( expiration < new Date() ) {
				await deleteItem( cacheKeyDismissed );
			}
		}
	}

	// isDismissed will be undefined until resolved from browser storage.
	if ( isDismissible && ( undefined === isDismissed || isDismissed ) ) {
		return null;
	}

	const closedClass = isClosed ? 'is-closed' : 'is-open';
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

	const inlineMarkup = (
		<Fragment>
			{ title && (
				<h3 className="googlesitekit-heading-2 googlesitekit-publisher-win__title">
					{ title }

					{ badgeLabel && <Badge label={ badgeLabel } /> }
				</h3>
			) }
			{ anchorLink && anchorLinkLabel && (
				<p className="googlesitekit-publisher-win__link">
					<Link href={ anchorLink } onClick={ handleAnchorLinkClick }>
						{ anchorLinkLabel }
					</Link>
				</p>
			) }
			{ description && (
				<div className="googlesitekit-publisher-win__desc">
					<p>
						{ isValidElement( description ) ? (
							description
						) : (
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
						) }

						{ learnMoreLabel && (
							<Fragment>
								{ ' ' }
								<Link
									onClick={ handleLearnMore }
									href={ learnMoreURL }
									external={
										learnMoreTarget ===
										LEARN_MORE_TARGET.EXTERNAL
									}
									inherit
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
					</p>
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
		<section
			id={ id }
			ref={ cardRef }
			className={ classnames( className, 'googlesitekit-publisher-win', {
				[ `googlesitekit-publisher-win--${ format }` ]: format,
				[ `googlesitekit-publisher-win--${ type }` ]: type,
				[ `googlesitekit-publisher-win--${ closedClass }` ]: closedClass,
				'googlesitekit-publisher-win--no-bottom-padding': noBottomPadding,
			} ) }
		>
			<Grid
				className={ classnames( {
					'googlesitekit-padding-bottom-0': noBottomPadding,
				} ) }
			>
				<Row>
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

						{ ctaLink && (
							<Button
								className="googlesitekit-notification__cta"
								href={ ctaLink }
								target={ ctaTarget }
								onClick={ handleCTAClick }
							>
								{ ctaLabel }
							</Button>
						) }

						{ isDismissible && dismiss && (
							<Link onClick={ handleDismiss }>{ dismiss }</Link>
						) }
					</Cell>

					{ WinImageSVG && (
						<Cell
							{ ...imageCellSizeProperties }
							{ ...imageCellOrderProperties }
							alignBottom={
								format === 'larger' && noBottomPadding
							}
						>
							<div
								className={ `googlesitekit-publisher-win__image-${ format }` }
							>
								<WinImageSVG />
							</div>
						</Cell>
					) }

					{ ( 'win-error' === type || 'win-warning' === type ) && (
						<Cell size={ 1 }>
							<div className="googlesitekit-publisher-win__icons">
								{ icon }
							</div>
						</Cell>
					) }
				</Row>
			</Grid>
		</section>
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
	learnMoreTarget: PropTypes.oneOf( [
		LEARN_MORE_TARGET.EXTERNAL,
		LEARN_MORE_TARGET.INTERNAL,
	] ),
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
	onDismiss: PropTypes.func,
	onLearnMoreClick: PropTypes.func,
	anchorLink: PropTypes.string,
	anchorLinkLabel: PropTypes.string,
	badgeLabel: PropTypes.string,
	noBottomPadding: PropTypes.bool,
};

BannerNotification.defaultProps = {
	isDismissible: true,
	className: '',
	dismissExpires: 0,
	showOnce: false,
	noBottomPadding: false,
	learnMoreTarget: LEARN_MORE_TARGET.EXTERNAL,
};

export default BannerNotification;
