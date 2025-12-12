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

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListRollupPropertySourceLinksResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaRollupPropertySourceLink;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "rollupPropertySourceLinks" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $rollupPropertySourceLinks = $analyticsadminService->properties_rollupPropertySourceLinks;
 *  </code>
 */
class PropertiesRollupPropertySourceLinks extends \Google\Service\Resource
{
  /**
   * Creates a roll-up property source link. Only roll-up properties can have
   * source links, so this method will throw an error if used on other types of
   * properties. (rollupPropertySourceLinks.create)
   *
   * @param string $parent Required. Format: properties/{property_id} Example:
   * properties/1234
   * @param GoogleAnalyticsAdminV1alphaRollupPropertySourceLink $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaRollupPropertySourceLink
   * @throws \Google\Service\Exception
   */
  public function create($parent, GoogleAnalyticsAdminV1alphaRollupPropertySourceLink $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1alphaRollupPropertySourceLink::class);
  }
  /**
   * Deletes a roll-up property source link. Only roll-up properties can have
   * source links, so this method will throw an error if used on other types of
   * properties. (rollupPropertySourceLinks.delete)
   *
   * @param string $name Required. Format: properties/{property_id}/rollupProperty
   * SourceLinks/{rollup_property_source_link_id} Example:
   * properties/1234/rollupPropertySourceLinks/5678
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
   * Lookup for a single roll-up property source Link. Only roll-up properties can
   * have source links, so this method will throw an error if used on other types
   * of properties. (rollupPropertySourceLinks.get)
   *
   * @param string $name Required. The name of the roll-up property source link to
   * lookup. Format: properties/{property_id}/rollupPropertySourceLinks/{rollup_pr
   * operty_source_link_id} Example: properties/123/rollupPropertySourceLinks/456
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaRollupPropertySourceLink
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaRollupPropertySourceLink::class);
  }
  /**
   * Lists roll-up property source Links on a property. Only roll-up properties
   * can have source links, so this method will throw an error if used on other
   * types of properties.
   * (rollupPropertySourceLinks.listPropertiesRollupPropertySourceLinks)
   *
   * @param string $parent Required. The name of the roll-up property to list
   * roll-up property source links under. Format: properties/{property_id}
   * Example: properties/1234
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize Optional. The maximum number of resources to return.
   * The service may return fewer than this value, even if there are additional
   * pages. If unspecified, at most 50 resources will be returned. The maximum
   * value is 200; (higher values will be coerced to the maximum)
   * @opt_param string pageToken Optional. A page token, received from a previous
   * `ListRollupPropertySourceLinks` call. Provide this to retrieve the subsequent
   * page. When paginating, all other parameters provided to
   * `ListRollupPropertySourceLinks` must match the call that provided the page
   * token.
   * @return GoogleAnalyticsAdminV1alphaListRollupPropertySourceLinksResponse
   * @throws \Google\Service\Exception
   */
  public function listPropertiesRollupPropertySourceLinks($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListRollupPropertySourceLinksResponse::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PropertiesRollupPropertySourceLinks::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_PropertiesRollupPropertySourceLinks');
