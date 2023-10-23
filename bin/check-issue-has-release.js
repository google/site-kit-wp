#!/usr/bin/env node
/* eslint-disable sitekit/acronym-case */
/* eslint-disable no-console */

async function graphQlFetch(query, variables) {
  const response = fetch('https://api.zenhub.com/public/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.ZENHUB_GQL_API_TOKEN}`,
    },
    body: new Blob([JSON.stringify({ query, variables })], {
      type: 'application/json',
    }),
  });
    
  if (!response.ok) {
    throw new Error( 'ZenHub API request failed.' );
  }
  
  return response.json();
}

async function checkIssueHasRelease({ repositoryGhId, prNumber }) {
  const query = `
    query($repositoryGhId: Int!, $prNumber: Int!) {
      issueByInfo(repositoryGhId: $repositoryGhId, issueNumber: $prNumber) {
        connections {
          nodes {
            number
            releases {
              nodes {
                title
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await graphQlFetch(query, {
      repositoryGhId: parseInt(repositoryGhId, 10),
      prNumber: parseInt(prNumber, 10),
    });
    const { data, errors } = response;

    if (errors) {
      console.error(`Error: ${errors[0].message}. ⚠️`);

      process.exit(1);
    }

    const [ connectedIssue ] = data.issueByInfo?.connections?.nodes || [];

    if (! connectedIssue) {
      console.error('❌ Pull Request is missing a connected issue.\n');

      process.exit(1);
    }

    const connectedRelease = connectedIssue?.releases?.nodes?.[0];

    if (connectedRelease) {
      console.log(`✅ Connected issue #${connectedIssue.number} is in release ${connectedRelease.title}. 👍`);

      process.exit(0);
    }

    console.error(`❌ Connected issue #${connectedIssue.number} is missing a Zenhub release.\n`);

    console.error(`Please assign a release to this issue before merging: https://github.com/google/site-kit-wp/issues/${connectedIssue.number}`);

    process.exit(1);
  } catch (error) {
    console.error('Error: Unknown error. ⚠️', error);

    process.exit(1);
  }
}

checkIssueHasRelease({
  repositoryGhId: process.env.GITHUB_REPOSITORY_ID,
  prNumber: process.env.PULL_REQUEST_NUMBER,
});
