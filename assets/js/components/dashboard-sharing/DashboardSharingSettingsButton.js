/**
 * DashboardSharingSettingsButton component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import Dialog, { DialogContent, DialogFooter } from '@material/react-dialog';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../Button';
import Portal from '../Portal';
import ShareIcon from '../../../svg/icons/share.svg';
import Link from '../Link';

export default function DashboardSharingSettingsButton() {
	const [ dialogOpen, setDialogOpen ] = useState( false );

	const handleButtonClick = useCallback( () => {
		setDialogOpen( ! dialogOpen );
	}, [ dialogOpen ] );

	return (
		<Button onClick={ handleButtonClick }>
			<ShareIcon width={ 20 } height={ 20 } />

			<Portal>
				<Dialog open={ dialogOpen } className="googlesitekit-dialog">
					<DialogContent></DialogContent>
					<DialogFooter>
						<Link>{ __( 'Cancel', 'google-site-kit' ) }</Link>
						<Button>{ __( 'Apply', 'google-site-kit' ) }</Button>
					</DialogFooter>
				</Dialog>
			</Portal>
		</Button>
	);
}
