/**
 * ErrorNotice component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import {
	NOTICE_TYPES,
	NOTICE_VARIANTS,
} from '@/js/components/Notice/constants';
import { sanitizeHTML } from '@/js/util';
import {
	getErrorNoticeMessage,
	isErrorRetryable,
	isPermissionScopeError,
} from '@/js/util/errors';
import Notice from './Notice';

export interface ErrorNoticeProps {
	className?: string;
	error?: {
		message?: string;
		data?: {
			reconnectURL?: string;
		};
	};
	hasButton?: boolean;
	storeName?: string;
	message?: string;
	title?: string;
	noPrefix?: boolean;
	skipRetryMessage?: boolean;
	hideIcon?: boolean;
	variant?: NOTICE_VARIANTS;
}

const ErrorNotice: FC< ErrorNoticeProps > = ( {
	className,
	error = {},
	hasButton = false,
	storeName,
	message = error?.message,
	title,
	noPrefix = false,
	skipRetryMessage,
	hideIcon = false,
	variant,
} ) => {
	const dispatch = useDispatch();

	const selectorData = useSelect(
		( select: Select ) => {
			if ( ! storeName ) {
				return null;
			}

			return select( storeName ).getSelectorDataForError( error );
		},
		[ error, storeName ]
	);

	const handleRetry = useCallback( () => {
		if ( ! selectorData ) {
			return;
		}

		dispatch( selectorData.storeName ).invalidateResolution(
			selectorData.name,
			selectorData.args
		);
	}, [ dispatch, selectorData ] );

	// Do not display if there is no error and no direct message text is passed as a direct prop.
	// Also do not display if the error is for missing scopes as these are handled by a popup modal.
	if ( ! message || isPermissionScopeError( error ) ) {
		return null;
	}

	const shouldDisplayRetry =
		hasButton && isErrorRetryable( error, selectorData );

	const errorMessageWithModifications = getErrorNoticeMessage(
		message,
		error,
		{
			noPrefix,
			skipRetryMessage: hasButton || skipRetryMessage,
		}
	);

	const sanitizeArgs = {
		ALLOWED_TAGS: [ 'a' ],
		ALLOWED_ATTR: [ 'href' ],
	};

	return (
		<Notice
			className={ className }
			ctaButton={
				shouldDisplayRetry
					? {
							label: __( 'Retry', 'google-site-kit' ),
							onClick: handleRetry,
					  }
					: undefined
			}
			description={
				// The error messages that come from the server/API can contain
				// HTML (eg. links), so we use `dangerouslySetInnerHTML` and sanitize
				// the HTML to render these links.
				//
				// We tried to use `createInterpolateElement` but it does not work
				// with HTML tags that come from the server/API.
				<span
					dangerouslySetInnerHTML={ sanitizeHTML(
						errorMessageWithModifications,
						sanitizeArgs
					) }
				/>
			}
			hideIcon={ hideIcon }
			title={ title }
			type={ NOTICE_TYPES.ERROR }
			variant={ variant }
		/>
	);
};

export default ErrorNotice;
