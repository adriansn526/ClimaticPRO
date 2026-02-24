#!/bin/bash

ENDPOINT="https://cms.climaticpro.ro/graphql"

echo "Fetching products in 'split-de-perete' and checking their categories..."
# We query the CHILD category to find products, then look at their assigned categories.
# This tells us if they are assigned to the parent 'aer-conditionat-rezidential'.
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { products(first: 3, where: { category: \"split-de-perete\" }) { nodes { name ... on SimpleProduct { productCategories { nodes { name slug } } } } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"
