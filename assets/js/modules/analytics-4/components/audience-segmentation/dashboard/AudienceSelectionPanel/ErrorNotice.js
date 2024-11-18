/**
 * Audience Selection Panel Error Notice
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
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, useInViewSelect } from 'googlesitekit-data';
import useViewContext from '../../../../../../hooks/useViewContext';
import { trackEvent } from '../../../../../../util';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from './constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { isInsufficientPermissionsError } from '../../../../../../util/errors';
import Link from '../../../../../../components/Link';
import ReportErrorActions from '../../../../../../components/ReportErrorActions';
import RequestAccessButton from './RequestAccessButton';
import RetryButton from './RetryButton';

export default function ErrorNotice() {
	const viewContext = useViewContext();

	const syncAvailableAudiencesError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForAction(
			'syncAvailableAudiences'
		)
	);
	const [ siteKitUserCountReportError, otherUserCountReportError ] =
		useInViewSelect( ( select ) =>
			select( MODULES_ANALYTICS_4 ).getAudienceUserCountReportErrors()
		) || [];

	const helpLink = useSelect( ( select ) =>
		select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
			code: 'analytics-4_insufficient_permissions',
		} )
	);
	const isOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
	);

	const { clearError, syncAvailableAudiences } =
		useDispatch( MODULES_ANALYTICS_4 );

	const retrySyncAvailableAudiences = useCallback( async () => {
		await clearError( 'syncAvailableAudiences' );
		syncAvailableAudiences();
	}, [ clearError, syncAvailableAudiences ] );

	const errors = [];

	if ( syncAvailableAudiencesError ) {
		errors.push( syncAvailableAudiencesError );
	}

	if ( otherUserCountReportError ) {
		errors.push( otherUserCountReportError );
	}

	if ( siteKitUserCountReportError ) {
		errors.push( siteKitUserCountReportError );
	}

	const hasErrors = errors.length > 0;

	const hasInsufficientPermissionsError = errors.some( ( error ) =>
		isInsufficientPermissionsError( error )
	);

	// Track an event when the error notice is displayed.
	useEffect( () => {
		if ( ! isOpen || ! hasErrors ) {
			return;
		}

		trackEvent(
			`${ viewContext }_audiences-sidebar`,
			hasInsufficientPermissionsError
				? 'insufficient_permissions_error'
				: 'data_loading_error'
		);
	}, [ hasErrors, hasInsufficientPermissionsError, isOpen, viewContext ] );

	if ( ! errors.length ) {
		return null;
	}

	const userCountError = [
		otherUserCountReportError,
		siteKitUserCountReportError,
	].some( ( error ) => !! error );

	return (
		<div className="googlesitekit-audience-selection-panel__error-notice">
			<p>
				{ hasInsufficientPermissionsError
					? createInterpolateElement(
							__(
								'Insufficient permissions, contact your administrator. Trouble getting access? <HelpLink />',
								'google-site-kit'
							),
							{
								HelpLink: (
									<Link
										href={ helpLink }
										external
										hideExternalIndicator
									>
										{ __( 'Get help', 'google-site-kit' ) }
									</Link>
								),
							}
					  )
					: __( 'Data loading failed', 'google-site-kit' ) }
			</p>
			<div className="googlesitekit-audience-selection-panel__error-notice-actions">
				{ hasInsufficientPermissionsError || userCountError ? (
					<ReportErrorActions
						moduleSlug="analytics-4"
						error={ errors }
						hideGetHelpLink
						buttonVariant="danger"
						RequestAccessButton={ RequestAccessButton }
						RetryButton={ RetryButton }
					/>
				) : (
					<RetryButton handleRetry={ retrySyncAvailableAudiences } />
				) }
			</div>
		</div>
	);
}
