/**
 * SetupSuccessBannerNotification component.
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
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { removeQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import useQueryArg from '../../hooks/useQueryArg';
import BannerNotification, { LEARN_MORE_TARGET } from './BannerNotification';
import SuccessGreenSVG from '../../../svg/graphics/success-green.svg';
import { ANCHOR_ID_SPEED } from '../../googlesitekit/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '../../googlesitekit/datastore/user/constants';
import { trackEvent } from '../../util/tracking';
import { getNavigationalScrollTop } from '../../util/scroll';
import useViewContext from '../../hooks/useViewContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import Link from '../Link';

function SetupSuccessBannerNotification() {
	const [ slug ] = useQueryArg( 'slug' );
	const [ notification ] = useQueryArg( 'notification' );

	const breakpoint = useBreakpoint();
	const viewContext = useViewContext();

	const modules = useSelect( ( select ) =>
		select( CORE_MODULES ).getModules()
	);
	const canManageOptions = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS )
	);
	const setupSuccessContent = useSelect( ( select ) => {
		const storeName = modules?.[ slug ]?.storeName;

		if ( ! storeName ) {
			return null;
		}

		const { getSetupSuccessContent } = select( storeName );

		if ( ! getSetupSuccessContent ) {
			return null;
		}

		return getSetupSuccessContent();
	} );
	const settingsAdminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	const onView = useCallback( () => {
		trackEvent(
			`${ viewContext }_authentication-success-notification`,
			'view_notification'
		);
	}, [ viewContext ] );

	const onDismiss = useCallback( async () => {
		await trackEvent(
			`${ viewContext }_authentication-success-notification`,
			'confirm_notification'
		);

		const modifiedURL = removeQueryArgs(
			global.location.href,
			'notification'
		);
		global.history.replaceState( null, '', modifiedURL );
	}, [ viewContext ] );

	if ( modules === undefined ) {
		return null;
	}

	// Only show the connected win when the user completes setup flow.
	if ( ! notification || '' === notification ) {
		return null;
	}

	if ( notification === 'authentication_success' && ! canManageOptions ) {
		return null;
	}

	if (
		notification === 'authentication_success' &&
		slug &&
		! modules[ slug ]?.active
	) {
		return null;
	}

	const winData = {
		id: 'connected-successfully',
		setupTitle: __( 'Site Kit', 'google-site-kit' ),
		description: '',
		learnMore: {
			label: '',
			url: '',
			description: '',
		},
	};

	switch ( notification ) {
		case 'authentication_success':
			if ( modules[ slug ] ) {
				winData.id = `${ winData.id }-${ slug }`;
				winData.setupTitle = modules[ slug ].name;
				winData.description = '';

				if ( setupSuccessContent ) {
					const { description, learnMore } = setupSuccessContent;
					winData.description = description;
					winData.learnMore = learnMore;
				}
			}

			if ( 'pagespeed-insights' === slug ) {
				const anchorLink = `#${ ANCHOR_ID_SPEED }`;
				const onJumpLinkClick = ( event ) => {
					event.preventDefault();

					global.history.replaceState( {}, '', anchorLink );
					global.scrollTo( {
						top: getNavigationalScrollTop( anchorLink, breakpoint ),
						behavior: 'smooth',
					} );
				};

				winData.description = (
					<p className="googlesitekit-publisher-win__link">
						<Link href={ anchorLink } onClick={ onJumpLinkClick }>
							{ __(
								'Jump to the bottom of the dashboard to see how fast your home page is',
								'google-site-kit'
							) }
						</Link>
					</p>
				);
			} else if ( ! winData.description && ! winData.learnMore.label ) {
				winData.description = __(
					'Connect more services to see more stats.',
					'google-site-kit'
				);
				winData.learnMore = {
					label: __( 'Go to Settings', 'google-site-kit' ),
					url: `${ settingsAdminURL }#/connect-more-services`,
					target: LEARN_MORE_TARGET.INTERNAL,
				};
			}

			return (
				<Fragment>
					<BannerNotification
						id={ winData.id }
						title={ sprintf(
							/* translators: %s: the name of a module that setup was completed for */
							__(
								'Congrats on completing the setup for %s!',
								'google-site-kit'
							),
							winData.setupTitle
						) }
						description={ winData.description }
						handleDismiss={ () => {} }
						WinImageSVG={ SuccessGreenSVG }
						onView={ onView }
						dismiss={ __( 'OK, Got it!', 'google-site-kit' ) }
						onDismiss={ onDismiss }
						format="smaller"
						type="win-success"
						learnMoreLabel={ winData.learnMore.label }
						learnMoreDescription={ winData.learnMore.description }
						learnMoreURL={ winData.learnMore.url }
						learnMoreTarget={ winData.learnMore.target }
					/>
				</Fragment>
			);

		default:
			return null;
	}
}

export default SetupSuccessBannerNotification;
