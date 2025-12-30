/**
 * Sign in with Google compatibility error notice.
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
import Notice from '@/js/components/Notice';
import Typography from '@/js/components/Typography';
import { getErrorMessages } from './utils';

export default function CompatibilityErrorNotice( { errors } ) {
	const errorMessages = getErrorMessages( errors );

	if ( errorMessages.length === 0 ) {
		return null;
	}

	return (
		<Notice
			className="googlesitekit-sign-in-with-google-compatibility-notice"
			type={ Notice.TYPES.WARNING }
			title={ __(
				'Your site may not be ready for Sign In With Google',
				'google-site-kit'
			) }
			description={ errorMessages.map( ( message, index ) => (
				<Typography key={ `${ index }-${ message }` }>
					{ message }
				</Typography>
			) ) }
			dismiss={ false }
		/>
	);
}

CompatibilityErrorNotice.propTypes = {
	error: PropTypes.object,
};
