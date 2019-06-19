## Rest API Endpoint in Site Kit

### GET

#### `google-site-kit/v1/modules/{module-slug}/settings`
Get all the module settings data.

Sample Response:
```json
{
  "checkbox_1":0,
  "text_1":"default value",
  "dropdown_1":"https:\/\/googlesitekitlocal.10uplabs.com"
}
```

#### `google-site-kit/v1/modules/search-console/sites`
Get all sites property from Google Search Console.
Doc: https://developers.google.com/webmaster-tools/search-console-api-original/v3/sites/list

Response:
```json
[
    {
        "permissionLevel": "siteOwner",
        "siteURL": "https://www.domain.com/"
    },
    {
        "permissionLevel": "siteUnverifiedUser",
        "siteURL": "http://googlesitekitlocal.10uplabs.com/"
    },
    {
        "permissionLevel": "siteUnverifiedUser",
        "siteURL": "https://googlesitekitlocal.10uplabs.com/"
    }
]
```

#### `google-site-kit/v1/modules/search-console/verified-sites`
Get verified sites list from Google Site Verification.
Doc: https://developers.google.com/site-verification/v1/webResource/list

Response:
```json
{
    "https%3A%2F%2Fwww.domain.com%2F": {
        "identifier": "https://www.domain.com/",
        "type": "SITE"
    },
    "http%3A%2F%2Fwww.domain.com%2F": {
        "identifier": "http://www.domain.com/",
        "type": "SITE"
    }
}
```

#### `google-site-kit/v1/modules/search-console/matched-sites`
Get all sites list from Google Search Console and have auto matching with the current url.
Doc: https://developers.google.com/site-verification/v1/webResource/list
Auto match algorithm:
1. If siteURL contain `sc-set` skip it.
2. If siteURL is a substring match of WP site URL, it's a matched.

Response:
```json
{
    "sites": [
        {
            "permissionLevel": "siteOwner",
            "siteURL": "https://www.domain.com/"
        },
        {
            "permissionLevel": "siteUnverifiedUser",
            "siteURL": "http://googlesitekitlocal.10uplabs.com/"
        },
        {
            "permissionLevel": "siteUnverifiedUser",
            "siteURL": "https://googlesitekitlocal.10uplabs.com/"
        }
    ],
    "property_matches": [
        "http://googlesitekitlocal.10uplabs.com/",
        "https://googlesitekitlocal.10uplabs.com/"
    ],
    "site_url": "https://googlesitekitlocal.10uplabs.com/"
}
```

#### `google-site-kit/v1/modules/search-console/siteverification-list`
Get verified sites list from site verification and find the closest match.
Doc: https://developers.google.com/site-verification/v1/webResource/list

Response:
```json
{
    "site_url": "https://googlesitekitlocal.10uplabs.com/",
    "matched": true,
    "error": false
}
```

#### `google-site-kit/v1/modules/tagmanager/list-accounts`
Get a list of Tag Manager accounts.
Doc: https://developers.google.com/tag-manager/api/v2/reference/accounts/list

Response:
```json
{
   "nextPageToken":null,
   "account":[
      {
         "accountId":"[ACCOUNT_ID]",
         "fingerprint":null,
         "name":"mycompany",
         "path":"accounts\/1234",
         "shareData":null,
         "tagManagerUrl":null
      }
   ]
}
```

#### `google-site-kit/v1/modules/tagmanager/list-containers`
Get a list of containers assigned to a Tag Manager account.
Doc: https://developers.google.com/tag-manager/api/v2/reference/accounts/containers/list

Request Parameters:
```json
{
	"accountId":"account-id"
}
```

Response:
```json
{
   "nextPageToken":null,
   "container":[
      {
         "accountId":"[ACCOUNT_ID]",
         "containerId":"[CONTAINER_ID]",
         "domainName":null,
         "fingerprint":"12347890",
         "name":"www.mysite.com",
         "notes":null,
         "path":"accounts\/1234\/containers\/12345",
         "publicId":"GTM-123456",
         "tagManagerUrl":"https:\/\/tagmanager.google.com\/#\/container\/accounts\/123\/containers\/123\/workspaces?apiLink=container",
         "usageContext":[
            "web"
         ]
      }
   ]
}
```

#### `/google-site-kit/v1/data`
This endpoint used for batch request from the client.
Accept params:
key: request
value: json encoded

Sample Request:
```
https://googlesitekitlocal.10uplabs.com/wp-json/google-site-kit/v1/data/?request=[{"dataObject":"modules","identifier":"search-console","datapoint":"page-analytics","priority":1},{"dataObject":"modules","identifier":"search-console","datapoint":"site-analytics","priority":2},{"dataObject":"something","identifier":"analytics","datapoint":"sites","priority":3},{"dataObject":"modules","identifier":"search-console","datapoint":"site-health","priority":3}]
```

Response:
```
{
    "response-page-analytics": {},
    "response-site-analytics": {},
    "response-site-health": {}
}
```

### POST

#### `google-site-kit/v1/modules/{module-slug}/settings`
Save all the module settings data.

Sample Response:
```json
{
  "data":{
    "checkbox_1":0,
    "text_1":"default value",
    "dropdown_1":"https:\/\/googlesitekitlocal.10uplabs.com"
  }
}
```

#### `google-site-kit/v1/modules/search-console/insert`
Add a site url to Google Search Console property
Doc: https://developers.google.com/webmaster-tools/search-console-api-original/v3/sites/add

Request Body:
```json
{
	"data":{"siteURL": "https://googlesitekitlocal.10uplabs.com/"}
}
```

Response:
```json
{
    "sites": [
        "https://googlesitekitlocal.10uplabs.com",
        "http://googlesitekitlocal.10uplabs.com"
    ]
}
```

#### `google-site-kit/v1/modules/search-console/save-option`
Save site url to Site Kit option

Request Body:
```json
{
	"data":{"siteURL": "https://googlesitekitlocal.10uplabs.com/"}
}
```

Response:
```json
{
    "updated": true
}
```

#### `google-site-kit/v1/modules/search-console/siteverification`
Add site url and it's permute urls to site verification, and let the site verification verified the site using meta verification key.
Then when it's verified, add the same urls to search console property.

Request Body:
```json
{
	"data":{"siteURL": "https://googlesitekitlocal.10uplabs.com/"}
}
```

Response:
```json
{
    "updated": true,
    "sites": [
        "https://googlesitekitlocal.10uplabs.com",
        "http://googlesitekitlocal.10uplabs.com"
    ],
    "identifier": "https://googlesitekitlocal.10uplabs.com"
}
```
