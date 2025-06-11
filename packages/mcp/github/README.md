# Site Kit GitHub Issues MCP Server

This MCP (Model Context Protocol) server provides tools to fetch issues from the google/site-kit-wp GitHub repository using the GitHub API.

## Features

- **Get Issue**: Fetch a specific issue by number
- **List Issues**: Fetch multiple issues with optional filtering
- **GitHub API Integration**: Uses the official GitHub REST API
- **Rate Limit Handling**: Includes proper error handling for rate limits
- **Token Support**: Optional GitHub token support for higher rate limits

## Usage

### Running the Server

```bash
npm start
```

### Available Tools

#### `get_github_issue`

Fetch a specific issue from google/site-kit-wp repository.

**Parameters:**
- `issue_number` (required): The GitHub issue number to fetch
- `github_token` (optional): GitHub API token for higher rate limits

**Example:**
```json
{
  "issue_number": 1234,
  "github_token": "ghp_xxxxxxxxxxxx"
}
```

#### `list_github_issues`

List issues from google/site-kit-wp repository with optional filters.

**Parameters:**
- `state` (optional): Issue state filter - "open", "closed", or "all" (default: "open")
- `labels` (optional): Comma-separated list of label names to filter by
- `sort` (optional): Sort issues by "created", "updated", or "comments" (default: "created")
- `direction` (optional): Sort direction "asc" or "desc" (default: "desc")
- `per_page` (optional): Number of issues per page, 1-100 (default: 30)
- `page` (optional): Page number (default: 1)
- `github_token` (optional): GitHub API token for higher rate limits

**Example:**
```json
{
  "state": "open",
  "labels": "bug,priority:high",
  "sort": "updated",
  "direction": "desc",
  "per_page": 10,
  "page": 1,
  "github_token": "ghp_xxxxxxxxxxxx"
}
```

## GitHub API Rate Limits

The server works without authentication but has limited rate limits (60 requests per hour per IP). For higher rate limits (5000 requests per hour), provide a GitHub personal access token.

### Creating a GitHub Token

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `public_repo` scope
3. Use the token in the `github_token` parameter

## Error Handling

The server includes comprehensive error handling for:
- Network connectivity issues
- GitHub API rate limits
- Invalid issue numbers
- API errors and timeouts

## Response Format

### Issue Data Structure

```json
{
  "number": 1234,
  "title": "Issue title",
  "body": "Issue description...",
  "state": "open",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-02T00:00:00Z",
  "closed_at": null,
  "author": "username",
  "assignees": ["assignee1", "assignee2"],
  "labels": [
    {
      "name": "bug",
      "color": "d73a4a",
      "description": "Something isn't working"
    }
  ],
  "milestone": {
    "title": "v1.0.0",
    "description": "First release",
    "state": "open",
    "due_on": "2023-12-31T00:00:00Z"
  },
  "comments_count": 5,
  "html_url": "https://github.com/google/site-kit-wp/issues/1234",
  "api_url": "https://api.github.com/repos/google/site-kit-wp/issues/1234"
}
```
