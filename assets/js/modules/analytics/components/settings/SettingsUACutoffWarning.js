/**
 * SettingsUACutoffWarning component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { UA_CUTOFF_DATE } from '../../constants';
import { stringToDate, trackEvent } from '../../../../util';
import Link from '../../../../components/Link';
import SettingsNotice, {
	TYPE_WARNING,
} from '../../../../components/SettingsNotice';
import useViewContext from '../../../../hooks/useViewContext';
const { useSelect } = Data;

export default function SettingsUACutoffWarning() {
	const viewContext = useViewContext();

	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const referenceDate = useSelect( ( select ) =>
		select( CORE_USER ).getReferenceDate()
	);

	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL( 'ga4' );
	} );

	const shouldDisplayWarning = isAnalyticsConnected && ! isGA4Connected;

	const eventCategory =
		stringToDate( referenceDate ) < stringToDate( UA_CUTOFF_DATE )
			? `${ viewContext }_ua-future-warning`
			: `${ viewContext }_ua-stale-warning`;

	useEffect( () => {
		if ( shouldDisplayWarning ) {
			trackEvent( eventCategory, 'view_notification' );
		}
	}, [ eventCategory, shouldDisplayWarning ] );

	if ( ! shouldDisplayWarning ) {
		return null;
	}

	return (
		<SettingsNotice
			type={ TYPE_WARNING }
			LearnMore={ () => (
				<Link
					href={ documentationURL }
					external
					onClick={ () => {
						trackEvent( eventCategory, 'click_learn_more_link' );
					} }
				>
					{ __( 'Learn more', 'google-site-kit' ) }
				</Link>
			) }
			notice={
				stringToDate( referenceDate ) < stringToDate( UA_CUTOFF_DATE )
					? __(
							'Your current Universal Analytics property will stop collecting data on July 1, 2023',
							'google-site-kit'
					  )
					: __(
							'Your current Universal Analytics property stopped collecting data on July 1, 2023',
							'google-site-kit'
					  )
			}
		/>
	);
}
