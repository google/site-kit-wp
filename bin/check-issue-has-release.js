#!/usr/bin/env node
/* eslint-disable no-console */
const { GraphQLClient, gql } = require('graphql-request')

const checkIssueHasRelease = async () => {
  const client = new GraphQLClient('https://api.zenhub.com/public/graphql');

  const query = gql`
    query($repositoryGhId: Int!, $issueNumber: Int!){
      issueByInfo(repositoryGhId: $repositoryGhId, issueNumber: $issueNumber) {
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
    const response = await client.request(query, {
      // eslint-disable-next-line sitekit/acronym-case
      repositoryGhId: parseInt(process.env.GITHUB_REPOSITORY_ID, 10),
      issueNumber: parseInt(process.env.PULL_REQUEST_NUMBER, 10)
    }, {
      authorization: `Bearer ${process.env.ZENHUB_GQL_API_TOKEN}`
    });

    if (response?.issueByInfo?.connections?.nodes?.[0]?.releases?.nodes?.[0]?.title?.length > 0) {
      console.log(`Issue in release ${response.issueByInfo.connections.nodes[0].releases.nodes[0].title}. 👍`);

      process.exit(0);
    }

    console.error('Issue is missing a ZenHub release label. ❌\n');

    console.error(`Please label this issue before merging: https://github.com/google/site-kit-wp/issues/${response.issueByInfo.connections.nodes[0].number}`);

    process.exit(1);
  } catch (errorResponse) {
    if (errorResponse?.response?.errors?.[0].message) {
      console.error(`Error: ${errorResponse.response.errors[0].message}. ⚠️`);
    } else if (errorResponse?.response?.error) {
      console.error(`Error: ${errorResponse.response.error.replace('.\n', '')}. ⚠️`);
    } else {
      console.error('Error: Unknown error. ⚠️');
    }

    process.exit(1);
  }
}

checkIssueHasRelease();
