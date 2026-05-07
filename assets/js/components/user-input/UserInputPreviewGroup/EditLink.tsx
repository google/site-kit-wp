/**
 * UserInputPreviewGroup EditLink component.
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
 * External dependencies
 */
import { type FC, type RefObject } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import ChevronDownIcon from '@/svg/icons/chevron-down.svg';

interface EditLinkProps {
	isEditing: boolean;
	isDisabled: boolean;
	onClick: () => void;
	linkRef: RefObject< { focus?: () => void } >;
}

const EditLink: FC< EditLinkProps > = ( {
	isEditing,
	isDisabled,
	onClick,
	linkRef,
} ) => {
	return (
		<Link
			onClick={ onClick }
			ref={ linkRef }
			disabled={ isDisabled }
			trailingIcon={ <ChevronDownIcon width={ 20 } height={ 20 } /> }
			secondary
			linkButton
		>
			{ isEditing
				? __( 'Close', 'google-site-kit' )
				: __( 'Edit', 'google-site-kit' ) }
		</Link>
	);
};

export default EditLink;
