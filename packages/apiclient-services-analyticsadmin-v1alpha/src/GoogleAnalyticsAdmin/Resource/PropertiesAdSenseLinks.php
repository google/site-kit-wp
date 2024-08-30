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

namespace Google\Service\GoogleAnalyticsAdmin\Resource;

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaAdSenseLink;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListAdSenseLinksResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "adSenseLinks" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $adSenseLinks = $analyticsadminService->properties_adSenseLinks;
 *  </code>
 */
class PropertiesAdSenseLinks extends \Google\Service\Resource
{
  /**
   * Creates an AdSenseLink. (adSenseLinks.create)
   *
   * @param string $parent Required. The property for which to create an AdSense
   * Link. Format: properties/{propertyId} Example: properties/1234
   * @param GoogleAnalyticsAdminV1alphaAdSenseLink $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaAdSenseLink
   * @throws \Google\Service\Exception
   */
  public function create($parent, GoogleAnalyticsAdminV1alphaAdSenseLink $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1alphaAdSenseLink::class);
  }
  /**
   * Deletes an AdSenseLink. (adSenseLinks.delete)
   *
   * @param string $name Required. Unique identifier for the AdSense Link to be
   * deleted. Format: properties/{propertyId}/adSenseLinks/{linkId} Example:
   * properties/1234/adSenseLinks/5678
   * @param array $optParams Optional parameters.
   * @return GoogleProtobufEmpty
   * @throws \Google\Service\Exception
   */
  public function delete($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('delete', [$params], GoogleProtobufEmpty::class);
  }
  /**
   * Looks up a single AdSenseLink. (adSenseLinks.get)
   *
   * @param string $name Required. Unique identifier for the AdSense Link
   * requested. Format: properties/{propertyId}/adSenseLinks/{linkId} Example:
   * properties/1234/adSenseLinks/5678
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaAdSenseLink
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaAdSenseLink::class);
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
   * @return GoogleAnalyticsAdminV1alphaListAdSenseLinksResponse
   * @throws \Google\Service\Exception
   */
  public function listPropertiesAdSenseLinks($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListAdSenseLinksResponse::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PropertiesAdSenseLinks::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_PropertiesAdSenseLinks');
