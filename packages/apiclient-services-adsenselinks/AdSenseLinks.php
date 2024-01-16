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
 * The "adSenseLinks" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google_Service_GoogleAnalyticsAdmin(...);
 *   $adSenseLinks = $analyticsadminService->adSenseLinks;
 *  </code>
 */
class Google_Service_GoogleAnalyticsAdmin_PropertiesAdSenseLinks_Resource extends Google_Service_Resource
{

  /**
   * Creates an AdSenseLink. (adSenseLinks.create)
   *
   * @param string $parent Required. The property for which to create an AdSense
   * Link. Format: properties/{propertyId} Example: properties/1234
   * @param Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink $postBody
   * @param array $optParams Optional parameters.
   * @return Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink
   */
  public function create($parent, Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink $postBody, $optParams = array())
  {
    $params = array('parent' => $parent, 'postBody' => $postBody);
    $params = array_merge($params, $optParams);
    return $this->call('create', array($params), "Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink");
  }

  /**
   * Deletes an AdSenseLink. (adSenseLinks.delete)
   *
   * @param string $name Required. Unique identifier for the AdSense Link to be
   * deleted. Format: properties/{propertyId}/adSenseLinks/{linkId} Example:
   * properties/1234/adSenseLinks/5678
   * @param array $optParams Optional parameters.
   * @return Google_Service_GoogleAnalyticsAdmin_GoogleProtobufEmpty
   */
  public function delete($name, $optParams = array())
  {
    $params = array('name' => $name);
    $params = array_merge($params, $optParams);
    return $this->call('delete', array($params), "Google_Service_GoogleAnalyticsAdmin_GoogleProtobufEmpty");
  }

  /**
   * Looks up a single AdSenseLink. (adSenseLinks.get)
   *
   * @param string $name Required. Unique identifier for the AdSense Link
   * requested. Format: properties/{propertyId}/adSenseLinks/{linkId} Example:
   * properties/1234/adSenseLinks/5678
   * @param array $optParams Optional parameters.
   * @return Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink
   */
  public function get($name, $optParams = array())
  {
    $params = array('name' => $name);
    $params = array_merge($params, $optParams);
    return $this->call('get', array($params), "Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink");
  }

  /**
   * Lists AdSenseLinks on a property. (adSenseLinks.listPropertiesAdSenseLinks)
   *
   * @param string $parent Required. Resource name of the parent property. Format:
   * properties/{propertyId} Example: properties/1234
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize The maximum number of resources to return. If
   * unspecified, at most 50 resources will be returned. The maximum value is 200
   * (higher values will be coerced to the maximum).
   * @opt_param string pageToken A page token received from a previous
   * `ListAdSenseLinks` call. Provide this to retrieve the subsequent page. When
   * paginating, all other parameters provided to `ListAdSenseLinks` must match
   * the call that provided the page token.
   * @return Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaListAdSenseLinksResponse
   */
  public function listPropertiesAdSenseLinks($parent, $optParams = array())
  {
    $params = array('parent' => $parent);
    $params = array_merge($params, $optParams);
    return $this->call('list', array($params), "Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaListAdSenseLinksResponse");
  }
}

class Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink extends Google_Model
{
  protected $internal_gapi_mappings = array(
  );
  public $adClientCode;
  public $name;


  public function setAdClientCode($adClientCode)
  {
    $this->adClientCode = $adClientCode;
  }
  public function getAdClientCode()
  {
    return $this->adClientCode;
  }
  public function setName($name)
  {
    $this->name = $name;
  }
  public function getName()
  {
    return $this->name;
  }
}

class Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaListAdSenseLinksResponse extends Google_Collection
{
  protected $collection_key = 'adsenseLinks';
  protected $internal_gapi_mappings = array(
  );
  protected $adsenseLinksType = 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaAdSenseLink';
  protected $adsenseLinksDataType = 'array';
  public $adsenseLinks;
  public $nextPageToken;


  public function setAdsenseLinks($adsenseLinks)
  {
    $this->adsenseLinks = $adsenseLinks;
  }
  public function getAdsenseLinks()
  {
    return $this->adsenseLinks;
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

class Google_Service_GoogleAnalyticsAdmin_GoogleProtobufEmpty extends Google_Model
{
}
