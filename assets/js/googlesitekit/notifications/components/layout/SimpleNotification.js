/**
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
import { useMount } from 'react-use';

/**
 * Internal dependencies
 */
import { Cell, Grid, Row } from '../../../../material-components';
import Title from '../common/Title';
import { deleteItem, getItem, setItem } from '../../../api/cache';
import { useState } from '@wordpress/element';
import { useSelect } from 'googlesitekit-data';
import { CORE_LOCATION } from '../../../datastore/location/constants';

export default function SimpleNotification( {
	actions,
	ctaLink,
	description,
	dismissExpires = 0,
	id,
	isDismissible = true,
	showOnce = false,
	title,
} ) {
	// Start with an undefined dismissed state due to async resolution.
	const [ isDismissed, setIsDismissed ] = useState( false );
	const cacheKeyDismissed = `notification::dismissed::${ id }`;

	// Persists the notification dismissal to browser storage.
	// Dismissed notifications don't expire.
	//
	// We should not use the getReferenceDate selector here because we need
	// the current time while the selector returns date only.
	const persistDismissal = () =>
		setItem( cacheKeyDismissed, new Date(), { ttl: null } ); // eslint-disable-line sitekit/no-direct-date

	useMount( async () => {
		if ( dismissExpires > 0 ) {
			await expireDismiss();
		}

		if ( isDismissible ) {
			const { cacheHit } = await getItem( cacheKeyDismissed );
			setIsDismissed( cacheHit );
		}

		if ( showOnce ) {
			// Set the dismissed flag in cache without immediately hiding it.
			await persistDismissal();
		}
	} );

	const expireDismiss = async () => {
		const { value: dismissed } = await getItem( cacheKeyDismissed );

		if ( dismissed ) {
			// Valid use of `new Date()` with an argument.
			// eslint-disable-next-line sitekit/no-direct-date
			const expiration = new Date( dismissed );

			expiration.setSeconds(
				expiration.getSeconds() + parseInt( dismissExpires, 10 )
			);

			// We don't use the getReferenceDate selector here because it returns
			// the current date only while we need the current time as well to
			// properly determine expiration.
			//
			// eslint-disable-next-line sitekit/no-direct-date
			if ( expiration < new Date() ) {
				await deleteItem( cacheKeyDismissed );
			}
		}
	};

	const isNavigatingToCTALink = useSelect( ( select ) =>
		ctaLink ? select( CORE_LOCATION ).isNavigatingTo( ctaLink ) : false
	);

	// isDismissed will be undefined until resolved from browser storage.
	// isNavigating will be true until the navigation is complete.
	if (
		! isNavigatingToCTALink &&
		isDismissible &&
		( undefined === isDismissed || isDismissed )
	) {
		return null;
	}

	return (
		<Grid>
			<Row>
				<Cell
					smSize={ 3 }
					mdSize={ 7 }
					lgSize={ 11 }
					className="googlesitekit-publisher-win__content"
				>
					<Title title={ title }></Title>

					{ description }

					{ actions }
				</Cell>
			</Row>
		</Grid>
	);
}
