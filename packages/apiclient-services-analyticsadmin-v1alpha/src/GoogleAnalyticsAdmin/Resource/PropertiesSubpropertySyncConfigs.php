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

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListSubpropertySyncConfigsResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaSubpropertySyncConfig;

/**
 * The "subpropertySyncConfigs" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $subpropertySyncConfigs = $analyticsadminService->properties_subpropertySyncConfigs;
 *  </code>
 */
class PropertiesSubpropertySyncConfigs extends \Google\Service\Resource
{
  /**
   * Lookup for a single `SubpropertySyncConfig`. (subpropertySyncConfigs.get)
   *
   * @param string $name Required. Resource name of the SubpropertySyncConfig to
   * lookup. Format:
   * properties/{ordinary_property_id}/subpropertySyncConfigs/{subproperty_id}
   * Example: properties/1234/subpropertySyncConfigs/5678
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaSubpropertySyncConfig
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaSubpropertySyncConfig::class);
  }
  /**
   * List all `SubpropertySyncConfig` resources for a property.
   * (subpropertySyncConfigs.listPropertiesSubpropertySyncConfigs)
   *
   * @param string $parent Required. Resource name of the property. Format:
   * properties/property_id Example: properties/123
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize Optional. The maximum number of resources to return.
   * The service may return fewer than this value, even if there are additional
   * pages. If unspecified, at most 50 resources will be returned. The maximum
   * value is 200; (higher values will be coerced to the maximum)
   * @opt_param string pageToken Optional. A page token, received from a previous
   * `ListSubpropertySyncConfig` call. Provide this to retrieve the subsequent
   * page. When paginating, all other parameters provided to
   * `ListSubpropertySyncConfig` must match the call that provided the page token.
   * @return GoogleAnalyticsAdminV1alphaListSubpropertySyncConfigsResponse
   * @throws \Google\Service\Exception
   */
  public function listPropertiesSubpropertySyncConfigs($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListSubpropertySyncConfigsResponse::class);
  }
  /**
   * Updates a `SubpropertySyncConfig`. (subpropertySyncConfigs.patch)
   *
   * @param string $name Output only. Identifier. Format:
   * properties/{ordinary_property_id}/subpropertySyncConfigs/{subproperty_id}
   * Example: properties/1234/subpropertySyncConfigs/5678
   * @param GoogleAnalyticsAdminV1alphaSubpropertySyncConfig $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Optional. The list of fields to update. Field
   * names must be in snake case (for example, "field_to_update"). Omitted fields
   * will not be updated. To replace the entire entity, use one path with the
   * string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaSubpropertySyncConfig
   * @throws \Google\Service\Exception
   */
  public function patch($name, GoogleAnalyticsAdminV1alphaSubpropertySyncConfig $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], GoogleAnalyticsAdminV1alphaSubpropertySyncConfig::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PropertiesSubpropertySyncConfigs::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_PropertiesSubpropertySyncConfigs');
