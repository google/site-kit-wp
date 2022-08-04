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

/**
 * Service definition for SubscribewithGoogle (v1).
 *
 * <p>
 * The Subscribe with Google Publication APIs enable a publisher to fetch
 * information related to their SwG subscriptions, including the entitlement
 * status of users who are requesting publisher content and the publications
 * owned by the publisher.</p>
 *
 * <p>
 * For more information about this service, see the API
 * <a href="https://developers.google.com/news/subscribe/guides/overview" target="_blank">Documentation</a>
 * </p>
 *
 * @author Google, Inc.
 */
class Google_Service_SubscribewithGoogle extends Google_Service
{
  /** See your primary Google Account email address. */
  const USERINFO_EMAIL =
      "https://www.googleapis.com/auth/userinfo.email";

  public $publications;
  public $publications_entitlements;
  

  /**
   * Constructs the internal representation of the SubscribewithGoogle service.
   *
   * @param Google_Client $client
   */
  public function __construct(Google_Client $client)
  {
    parent::__construct($client);
    $this->rootUrl = 'https://subscribewithgoogle.googleapis.com/';
    $this->servicePath = '';
    $this->batchPath = 'batch';
    $this->version = 'v1';
    $this->serviceName = 'subscribewithgoogle';

    $this->publications = new Google_Service_SubscribewithGoogle_Publications_Resource(
        $this,
        $this->serviceName,
        'publications',
        array(
          'methods' => array(
            'list' => array(
              'path' => 'v1/publications',
              'httpMethod' => 'GET',
              'parameters' => array(
                'pageSize' => array(
                  'location' => 'query',
                  'type' => 'integer',
                ),
                'filter' => array(
                  'location' => 'query',
                  'type' => 'string',
                ),
                'pageToken' => array(
                  'location' => 'query',
                  'type' => 'string',
                ),
              ),
            ),
          )
        )
    );
    $this->publications_entitlements = new Google_Service_SubscribewithGoogle_PublicationsEntitlements_Resource(
        $this,
        $this->serviceName,
        'entitlements',
        array(
          'methods' => array(
            'list' => array(
              'path' => 'v1/publications/{publicationId}/entitlements',
              'httpMethod' => 'GET',
              'parameters' => array(
                'publicationId' => array(
                  'location' => 'path',
                  'type' => 'string',
                  'required' => true,
                ),
                'pageSize' => array(
                  'location' => 'query',
                  'type' => 'integer',
                ),
                'pageToken' => array(
                  'location' => 'query',
                  'type' => 'string',
                ),
              ),
            ),
          )
        )
    );
  }
}


/**
 * The "publications" collection of methods.
 * Typical usage is:
 *  <code>
 *   $subscribewithgoogleService = new Google_Service_SubscribewithGoogle(...);
 *   $publications = $subscribewithgoogleService->publications;
 *  </code>
 */
class Google_Service_SubscribewithGoogle_Publications_Resource extends Google_Service_Resource
{

  /**
   * List all publications based on the filter, only the publications owned by the
   * current user will be returned (publications.listPublications)
   *
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize LINT.IfChange The maximum number of publications to
   * return, the service may return fewer than this value. if unspecified, at most
   * 100 publications will be returned. The maximum value is 1000; values above
   * 1000 will be coerced to 1000. LINT.ThenChange(//depot/google3/java/com/google
   * /subscribewithgoogle/client/opservice/ListPublicationsPromiseGraph.java)
   * @opt_param string filter Filters the publications list. e.g.
   * verified_domains: "xyz.com" Grammar defined as https://google.aip.dev/160.
   * @opt_param string pageToken A token identifying a page of results the server
   * should return.
   * @return Google_Service_SubscribewithGoogle_ListPublicationsResponse
   */
  public function listPublications($optParams = array())
  {
    $params = array();
    $params = array_merge($params, $optParams);
    return $this->call('list', array($params), "Google_Service_SubscribewithGoogle_ListPublicationsResponse");
  }
}

/**
 * The "entitlements" collection of methods.
 * Typical usage is:
 *  <code>
 *   $subscribewithgoogleService = new Google_Service_SubscribewithGoogle(...);
 *   $entitlements = $subscribewithgoogleService->entitlements;
 *  </code>
 */
class Google_Service_SubscribewithGoogle_PublicationsEntitlements_Resource extends Google_Service_Resource
{

  /**
   * Gets a set of entitlements for the user for this publication. The publication
   * can fetch entitlements on behalf of a user authenticated via OAuth2.
   * (entitlements.listPublicationsEntitlements)
   *
   * @param string $publicationId Mapped to the URL.
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize Requested page size. If unspecified, server will pick
   * an appropriate default.
   * @opt_param string pageToken A token identifying a page of results the server
   * should return. Typically, this is the value of
   * ListEntitlementsResponse.next_page_token returned from the previous call to
   * `ListEntitlements` method.
   * @return Google_Service_SubscribewithGoogle_ListEntitlementsResponse
   */
  public function listPublicationsEntitlements($publicationId, $optParams = array())
  {
    $params = array('publicationId' => $publicationId);
    $params = array_merge($params, $optParams);
    return $this->call('list', array($params), "Google_Service_SubscribewithGoogle_ListEntitlementsResponse");
  }
}




class Google_Service_SubscribewithGoogle_BusinessPredicates extends Google_Model
{
  protected $internal_gapi_mappings = array(
  );
  public $canSell;
  public $supportsSiteKit;


  public function setCanSell($canSell)
  {
    $this->canSell = $canSell;
  }
  public function getCanSell()
  {
    return $this->canSell;
  }
  public function setSupportsSiteKit($supportsSiteKit)
  {
    $this->supportsSiteKit = $supportsSiteKit;
  }
  public function getSupportsSiteKit()
  {
    return $this->supportsSiteKit;
  }
}

class Google_Service_SubscribewithGoogle_Entitlement extends Google_Collection
{
  protected $collection_key = 'products';
  protected $internal_gapi_mappings = array(
  );
  public $name;
  public $products;
  public $source;
  public $subscriptionToken;


  public function setName($name)
  {
    $this->name = $name;
  }
  public function getName()
  {
    return $this->name;
  }
  public function setProducts($products)
  {
    $this->products = $products;
  }
  public function getProducts()
  {
    return $this->products;
  }
  public function setSource($source)
  {
    $this->source = $source;
  }
  public function getSource()
  {
    return $this->source;
  }
  public function setSubscriptionToken($subscriptionToken)
  {
    $this->subscriptionToken = $subscriptionToken;
  }
  public function getSubscriptionToken()
  {
    return $this->subscriptionToken;
  }
}

class Google_Service_SubscribewithGoogle_ListEntitlementsResponse extends Google_Collection
{
  protected $collection_key = 'entitlements';
  protected $internal_gapi_mappings = array(
  );
  protected $entitlementsType = 'Google_Service_SubscribewithGoogle_Entitlement';
  protected $entitlementsDataType = 'array';
  public $nextPageToken;


  public function setEntitlements($entitlements)
  {
    $this->entitlements = $entitlements;
  }
  public function getEntitlements()
  {
    return $this->entitlements;
  }
  public function setNextPageToken($nextPageToken)
  {
    $this->nextPageToken = $nextPageToken;
  }
  public function getNextPageToken()
  {
    return $this->nextPageToken;
  }
}

class Google_Service_SubscribewithGoogle_ListPublicationsResponse extends Google_Collection
{
  protected $collection_key = 'publications';
  protected $internal_gapi_mappings = array(
  );
  public $nextPageToken;
  protected $publicationsType = 'Google_Service_SubscribewithGoogle_Publication';
  protected $publicationsDataType = 'array';


  public function setNextPageToken($nextPageToken)
  {
    $this->nextPageToken = $nextPageToken;
  }
  public function getNextPageToken()
  {
    return $this->nextPageToken;
  }
  public function setPublications($publications)
  {
    $this->publications = $publications;
  }
  public function getPublications()
  {
    return $this->publications;
  }
}

class Google_Service_SubscribewithGoogle_PaymentOptions extends Google_Model
{
  protected $internal_gapi_mappings = array(
  );
  public $contributions;
  public $subscriptions;
  public $thankStickers;


  public function setContributions($contributions)
  {
    $this->contributions = $contributions;
  }
  public function getContributions()
  {
    return $this->contributions;
  }
  public function setSubscriptions($subscriptions)
  {
    $this->subscriptions = $subscriptions;
  }
  public function getSubscriptions()
  {
    return $this->subscriptions;
  }
  public function setThankStickers($thankStickers)
  {
    $this->thankStickers = $thankStickers;
  }
  public function getThankStickers()
  {
    return $this->thankStickers;
  }
}

class Google_Service_SubscribewithGoogle_Product extends Google_Model
{
  protected $internal_gapi_mappings = array(
  );
  public $name;


  public function setName($name)
  {
    $this->name = $name;
  }
  public function getName()
  {
    return $this->name;
  }
}

class Google_Service_SubscribewithGoogle_Publication extends Google_Collection
{
  protected $collection_key = 'verifiedDomains';
  protected $internal_gapi_mappings = array(
  );
  public $displayName;
  public $onboardingState;
  protected $paymentOptionsType = 'Google_Service_SubscribewithGoogle_PaymentOptions';
  protected $paymentOptionsDataType = '';
  protected $productsType = 'Google_Service_SubscribewithGoogle_Product';
  protected $productsDataType = 'array';
  public $publicationId;
  protected $publicationPredicatesType = 'Google_Service_SubscribewithGoogle_PublicationPredicates';
  protected $publicationPredicatesDataType = '';
  public $verifiedDomains;


  public function setDisplayName($displayName)
  {
    $this->displayName = $displayName;
  }
  public function getDisplayName()
  {
    return $this->displayName;
  }
  public function setOnboardingState($onboardingState)
  {
    $this->onboardingState = $onboardingState;
  }
  public function getOnboardingState()
  {
    return $this->onboardingState;
  }
  public function setPaymentOptions(Google_Service_SubscribewithGoogle_PaymentOptions $paymentOptions)
  {
    $this->paymentOptions = $paymentOptions;
  }
  public function getPaymentOptions()
  {
    return $this->paymentOptions;
  }
  public function setProducts($products)
  {
    $this->products = $products;
  }
  public function getProducts()
  {
    return $this->products;
  }
  public function setPublicationId($publicationId)
  {
    $this->publicationId = $publicationId;
  }
  public function getPublicationId()
  {
    return $this->publicationId;
  }
  public function setPublicationPredicates(Google_Service_SubscribewithGoogle_PublicationPredicates $publicationPredicates)
  {
    $this->publicationPredicates = $publicationPredicates;
  }
  public function getPublicationPredicates()
  {
    return $this->publicationPredicates;
  }
  public function setVerifiedDomains($verifiedDomains)
  {
    $this->verifiedDomains = $verifiedDomains;
  }
  public function getVerifiedDomains()
  {
    return $this->verifiedDomains;
  }
}

class Google_Service_SubscribewithGoogle_PublicationPredicates extends Google_Model
{
  protected $internal_gapi_mappings = array(
  );
  protected $businessPredicatesType = 'Google_Service_SubscribewithGoogle_BusinessPredicates';
  protected $businessPredicatesDataType = '';


  public function setBusinessPredicates(Google_Service_SubscribewithGoogle_BusinessPredicates $businessPredicates)
  {
    $this->businessPredicates = $businessPredicates;
  }
  public function getBusinessPredicates()
  {
    return $this->businessPredicates;
  }
}
