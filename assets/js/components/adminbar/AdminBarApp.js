/**
 * Admin Bar App component.
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
import { Fragment, useCallback } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { useSelect } from 'googlesitekit-data';
import Link from '../Link';
import { Cell, Grid, Row } from '../../material-components';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { decodeHTMLEntity, trackEvent } from '../../util';
import AdminBarWidgets from './AdminBarWidgets';
import useViewContext from '../../hooks/useViewContext';

export default function AdminBarApp() {
	const viewContext = useViewContext();

	const currentEntityURL = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityURL()
	);
	const currentEntityTitle = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityTitle()
	);
	const detailsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', {
			permaLink: currentEntityURL,
		} )
	);
	const dateRangeLength = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeNumberOfDays()
	);

	const onMoreDetailsClick = useCallback( async () => {
		await trackEvent( viewContext, 'open_urldetails' );
		document.location.assign( detailsURL );
	}, [ detailsURL, viewContext ] );

	// Only show the adminbar on valid pages and posts.
	if ( ! detailsURL || ! currentEntityURL ) {
		return null;
	}

	return (
		<Fragment>
			<Grid>
				<Row>
					<Cell alignMiddle size={ 3 }>
						<div className="googlesitekit-adminbar__subtitle">
							{ __( 'Stats for', 'google-site-kit' ) }
						</div>
						<div className="googlesitekit-adminbar__title">
							{ currentEntityTitle
								? decodeHTMLEntity( currentEntityTitle )
								: currentEntityURL }
							<p className="googlesitekit-adminbar__title--date-range">
								{ sprintf(
									/* translators: %s: number of days */
									_n(
										'over the last %s day',
										'over the last %s days',
										dateRangeLength,
										'google-site-kit'
									),
									dateRangeLength
								) }
							</p>
						</div>
					</Cell>

					<Cell alignMiddle mdSize={ 8 } lgSize={ 7 }>
						<AdminBarWidgets />
					</Cell>

					<Cell alignMiddle size={ 2 }>
						<Link
							className="googlesitekit-adminbar__link"
							href="#"
							onClick={ onMoreDetailsClick }
						>
							{ __( 'More details', 'google-site-kit' ) }
						</Link>
					</Cell>
				</Row>
			</Grid>
			<Link
				className="googlesitekit-adminbar__link googlesitekit-adminbar__link--mobile"
				href="#"
				onClick={ onMoreDetailsClick }
			>
				{ __( 'More details', 'google-site-kit' ) }
			</Link>
		</Fragment>
	);
}
