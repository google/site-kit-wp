/**
 * HTTPSWarning component.
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
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { isURLUsingHTTPS } from '../../util/is-url-using-https';
import Notice from '../Notice';

export default function HTTPSWarning( { moduleSlug } ) {
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);
	const homeURL = useSelect( ( select ) => select( CORE_SITE ).getHomeURL() );

	if (
		! module?.name ||
		( homeURL !== undefined && isURLUsingHTTPS( homeURL ) )
	) {
		return null;
	}

	const moduleName = module.name;

	return (
		<Notice
			type="warning"
			description={ sprintf(
				/* translators: %s: Module name. */
				__(
					'The site should use HTTPS to set up %s',
					'google-site-kit'
				),
				moduleName
			) }
		/>
	);
}

HTTPSWarning.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
};
