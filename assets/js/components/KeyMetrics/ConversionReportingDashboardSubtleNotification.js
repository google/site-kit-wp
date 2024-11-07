/**
 * ConversionReportingDashboardSubtleNotification component.
 *
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
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { Button, SpinnerButton } from 'googlesitekit-components';
import StarFill from '../../../svg/icons/star-fill.svg';
import SubtleNotification from '../../googlesitekit/notifications/components/layout/SubtleNotification';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import Link from '../Link';

export default function ConversionReportingDashboardSubtleNotification( {
	ctaLabel,
	handleCTAClick,
	isSaving,
	onDismiss,
	dismissCTALabel = __( 'Maybe later', 'google-site-kit' ),
} ) {
	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'advanced-conversion-reporting'
		)
	);

	return (
		<SubtleNotification
			className="googlesitekit-acr-subtle-notification"
			title={ __( 'New key metrics were added!', 'google-site-kit' ) }
			description={ createInterpolateElement(
				__(
					'We’ve extended your metrics selection with metrics that aren’t available by default in Analytics. Add them to your dashboard to get a better understanding of how users interact with your site. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<Link
							href={ documentationURL }
							aria-label={ __(
								'Learn more about advanced conversion reporting',
								'google-site-kit'
							) }
						/>
					),
				}
			) }
			dismissCTA={
				<Button tertiary onClick={ onDismiss }>
					{ dismissCTALabel }
				</Button>
			}
			additionalCTA={
				<SpinnerButton onClick={ handleCTAClick } isSaving={ isSaving }>
					{ ctaLabel }
				</SpinnerButton>
			}
			icon={ <StarFill width={ 24 } height={ 24 } /> }
		/>
	);
}

ConversionReportingDashboardSubtleNotification.propTypes = {
	ctaLabel: PropTypes.string.isRequired,
	handleCTAClick: PropTypes.func.isRequired,
	isSaving: PropTypes.bool,
	onDismiss: PropTypes.func.isRequired,
	dismissCTALabel: PropTypes.string,
};
