<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service;

use Google\Client;

/**
 * Service definition for WebContentPublisher (v1).
 *
 * <p>
 * webcontentpublisher.googleapis.com API, a service for web content publishers.</p>
 *
 * <p>
 * For more information about this service, see the API
 * <a href="https://developers.google.com/news/subscribe" target="_blank">Documentation</a>
 * </p>
 *
 * @author Google, Inc.
 */
class WebContentPublisher extends \Google\Service
{
  /** Private Service: https://www.googleapis.com/auth/subscribewithgoogle.publications.entitlements.manage. */
  const SUBSCRIBEWITHGOOGLE_PUBLICATIONS_ENTITLEMENTS_MANAGE =
      "https://www.googleapis.com/auth/subscribewithgoogle.publications.entitlements.manage";
  /** See and review your subscription information. */
  const SUBSCRIBEWITHGOOGLE_PUBLICATIONS_ENTITLEMENTS_READONLY =
      "https://www.googleapis.com/auth/subscribewithgoogle.publications.entitlements.readonly";

  public $organizations_publications;
  public $organizations_publications_ctas;
  public $publications;
  public $users;
  public $rootUrlTemplate;

  /**
   * Constructs the internal representation of the WebContentPublisher service.
   *
   * @param Client|array $clientOrConfig The client used to deliver requests, or a
   *                                     config array to pass to a new Client instance.
   * @param string $rootUrl The root URL used for requests to the service.
   */
  public function __construct($clientOrConfig = [], $rootUrl = null)
  {
    parent::__construct($clientOrConfig);
    $this->rootUrl = $rootUrl ?: 'https://webcontentpublisher.googleapis.com/';
    $this->rootUrlTemplate = $rootUrl ?: 'https://webcontentpublisher.UNIVERSE_DOMAIN/';
    $this->servicePath = '';
    $this->batchPath = 'batch';
    $this->version = 'v1';
    $this->serviceName = 'webcontentpublisher';

    $this->organizations_publications = new WebContentPublisher\Resource\OrganizationsPublications(
        $this,
        $this->serviceName,
        'publications',
        [
          'methods' => [
            'create' => [
              'path' => 'v1/{+parent}/publications',
              'httpMethod' => 'POST',
              'parameters' => [
                'parent' => [
                  'location' => 'path',
                  'type' => 'string',
                  'required' => true,
                ],
                'publicationId' => [
                  'location' => 'query',
                  'type' => 'string',
                ],
              ],
            ],'get' => [
              'path' => 'v1/{+name}',
              'httpMethod' => 'GET',
              'parameters' => [
                'name' => [
                  'location' => 'path',
                  'type' => 'string',
                  'required' => true,
                ],
              ],
            ],'list' => [
              'path' => 'v1/{+parent}/publications',
              'httpMethod' => 'GET',
              'parameters' => [
                'parent' => [
                  'location' => 'path',
                  'type' => 'string',
                  'required' => true,
                ],
                'filter' => [
                  'location' => 'query',
                  'type' => 'string',
                ],
                'pageSize' => [
                  'location' => 'query',
                  'type' => 'integer',
                ],
                'pageToken' => [
                  'location' => 'query',
                  'type' => 'string',
                ],
              ],
            ],'patch' => [
              'path' => 'v1/{+name}',
              'httpMethod' => 'PATCH',
              'parameters' => [
                'name' => [
                  'location' => 'path',
                  'type' => 'string',
                  'required' => true,
                ],
                'updateMask' => [
                  'location' => 'query',
                  'type' => 'string',
                ],
              ],
            ],
          ]
        ]
    );
    $this->organizations_publications_ctas = new WebContentPublisher\Resource\OrganizationsPublicationsCtas(
        $this,
        $this->serviceName,
        'ctas',
        [
          'methods' => [
            'create' => [
              'path' => 'v1/{+parent}/ctas',
              'httpMethod' => 'POST',
              'parameters' => [
                'parent' => [
                  'location' => 'path',
                  'type' => 'string',
                  'required' => true,
                ],
                'ctaId' => [
                  'location' => 'query',
                  'type' => 'string',
                ],
              ],
            ],'get' => [
              'path' => 'v1/{+name}',
              'httpMethod' => 'GET',
              'parameters' => [
                'name' => [
                  'location' => 'path',
                  'type' => 'string',
                  'required' => true,
                ],
              ],
            ],'list' => [
              'path' => 'v1/{+parent}/ctas',
              'httpMethod' => 'GET',
              'parameters' => [
                'parent' => [
                  'location' => 'path',
                  'type' => 'string',
                  'required' => true,
                ],
                'pageSize' => [
                  'location' => 'query',
                  'type' => 'integer',
                ],
                'pageToken' => [
                  'location' => 'query',
                  'type' => 'string',
                ],
              ],
            ],'patch' => [
              'path' => 'v1/{+name}',
              'httpMethod' => 'PATCH',
              'parameters' => [
                'name' => [
                  'location' => 'path',
                  'type' => 'string',
                  'required' => true,
                ],
                'updateMask' => [
                  'location' => 'query',
                  'type' => 'string',
                ],
              ],
            ],
          ]
        ]
    );
    $this->publications = new WebContentPublisher\Resource\Publications(
        $this,
        $this->serviceName,
        'publications',
        [
          'methods' => [
            'checkFreeAccess' => [
              'path' => 'v1/{+name}:checkFreeAccess',
              'httpMethod' => 'GET',
              'parameters' => [
                'name' => [
                  'location' => 'path',
                  'type' => 'string',
                  'required' => true,
                ],
                'httpReferrer' => [
                  'location' => 'query',
                  'type' => 'string',
                ],
                'uri' => [
                  'location' => 'query',
                  'type' => 'string',
                ],
              ],
            ],
          ]
        ]
    );
    $this->users = new WebContentPublisher\Resource\Users(
        $this,
        $this->serviceName,
        'users',
        [
          'methods' => [
            'generatePlatformSiteTokens' => [
              'path' => 'v1/{+name}:generatePlatformSiteTokens',
              'httpMethod' => 'POST',
              'parameters' => [
                'name' => [
                  'location' => 'path',
                  'type' => 'string',
                  'required' => true,
                ],
              ],
            ],
          ]
        ]
    );
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(WebContentPublisher::class, 'Google_Service_WebContentPublisher');
