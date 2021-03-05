/**
 * Footer component of the ModulePopularPagesWidget widget.
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
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS } from '../../../datastore/constants';
import LayoutFooter from '../../../../../components/layout/LayoutFooter';
const { useSelect } = Data;

export default function Footer() {
	const visitorsOverview = useSelect( ( select ) => select( MODULES_ANALYTICS ).getServiceReportURL( 'visitors-overview' ) );

	return (
		<LayoutFooter
			ctaLabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
			ctaLink={ visitorsOverview }
		/>
	);
}
