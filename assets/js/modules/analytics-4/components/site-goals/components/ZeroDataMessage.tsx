/**
 * Site Goals ZeroDataMessage component.
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
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, type Select } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';

type MetricLabel = 'sales' | 'leads' | 'visitors';

interface ZeroDataMessageProps {
	metricLabel?: string;
}

const METRIC_LABELS = {
	sales: {
		page: __(
			'No data to display: your page hasn’t received any sales yet',
			'google-site-kit'
		),
		site: __(
			'No data to display: your site hasn’t received any sales yet',
			'google-site-kit'
		),
	},
	leads: {
		page: __(
			'No data to display: your page hasn’t received any leads yet',
			'google-site-kit'
		),
		site: __(
			'No data to display: your site hasn’t received any leads yet',
			'google-site-kit'
		),
	},
	visitors: {
		page: __(
			'No data to display: your page hasn’t received any visitors yet',
			'google-site-kit'
		),
		site: __(
			'No data to display: your site hasn’t received any visitors yet',
			'google-site-kit'
		),
	},
};

const ZeroDataMessage: FC< ZeroDataMessageProps > = ( {
	metricLabel = 'visitors',
} ) => {
	const url = useSelect(
		( select: Select ) => select( CORE_SITE ).getCurrentEntityURL(),
		[]
	);

	const resolvedMetricLabel: MetricLabel =
		metricLabel === 'sales' || metricLabel === 'leads'
			? metricLabel
			: 'visitors';
	const labels = METRIC_LABELS[ resolvedMetricLabel ];

	return <span>{ url ? labels.page : labels.site }</span>;
};

export default ZeroDataMessage;
