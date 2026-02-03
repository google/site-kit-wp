/**
 * SettingsStatus component for Reader Revenue Manager.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { type Select, useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	CONTENT_POLICY_STATES,
	MODULE_SLUG_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import Badge from '@/js/components/Badge';
import DefaultSettingsStatus from '@/js/components/settings/SettingsActiveModule/DefaultSettingsStatus';
import { useFeature } from '@/js/hooks/useFeature';

interface SettingsStatusProps {
	slug: string;
}

const SettingsStatus: FC< SettingsStatusProps > = ( { slug } ) => {
	const rrmPolicyViolationsEnabled = useFeature(
		'rrmPolicyViolations'
	) as boolean;

	const isConnected = useSelect( ( select: Select ) =>
		select( CORE_MODULES ).isModuleConnected(
			MODULE_SLUG_READER_REVENUE_MANAGER
		)
	);

	const hasPolicyViolation = useSelect( ( select: Select ) => {
		const contentPolicyState = select(
			MODULES_READER_REVENUE_MANAGER
		).getContentPolicyState();

		return (
			contentPolicyState &&
			contentPolicyState !== CONTENT_POLICY_STATES.CONTENT_POLICY_STATE_OK
		);
	} );

	if ( rrmPolicyViolationsEnabled && isConnected && hasPolicyViolation ) {
		return (
			<Badge
				// @ts-expect-error - The `Badge` component is not typed yet.
				label={ __( 'Action needed', 'google-site-kit' ) }
				className="googlesitekit-badge--warning"
			/>
		);
	}

	return <DefaultSettingsStatus slug={ slug } />;
};

export default SettingsStatus;
