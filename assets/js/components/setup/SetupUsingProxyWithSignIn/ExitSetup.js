/**
 * Header component for ExitSetup.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from '@/js/googlesitekit-components';
import { useDispatch, useSelect } from '@/js/googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';

export default function ExitSetup() {
	const adminURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getAdminURL();
	} );

	const { navigateTo } = useDispatch( CORE_LOCATION );

	function handleClick() {
		navigateTo( `${ adminURL }plugins.php` );
	}

	return (
		<Button onClick={ handleClick } tertiary>
			{ __( 'Exit setup', 'google-site-kit' ) }
		</Button>
	);
}
