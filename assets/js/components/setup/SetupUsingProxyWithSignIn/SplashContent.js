/**
 * SplashContent component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
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

/**
 * WordPress dependencies
 */
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Checkbox from '@/js/googlesitekit/components-gm2/Checkbox';
import CompatibilityChecks from '@/js/components/setup/CompatibilityChecks';
import Link from '@/js/components/Link';
import P from '@/js/components/Typography/P';
import Badge from '@/js/components/Badge';
import SplashScreenshotSVG from './SetupFlowSVG';
import SplashBackground from '@/svg/graphics/splash-graphic.svg';
import Typography from '@/js/components/Typography';
import useFormValue from '@/js/hooks/useFormValue';
import {
	ANALYTICS_NOTICE_CHECKBOX,
	ANALYTICS_NOTICE_FORM_NAME,
} from '@/js/components/setup/constants';
import { Cell, Row } from '@/js/material-components';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { DISCONNECTED_REASON_CONNECTED_URL_MISMATCH } from '@/js/googlesitekit/datastore/user/constants';
import { useDispatch, useSelect } from '@/js/googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';

export default function SplashContent( {
	analyticsModuleActive,
	analyticsModuleAvailable,
	children,
	connectedProxyURL,
	description,
	disconnectedReason,
	getHelpURL,
	homeURL,
	secondAdminLearnMoreLink,
	showLearnMoreLink,
	title,
} ) {
	const { setValues } = useDispatch( CORE_FORMS );

	const checked = useFormValue(
		ANALYTICS_NOTICE_FORM_NAME,
		ANALYTICS_NOTICE_CHECKBOX
	);

	const handleOnChange = useCallback(
		( event ) => {
			setValues( ANALYTICS_NOTICE_FORM_NAME, {
				[ ANALYTICS_NOTICE_CHECKBOX ]: event.target.checked,
			} );
		},
		[ setValues ]
	);

	const cellDetailsProp = analyticsModuleActive
		? { smSize: 4, mdSize: 6, lgSize: 6 }
		: { smSize: 4, mdSize: 7, lgSize: 6 };

	const learnMoreLink = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'setup-update-ga4-account'
		);
	} );

	return (
		<Row className="googlesitekit-setup__content">
			<Cell
				smSize={ 4 }
				mdSize={ 8 }
				lgSize={ 6 }
				className="googlesitekit-setup__icon"
			>
				<SplashBackground
					className="googlesitekit-setup__splash-graphic-background"
					width="508"
					height="466"
				/>
				<div className="googlesitekit-setup__splash-graphic-screenshot">
					<SplashScreenshotSVG />
				</div>
			</Cell>

			<Cell { ...cellDetailsProp }>
				<Typography
					as="h1"
					className="googlesitekit-setup__title"
					size="medium"
					type="headline"
				>
					{ title }
				</Typography>

				{ ( showLearnMoreLink || description ) && (
					<p className="googlesitekit-setup__description">
						{ ! showLearnMoreLink && description }

						{ showLearnMoreLink &&
							createInterpolateElement(
								sprintf(
									/* translators: 1: The description. 2: The learn more link. */
									__(
										'%1$s <Link>%2$s</Link>',
										'google-site-kit'
									),
									description,
									__( 'Learn more', 'google-site-kit' )
								),
								{
									Link: (
										<Link
											href={ secondAdminLearnMoreLink }
											external
										/>
									),
								}
							) }
					</p>
				) }

				{ getHelpURL && (
					<Link href={ getHelpURL } external>
						{ __( 'Get help', 'google-site-kit' ) }
					</Link>
				) }

				{ DISCONNECTED_REASON_CONNECTED_URL_MISMATCH ===
					disconnectedReason &&
					connectedProxyURL !== homeURL && (
						<P>
							{ sprintf(
								/* translators: %s: Previous Connected Proxy URL */
								__( '— Old URL: %s', 'google-site-kit' ),
								connectedProxyURL
							) }
							<br />
							{ sprintf(
								/* translators: %s: Connected Proxy URL */
								__( '— New URL: %s', 'google-site-kit' ),
								homeURL
							) }
						</P>
					) }

				{ analyticsModuleAvailable && ! analyticsModuleActive && (
					<div className="googlesitekit-setup__analytics-opt-in-wrapper">
						<Checkbox
							id="googlesitekit-analytics-setup-opt-in"
							name="googlesitekit-analytics-setup-opt-in"
							description={ createInterpolateElement(
								__(
									'To get better insights about your site, Site Kit will update your Analytics account, for example by enabling enhanced measurement. <LearnMoreLink /> <RecommendedBadge />',
									'google-site-kit'
								),
								{
									LearnMoreLink: (
										<Link href={ learnMoreLink } external>
											{ __(
												'Learn more',
												'google-site-kit'
											) }
										</Link>
									),
									RecommendedBadge: (
										<Badge
											className="googlesitekit-splash__analytics-recommended-badge"
											label={ __(
												'Recommended',
												'google-site-kit'
											) }
										/>
									),
								}
							) }
							checked={ checked }
							onChange={ handleOnChange }
							value="1"
						>
							{ __(
								'Get visitor insights by connecting Google Analytics as part of setup',
								'google-site-kit'
							) }
						</Checkbox>
					</div>
				) }

				<CompatibilityChecks>{ children }</CompatibilityChecks>
			</Cell>
		</Row>
	);
}

SplashContent.propTypes = {
	analyticsModuleActive: PropTypes.bool,
	analyticsModuleAvailable: PropTypes.bool,
	children: PropTypes.func,
	connectedProxyURL: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.bool,
	] ),
	description: PropTypes.string,
	disconnectedReason: PropTypes.string,
	getHelpURL: PropTypes.string,
	homeURL: PropTypes.string,
	secondAdminLearnMoreLink: PropTypes.string,
	showLearnMoreLink: PropTypes.bool,
	title: PropTypes.string.isRequired,
};
