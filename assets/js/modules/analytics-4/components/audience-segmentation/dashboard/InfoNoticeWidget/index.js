/**
 * InfoNoticeWidget component.
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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import whenActive from '../../../../../../util/when-active';
import InfoNotice from '../InfoNotice';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { AUDIENCE_INFO_NOTICE_SLUG, AUDIENCE_INFO_NOTICES } from './constant';
import { WEEK_IN_SECONDS } from '../../../../../../util';

const { useSelect, useDispatch } = Data;

function InfoNoticeWidget( { Widget } ) {
	const noticesCount = AUDIENCE_INFO_NOTICES.length;

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isPromptDismissed( AUDIENCE_INFO_NOTICE_SLUG )
	);

	const dismissCount = useSelect( ( select ) =>
		select( CORE_USER ).getPromptDismissCount( AUDIENCE_INFO_NOTICE_SLUG )
	);

	const { dismissPrompt } = useDispatch( CORE_USER );

	const onDismiss = async () => {
		const twoWeeksInSeconds = WEEK_IN_SECONDS * 2;
		const expiry = dismissCount + 1 < noticesCount ? twoWeeksInSeconds : 0;

		await dismissPrompt( AUDIENCE_INFO_NOTICE_SLUG, {
			expiresInSeconds: expiry,
		} );
	};

	// Return null if permanently dismissed.
	if (
		isDismissed ||
		dismissCount === undefined ||
		dismissCount >= noticesCount
	) {
		return null;
	}

	return (
		<Widget noPadding>
			<InfoNotice
				content={ AUDIENCE_INFO_NOTICES[ dismissCount ] }
				dismissLabel={ __( 'Got it', 'google-site-kit' ) }
				onDismiss={ onDismiss }
			/>
		</Widget>
	);
}

InfoNoticeWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( { moduleName: 'analytics-4' } )( InfoNoticeWidget );
