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
 * Service definition for SubscribewithGoogle (v1).
 *
 * <p>
 * The Subscribe with Google Publication APIs enable a publisher to fetch
 * information related to their SwG subscriptions, including the entitlement
 * status of users who are requesting publisher content, the publications owned
 * by the publisher, the entitlements plans of their SwG readers, the readers'
 * profile information and purchase order information.</p>
 *
 * <p>
 * For more information about this service, see the API
 * <a href="https://developers.google.com/news/subscribe/guides/overview" target="_blank">Documentation</a>
 * </p>
 *
 * @author Google, Inc.
 */
class SubscribewithGoogle extends \Google\Service
{
  /** See and review your subscription information. */
  const SUBSCRIBEWITHGOOGLE_PUBLICATIONS_ENTITLEMENTS_READONLY =
      "https://www.googleapis.com/auth/subscribewithgoogle.publications.entitlements.readonly";
  /** See your primary Google Account email address. */
  const USERINFO_EMAIL =
      "https://www.googleapis.com/auth/userinfo.email";

  public $publications;
  public $publications_entitlements;
  public $publications_readers;
  public $publications_readers_entitlementsplans;
  public $publications_readers_orders;
  public $rootUrlTemplate;

  /**
   * Constructs the internal representation of the SubscribewithGoogle service.
   *
   * @param Client|array $clientOrConfig The client used to deliver requests, or a
   *                                     config array to pass to a new Client instance.
   * @param string $rootUrl The root URL used for requests to the service.
   */
  public function __construct($clientOrConfig = [], $rootUrl = null)
  {
    parent::__construct($clientOrConfig);
    $this->rootUrl = $rootUrl ?: 'https://subscribewithgoogle.googleapis.com/';
    $this->rootUrlTemplate = $rootUrl ?: 'https://subscribewithgoogle.UNIVERSE_DOMAIN/';
    $this->servicePath = '';
    $this->batchPath = 'batch';
    $this->version = 'v1';
    $this->serviceName = 'subscribewithgoogle';

    $this->publications = new SubscribewithGoogle\Resource\Publications(
        $this,
        $this->serviceName,
        'publications',
        [
          'methods' => [
            'list' => [
              'path' => 'v1/publications',
              'httpMethod' => 'GET',
              'parameters' => [
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
            ],
          ]
        ]
    );
    $this->publications_entitlements = new SubscribewithGoogle\Resource\PublicationsEntitlements(
        $this,
        $this->serviceName,
        'entitlements',
        [
          'methods' => [
            'list' => [
              'path' => 'v1/publications/{publicationId}/entitlements',
              'httpMethod' => 'GET',
              'parameters' => [
                'publicationId' => [
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
            ],
          ]
        ]
    );
    $this->publications_readers = new SubscribewithGoogle\Resource\PublicationsReaders(
        $this,
        $this->serviceName,
        'readers',
        [
          'methods' => [
            'get' => [
              'path' => 'v1/{+name}',
              'httpMethod' => 'GET',
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
    $this->publications_readers_entitlementsplans = new SubscribewithGoogle\Resource\PublicationsReadersEntitlementsplans(
        $this,
        $this->serviceName,
        'entitlementsplans',
        [
          'methods' => [
            'get' => [
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
              'path' => 'v1/{+parent}/entitlementsplans',
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
            ],
          ]
        ]
    );
    $this->publications_readers_orders = new SubscribewithGoogle\Resource\PublicationsReadersOrders(
        $this,
        $this->serviceName,
        'orders',
        [
          'methods' => [
            'get' => [
              'path' => 'v1/{+name}',
              'httpMethod' => 'GET',
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
class_alias(SubscribewithGoogle::class, 'Google_Service_SubscribewithGoogle');
