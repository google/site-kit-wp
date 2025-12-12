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

namespace Google\Service\GoogleAnalyticsAdmin;

class GoogleAnalyticsAdminV1alphaSubpropertyEventFilter extends \Google\Collection
{
  protected $collection_key = 'filterClauses';
  /**
   * @var string
   */
  public $applyToProperty;
  protected $filterClausesType = GoogleAnalyticsAdminV1alphaSubpropertyEventFilterClause::class;
  protected $filterClausesDataType = 'array';
  /**
   * @var string
   */
  public $name;

  /**
   * @param string
   */
  public function setApplyToProperty($applyToProperty)
  {
    $this->applyToProperty = $applyToProperty;
  }
  /**
   * @return string
   */
  public function getApplyToProperty()
  {
    return $this->applyToProperty;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaSubpropertyEventFilterClause[]
   */
  public function setFilterClauses($filterClauses)
  {
    $this->filterClauses = $filterClauses;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaSubpropertyEventFilterClause[]
   */
  public function getFilterClauses()
  {
    return $this->filterClauses;
  }
  /**
   * @param string
   */
  public function setName($name)
  {
    $this->name = $name;
  }
  /**
   * @return string
   */
  public function getName()
  {
    return $this->name;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaSubpropertyEventFilter::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaSubpropertyEventFilter');
