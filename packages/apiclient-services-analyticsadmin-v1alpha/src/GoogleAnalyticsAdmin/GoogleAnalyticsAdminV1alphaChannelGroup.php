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

class GoogleAnalyticsAdminV1alphaChannelGroup extends \Google\Collection
{
  protected $collection_key = 'groupingRule';
  /**
   * @var string
   */
  public $description;
  /**
   * @var string
   */
  public $displayName;
  protected $groupingRuleType = GoogleAnalyticsAdminV1alphaGroupingRule::class;
  protected $groupingRuleDataType = 'array';
  /**
   * @var string
   */
  public $name;
  /**
   * @var bool
   */
  public $primary;
  /**
   * @var bool
   */
  public $systemDefined;

  /**
   * @param string
   */
  public function setDescription($description)
  {
    $this->description = $description;
  }
  /**
   * @return string
   */
  public function getDescription()
  {
    return $this->description;
  }
  /**
   * @param string
   */
  public function setDisplayName($displayName)
  {
    $this->displayName = $displayName;
  }
  /**
   * @return string
   */
  public function getDisplayName()
  {
    return $this->displayName;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaGroupingRule[]
   */
  public function setGroupingRule($groupingRule)
  {
    $this->groupingRule = $groupingRule;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaGroupingRule[]
   */
  public function getGroupingRule()
  {
    return $this->groupingRule;
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
  /**
   * @param bool
   */
  public function setPrimary($primary)
  {
    $this->primary = $primary;
  }
  /**
   * @return bool
   */
  public function getPrimary()
  {
    return $this->primary;
  }
  /**
   * @param bool
   */
  public function setSystemDefined($systemDefined)
  {
    $this->systemDefined = $systemDefined;
  }
  /**
   * @return bool
   */
  public function getSystemDefined()
  {
    return $this->systemDefined;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaChannelGroup::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaChannelGroup');
