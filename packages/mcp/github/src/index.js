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
const { ListIssuesArgsSchema } = require( './schemas/list-issues-args.js' );
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
			inputSchema: GetIssueArgsSchema,
		},
		{
			name: 'list_github_issues',
			description:
				'List issues from the google/site-kit-wp GitHub repository with optional filters',
			inputSchema: ListIssuesArgsSchema,
		},
	],
} ) );

server.setRequestHandler( CallToolRequestSchema, async ( args ) => {
	try {
		const { tool_name, tool_input } = CallToolRequestSchema.parse( args );

		switch ( tool_name ) {
			case 'get_github_issue':
				const { issue_number, github_token } =
					GetIssueArgsSchema.parse( tool_input );
				const issue = await gitHubFetcher.fetchIssue(
					issue_number,
					github_token
				);

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify( issue, null, 2 ),
						},
					],
				};
			case 'list_github_issues':
				const { github_token: token, ...options } =
					ListIssuesArgsSchema.parse( tool_input );
				const issues = await gitHubFetcher.fetchIssues(
					options,
					token
				);

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify( issues, null, 2 ),
						},
					],
				};
		}

		throw new Error( `Unknown tool: ${ tool_name }` );
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
	console.error( '[MCP Error]', error );
};

async function main() {
	const transport = new StdioServerTransport();
	await server.connect( transport );
	console.error( '[MCP Info] Node Version: ', process.version );
	console.error(
		'[MCP Info] Site Kit GitHub Issues MCP server running on stdio'
	);
}

// Handle cleanup
process.on( 'SIGINT', async () => {
	await server.close();
	process.exit( 0 );
} );

main().catch( ( error ) => {
	console.error( '[MCP Error]', error );
	process.exit( 1 );
} );
