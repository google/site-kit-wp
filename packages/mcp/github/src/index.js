#!/usr/bin/env node

const { Server } = require( '@modelcontextprotocol/sdk/server/index.js' );
const {
	StdioServerTransport,
} = require( '@modelcontextprotocol/sdk/server/stdio.js' );
const {
	ListToolsRequestSchema,
	CallToolRequestSchema,
	McpError,
	ErrorCode,
} = require( '@modelcontextprotocol/sdk/types.js' );

const { GetIssueArgsSchema } = require( './schemas/get-issue-args.js' );
const { GitHubIssuesFetcher } = require( './github-issues-fetcher.js' );

const gitHubFetcher = new GitHubIssuesFetcher();

const server = new Server(
	{
		name: 'site-kit-github-issues',
		version: '1.0.0',
	},
	{
		capabilities: {
			tools: {},
		},
	}
);

server.setRequestHandler( ListToolsRequestSchema, async () => ( {
	tools: [
		{
			name: 'get_github_issue',
			description:
				'Fetch a specific issue from the google/site-kit-wp GitHub repository by issue number',
			inputSchema: {
				type: 'object',
				properties: GetIssueArgsSchema,
			},
		},
	],
} ) );

server.setRequestHandler( CallToolRequestSchema, async ( request ) => {
	try {
		switch ( request.params.name ) {
			case 'get_github_issue':
				const { issue_number: number, github_token: token } =
					request.params.arguments;
				const issue = await gitHubFetcher.fetchIssue( number, token );

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify( issue, null, 2 ),
						},
					],
				};
		}

		throw new Error( `Unknown tool: ${ request.params.name }` );
	} catch ( error ) {
		if ( error instanceof McpError ) {
			throw error;
		}
		throw new McpError(
			ErrorCode.InternalError,
			`Unexpected error: ${ error }`
		);
	}
} );

server.onerror = ( error ) => {
	console.error( error );
};

async function main() {
	const transport = new StdioServerTransport();
	await server.connect( transport );
	console.error( 'Node Version: ', process.version );
	console.error( 'Site Kit GitHub Issues MCP server running on stdio' );
}

// Handle cleanup
process.on( 'SIGINT', async () => {
	await server.close();
	process.exit( 0 );
} );

main().catch( ( error ) => {
	console.error( error );
	process.exit( 1 );
} );
