/**
 * Dashboard PageSpeed Widget component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { useSelect, useDispatch } from 'googlesitekit-data';
import Link from '../../../../../components/Link';
import ReportDetailsLink from '../../common/ReportDetailsLink';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import {
	MODULES_PAGESPEED_INSIGHTS,
	STRATEGY_MOBILE,
	STRATEGY_DESKTOP,
	DATA_SRC_LAB,
	UI_DATA_SOURCE,
} from '../../../datastore/constants';
import Spinner from '../../../../../components/Spinner';

export default function Footer( { isFetching } ) {
	const referenceURL = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentReferenceURL()
	);

	const dataSrc =
		useSelect( ( select ) =>
			select( CORE_UI ).getValue( UI_DATA_SOURCE )
		) || DATA_SRC_LAB;

	const { invalidateResolution } = useDispatch( MODULES_PAGESPEED_INSIGHTS );

	const updateReport = useCallback(
		async ( event ) => {
			event.preventDefault();

			// Invalidate the PageSpeed API request caches.
			await API.invalidateCache(
				'modules',
				'pagespeed-insights',
				'pagespeed'
			);

			// Invalidate the cached resolver.
			invalidateResolution( 'getReport', [
				referenceURL,
				STRATEGY_DESKTOP,
			] );
			invalidateResolution( 'getReport', [
				referenceURL,
				STRATEGY_MOBILE,
			] );
		},
		[ invalidateResolution, referenceURL ]
	);

	return (
		<div
			className={ classnames( 'googlesitekit-pagespeed-report__footer', {
				'googlesitekit-pagespeed-report__footer--with-action':
					dataSrc === DATA_SRC_LAB,
			} ) }
		>
			{ dataSrc === DATA_SRC_LAB && (
				<div>
					<Link onClick={ updateReport } disabled={ isFetching }>
						{ __( 'Run test again', 'google-site-kit' ) }
					</Link>
					<Spinner isSaving={ isFetching } />
				</div>
			) }
			<ReportDetailsLink />
		</div>
	);
}
