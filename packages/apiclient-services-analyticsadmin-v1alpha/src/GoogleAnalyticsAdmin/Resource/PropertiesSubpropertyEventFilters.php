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

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListSubpropertyEventFiltersResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaSubpropertyEventFilter;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "subpropertyEventFilters" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $subpropertyEventFilters = $analyticsadminService->properties_subpropertyEventFilters;
 *  </code>
 */
class PropertiesSubpropertyEventFilters extends \Google\Service\Resource
{
  /**
   * Creates a subproperty Event Filter. (subpropertyEventFilters.create)
   *
   * @param string $parent Required. The ordinary property for which to create a
   * subproperty event filter. Format: properties/property_id Example:
   * properties/123
   * @param GoogleAnalyticsAdminV1alphaSubpropertyEventFilter $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaSubpropertyEventFilter
   * @throws \Google\Service\Exception
   */
  public function create($parent, GoogleAnalyticsAdminV1alphaSubpropertyEventFilter $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1alphaSubpropertyEventFilter::class);
  }
  /**
   * Deletes a subproperty event filter. (subpropertyEventFilters.delete)
   *
   * @param string $name Required. Resource name of the subproperty event filter
   * to delete. Format:
   * properties/property_id/subpropertyEventFilters/subproperty_event_filter
   * Example: properties/123/subpropertyEventFilters/456
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
   * Lookup for a single subproperty Event Filter. (subpropertyEventFilters.get)
   *
   * @param string $name Required. Resource name of the subproperty event filter
   * to lookup. Format:
   * properties/property_id/subpropertyEventFilters/subproperty_event_filter
   * Example: properties/123/subpropertyEventFilters/456
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaSubpropertyEventFilter
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaSubpropertyEventFilter::class);
  }
  /**
   * List all subproperty Event Filters on a property.
   * (subpropertyEventFilters.listPropertiesSubpropertyEventFilters)
   *
   * @param string $parent Required. Resource name of the ordinary property.
   * Format: properties/property_id Example: properties/123
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize Optional. The maximum number of resources to return.
   * The service may return fewer than this value, even if there are additional
   * pages. If unspecified, at most 50 resources will be returned. The maximum
   * value is 200; (higher values will be coerced to the maximum)
   * @opt_param string pageToken Optional. A page token, received from a previous
   * `ListSubpropertyEventFilters` call. Provide this to retrieve the subsequent
   * page. When paginating, all other parameters provided to
   * `ListSubpropertyEventFilters` must match the call that provided the page
   * token.
   * @return GoogleAnalyticsAdminV1alphaListSubpropertyEventFiltersResponse
   * @throws \Google\Service\Exception
   */
  public function listPropertiesSubpropertyEventFilters($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListSubpropertyEventFiltersResponse::class);
  }
  /**
   * Updates a subproperty Event Filter. (subpropertyEventFilters.patch)
   *
   * @param string $name Output only. Format: properties/{ordinary_property_id}/su
   * bpropertyEventFilters/{sub_property_event_filter} Example:
   * properties/1234/subpropertyEventFilters/5678
   * @param GoogleAnalyticsAdminV1alphaSubpropertyEventFilter $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to update. Field
   * names must be in snake case (for example, "field_to_update"). Omitted fields
   * will not be updated. To replace the entire entity, use one path with the
   * string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaSubpropertyEventFilter
   * @throws \Google\Service\Exception
   */
  public function patch($name, GoogleAnalyticsAdminV1alphaSubpropertyEventFilter $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], GoogleAnalyticsAdminV1alphaSubpropertyEventFilter::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PropertiesSubpropertyEventFilters::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_PropertiesSubpropertyEventFilters');
