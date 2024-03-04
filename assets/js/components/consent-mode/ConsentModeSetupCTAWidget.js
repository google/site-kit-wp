/**
 * Site Kit by Google, Copyright 2024 Google LLC
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Fragment,
	createInterpolateElement,
	useCallback,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button, SpinnerButton } from 'googlesitekit-components';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { Cell, Grid, Row } from '../../material-components';
import Link from '../Link';
import BannerGraphicsSVGDesktop from '../../../svg/graphics/consent-mode-setup.svg';

const { useSelect } = Data;

export default function ConsentModeSetupCTAWidget( { Widget } ) {
	const [ isSaving, setIsSaving ] = useState( false );

	const consentModeDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'consent-mode' )
	);

	const onEnableGroups = useCallback( () => {
		setIsSaving( true );
	}, [] );

	return (
		<Widget
			noPadding
			className="googlesitekit-consent-mode-setup-cta-widget"
		>
			<Grid collapsed>
				<Row>
					<Cell
						smSize={ 6 }
						mdSize={ 8 }
						lgSize={ 6 }
						className="googlesitekit-consent-mode-setup-cta-widget__primary-cell"
					>
						<h3 className="googlesitekit-consent-mode-setup-cta-widget__title">
							{ __(
								'Enable Consent Mode to preserve tracking for your Ads campaigns',
								'google-site-kit'
							) }
						</h3>
						<p className="googlesitekit-consent-mode-setup-cta-widget__description">
							{ createInterpolateElement(
								__(
									'Consent mode interacts with your Consent Management Platform (CMP) or custom implementation for obtaining visitor consent, such as a cookie consent banner. <a>Learn more</a>',
									'google-site-kit'
								),
								{
									a: (
										<Link
											href={ consentModeDocumentationURL }
											external
											aria-label={ __(
												'Learn more about consent mode',
												'google-site-kit'
											) }
										/>
									),
								}
							) }
						</p>
						<div className="googlesitekit-consent-mode-setup-cta-widget__actions-wrapper">
							<Fragment>
								<SpinnerButton
									onClick={ onEnableGroups }
									isSaving={ isSaving }
								>
									{ __(
										'Enable consent mode',
										'google-site-kit'
									) }
								</SpinnerButton>
								<Button tertiary onClick={ () => {} }>
									{ __( 'Maybe later', 'google-site-kit' ) }
								</Button>
							</Fragment>
						</div>
					</Cell>
					<Cell
						alignBottom
						className="googlesitekit-consent-mode-setup-cta-widget__svg-wrapper"
						smSize={ 6 }
						mdSize={ 8 }
						lgSize={ 6 }
					>
						<BannerGraphicsSVGDesktop />
					</Cell>
				</Row>
			</Grid>
		</Widget>
	);
}

ConsentModeSetupCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};
