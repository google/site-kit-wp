/**
 * ReportZero component.
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

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import CTA from './notifications/CTA';

export default function ReportZero( { moduleSlug } ) {
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);

	return (
		<CTA
			title={ sprintf(
				/* translators: %s: Module name */
				__( '%s Gathering Data', 'google-site-kit' ),
				module?.name
			) }
			description={ sprintf(
				/* translators: %s: Module name */
				__(
					'%s data is not yet available, please check back later',
					'google-site-kit'
				),
				module?.name
			) }
		/>
	);
}

ReportZero.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
};
