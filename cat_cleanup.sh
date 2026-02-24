#!/bin/bash
WP_CMD="docker exec -u www-data climaticpro-wordpress-1 php wp-cli.phar"

# Function to merge categories
merge_cats() {
  OLD_ID=$1
  NEW_ID=$2
  OLD_SLUG=$3
  
  echo "---------------------------------------------------"
  echo "Merging Category ID $OLD_ID ($OLD_SLUG) -> Target ID $NEW_ID"
  
  # Get product IDs assigned to old category
  # Use tr to ensure clean space separation
  pids=$($WP_CMD post list --post_type=product --product_cat=$OLD_SLUG --field=ID --format=ids | tr '\n' ' ')
  
  if [ ! -z "$pids" ] && [ "$pids" != " " ]; then
      echo "Moving products..."
      
      # Loop through IDs because `wp post term add` might not support multiple IDs before taxonomy correctly
      for pid in $pids; do
          $WP_CMD post term add $pid product_cat $NEW_ID
      done
      
      echo "Successfully assigned new category."
      # Delete old term
      $WP_CMD term delete product_cat $OLD_ID
  else
      echo "No products found in category $OLD_SLUG. Deleting empty category..."
      $WP_CMD term delete product_cat $OLD_ID
  fi
}

echo "Starting cleanup of numbered categories..."

# 1. Fix "32" -> Split de Perete
# Based on output: - 32 (ID: 557, Slug: 32)
merge_cats 557 32 "32"

# 2. Fix "29" -> Multi-Split
# Based on output: - 29 (ID: 558, Slug: 29)
merge_cats 558 29 "29"

# 3. Fix "515" -> Aer Condiționat Rezidențial
# Based on output: - 515 (ID: 556, Slug: 515)
merge_cats 556 515 "515"

echo "---------------------------------------------------"
echo "Cleanup complete."
