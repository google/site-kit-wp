/**
 * ErrorWidgetDetails component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

/**
 * Internal dependencies
 */
import P from '@/js/components/Typography/P';
import { Button } from 'googlesitekit-components';
import ReportErrorActions from '@/js/components/ReportErrorActions';
import GetHelpLink from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/GetHelpLink';

export default function ErrorWidgetDetails( {
	failedAudiences,
	showRetryButton,
	onRetry,
	onRequestAccess,
	errors,
	hasInsufficientPermissionsError,
} ) {
	if ( failedAudiences?.length ) {
		return (
			<div>
				<P>
					{ __(
						'Failed to create the following audiences:',
						'google-site-kit'
					) }
				</P>
				<ul className="googlesitekit-widget-audience-segmentation-error__failed-audiences">
					{ failedAudiences.map( ( audience ) => (
						<li key={ audience }>{ audience }</li>
					) ) }
				</ul>
				<Button onClick={ onRetry } danger>
					{ __( 'Retry', 'google-site-kit' ) }
				</Button>
			</div>
		);
	}

	if ( showRetryButton && onRetry ) {
		return (
			<Button onClick={ onRetry } danger>
				{ __( 'Retry', 'google-site-kit' ) }
			</Button>
		);
	}

	return (
		<ReportErrorActions
			moduleSlug="analytics-4"
			error={ errors }
			GetHelpLink={
				hasInsufficientPermissionsError ? GetHelpLink : undefined
			}
			hideGetHelpLink={ ! hasInsufficientPermissionsError }
			buttonVariant="danger"
			getHelpClassName="googlesitekit-error-retry-text"
			onRetry={ onRetry }
			onRequestAccess={ onRequestAccess }
		/>
	);
}

ErrorWidgetDetails.propTypes = {
	errors: PropTypes.arrayOf( PropTypes.object ).isRequired,
	onRetry: PropTypes.func.isRequired,
	onRequestAccess: PropTypes.func.isRequired,
	showRetryButton: PropTypes.bool,
	failedAudiences: PropTypes.arrayOf( PropTypes.string ),
	hasInsufficientPermissionsError: PropTypes.bool,
};
