/**
 * PoweredByReaderRevenueManager component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import Typography from '@/js/components/Typography';
import { SIZE_SMALL, TYPE_BODY } from '@/js/components/Typography/constants';
import ReaderRevenueManagerIcon from '@/svg/graphics/reader-revenue-manager.svg';

export default function PoweredByReaderRevenueManager() {
	return (
		<div className="googlesitekit-powered-by googlesitekit-powered-by--reader-revenue-manager">
			<ReaderRevenueManagerIcon
				aria-hidden="true"
				className="googlesitekit-powered-by__icon"
			/>
			<Typography
				as="div"
				className="googlesitekit-powered-by__text"
				size={ SIZE_SMALL }
				type={ TYPE_BODY }
			>
				{ __( 'Powered by Reader Revenue Manager', 'google-site-kit' ) }
			</Typography>
		</div>
	);
}
