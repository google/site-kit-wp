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
import GoogleLogoIcon from '../../../svg/graphics/logo-g.svg';
import { getContextScrollTop } from '../../util/scroll';
import { isHashOnly } from '../../util/urls';
import { sanitizeHTML } from '../../util/sanitize';
import DataBlock from '../DataBlock';
import Button from '../Button';
import Warning from '../../../svg/icons/warning.svg';
import ErrorIcon from '../../../svg/icons/error.svg';
import Link from '../Link';
import ModuleIcon from '../ModuleIcon';
import { getItem, setItem, deleteItem } from '../../googlesitekit/api/cache';
import { trackEvent } from '../../util';
import { VIEW_CONTEXT_DASHBOARD } from '../../googlesitekit/constants';
import { useBreakpoint } from '../../hooks/useBreakpoint';

function BannerNotification( {
	anchorLink,
	anchorLinkLabel,
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
	logo,
	module,
	moduleName,
	onCTAClick,
	onDismiss,
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
		await trackEvent(
			`${ VIEW_CONTEXT_DASHBOARD }_site-notification`,
			'view_notification',
			id
		);

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

		await trackEvent(
			`${ VIEW_CONTEXT_DASHBOARD }_site-notification`,
			'dismiss_notification',
			id
		);

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

		await trackEvent(
			`${ VIEW_CONTEXT_DASHBOARD }_site-notification`,
			'confirm_notification',
			id
		);

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

		await trackEvent(
			`${ VIEW_CONTEXT_DASHBOARD }_site-notification`,
			'click_learn_more_link',
			id
		);
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

	let layout = 'mdc-layout-grid__cell--span-12';
	if ( 'large' === format ) {
		layout =
			'mdc-layout-grid__cell--order-2-phone ' +
			'mdc-layout-grid__cell--order-1-tablet ' +
			'mdc-layout-grid__cell--span-6-tablet ' +
			'mdc-layout-grid__cell--span-8-desktop ';

		if ( inlineLayout ) {
			layout =
				'mdc-layout-grid__cell--order-2-phone ' +
				'mdc-layout-grid__cell--order-1-tablet ' +
				'mdc-layout-grid__cell--span-5-tablet ' +
				'mdc-layout-grid__cell--span-8-desktop ';
		}
	} else if ( 'small' === format ) {
		layout =
			'mdc-layout-grid__cell--span-11-desktop ' +
			'mdc-layout-grid__cell--span-7-tablet ' +
			'mdc-layout-grid__cell--span-3-phone';
	}

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
				<div className="mdc-layout-grid__inner">
					{ map( blockData, ( block, i ) => {
						return (
							<div
								key={ i }
								className={ classnames(
									'mdc-layout-grid__cell',
									{
										'mdc-layout-grid__cell--span-5-desktop': inlineLayout,
										'mdc-layout-grid__cell--span-4-desktop': ! inlineLayout,
									}
								) }
							>
								<div className="googlesitekit-publisher-win__stats">
									<DataBlock { ...block } />
								</div>
							</div>
						);
					} ) }
				</div>
			) }
		</Fragment>
	);

	const inlineMarkup = (
		<Fragment>
			{ title && (
				<h3 className="googlesitekit-heading-2 googlesitekit-publisher-win__title">
					{ title }
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
									external
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

	return (
		<section
			id={ id }
			ref={ cardRef }
			className={ classnames( className, 'googlesitekit-publisher-win', {
				[ `googlesitekit-publisher-win--${ format }` ]: format,
				[ `googlesitekit-publisher-win--${ type }` ]: type,
				[ `googlesitekit-publisher-win--${ closedClass }` ]: closedClass,
			} ) }
		>
			<div className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					{ logo && (
						<div
							className={ classnames(
								'mdc-layout-grid__cell',
								'mdc-layout-grid__cell--span-12',
								{
									'mdc-layout-grid__cell--order-2-phone': inlineLayout,
									'mdc-layout-grid__cell--order-1-tablet': inlineLayout,
								}
							) }
						>
							<div className="googlesitekit-publisher-win__logo">
								{ logoSVG }
							</div>
							{ moduleName && (
								<div className="googlesitekit-publisher-win__module-name">
									{ moduleName }
								</div>
							) }
						</div>
					) }

					{ SmallImageSVG && (
						<div
							className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-1
								googlesitekit-publisher-win__small-media
							"
						>
							<SmallImageSVG />
						</div>
					) }

					<div
						className={ classnames(
							'mdc-layout-grid__cell',
							layout
						) }
					>
						{ inlineLayout ? (
							<div className="mdc-layout-grid__inner">
								<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-5-desktop mdc-layout-grid__cell--span-8-tablet">
									{ inlineMarkup }
								</div>
								<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-7-desktop mdc-layout-grid__cell--span-8-tablet mdc-layout-grid__cell--align-bottom">
									{ dataBlockMarkup }
								</div>
							</div>
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
					</div>

					{ WinImageSVG && (
						<div
							className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--order-1-phone
								mdc-layout-grid__cell--order-2-tablet
								mdc-layout-grid__cell--span-2-tablet
								mdc-layout-grid__cell--span-4-desktop
							"
						>
							<div className="googlesitekit-publisher-win__image-large">
								<WinImageSVG />
							</div>
						</div>
					) }

					{ ( 'win-error' === type || 'win-warning' === type ) && (
						<div
							className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-1
							"
						>
							<div className="googlesitekit-publisher-win__icons">
								{ icon }
							</div>
						</div>
					) }
				</div>
			</div>
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
	anchorLink: PropTypes.string,
	anchorLinkLabel: PropTypes.string,
};

BannerNotification.defaultProps = {
	isDismissible: true,
	className: '',
	dismissExpires: 0,
	showOnce: false,
};

export default BannerNotification;
