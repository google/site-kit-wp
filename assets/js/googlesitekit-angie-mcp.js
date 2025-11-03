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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

/**
 * External dependencies
 */
import { AngieMcpSdk } from '@elementor/angie-sdk';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Define the MCP server
function createSeoMcpServer() {
	const server = new McpServer(
		{ name: 'google-site-kit', title: 'Google Site Kit', version: '1.0.0' },
		{ capabilities: { tools: {} } }
	);

	// Add your tools, resources, etc.
	server.registerTool(
		'get-analytics-report',
		{
			description:
				'Gets analytics report data from the Google Analytics Data API for the connected property in Site Kit',
			inputSchema: {
				startDate: z
					.string()
					.date()
					.describe(
						'The start date of the primary reporting period'
					),
				endDate: z
					.string()
					.date()
					.describe(
						'The end date of the primary reporting period. Must be greater than or equal to startDate.'
					),
				compareStartDate: z
					.string()
					.date()
					.describe(
						'The start date of the comparison reporting period'
					)
					.optional(),
				compareEndDate: z
					.string()
					.date()
					.describe(
						'The start date of the comparison reporting period. Must be greater than or equal to compareStartDate. Required if providing compareStartDate.'
					)
					.optional(),
				dimensions: z
					.array( z.string() )
					.describe(
						'List of report dimensions. E.g. `date`. See https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema for all core reporting dimensions.'
					),
				metrics: z
					.array( z.string() )
					.describe(
						'List of report metrics to include. E.g. `activeUsers`. See https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema for all core reporting metrics.'
					),
				limit: z
					.number()
					.positive()
					.int()
					.describe( 'Maximum number of rows to return.' )
					.optional(),
			},
		},
		async ( args ) => {
			global.console.log( 'googlesitekit-angie:get-analytics-report', {
				args,
			} );

			const response = await await Data.resolveSelect(
				MODULES_ANALYTICS_4
			).getReport( args );

			global.console.log( 'googlesitekit-angie:get-analytics-report', {
				args,
				response,
			} );

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify( response, null, 2 ),
					},
				],
			};
		}
	);

	return server;
}

// Register the server with Angie
const server = createSeoMcpServer();
const sdk = new AngieMcpSdk();
await sdk.registerLocalServer( {
	name: 'google-site-kit',
	version: '1.0.0',
	description: 'Google Site Kit demo for Angie',
	server,
} );

global.console.log( 'Angie MCP registered!', sdk );
