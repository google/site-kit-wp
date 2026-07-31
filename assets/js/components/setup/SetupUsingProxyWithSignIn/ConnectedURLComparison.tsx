/**
 * ConnectedURLComparison component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import P from '@/js/components/Typography/P';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
} from '@/js/googlesitekit/datastore/user/constants';

const ConnectedURLComparison: FC = () => {
	const connectedProxyURL = useSelect(
		( select: Select ) => select( CORE_USER ).getConnectedProxyURL(),
		[]
	);
	const disconnectedReason = useSelect(
		( select: Select ) => select( CORE_USER ).getDisconnectedReason(),
		[]
	);
	const homeURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getHomeURL(),
		[]
	);

	if (
		DISCONNECTED_REASON_CONNECTED_URL_MISMATCH !== disconnectedReason ||
		! connectedProxyURL ||
		! homeURL ||
		connectedProxyURL === homeURL
	) {
		return null;
	}

	return (
		/* @ts-expect-error The `P` component incorrectly requires `size` in TypeScript components. */
		<P as="ul">
			<li>
				{ sprintf(
					/* translators: %s: the URL the site connected with, eg. "https://oldsite.com/". */
					__( 'Old URL: %s', 'google-site-kit' ),
					connectedProxyURL
				) }
			</li>
			<li>
				{ sprintf(
					/* translators: %s: the URL the site currently uses, eg. "https://newsite.com/". */
					__( 'New URL: %s', 'google-site-kit' ),
					homeURL
				) }
			</li>
		</P>
	);
};

export default ConnectedURLComparison;
