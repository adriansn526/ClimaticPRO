#!/bin/bash

ENDPOINT="https://cms.climaticpro.ro/graphql"

echo "Fetching products in category 'aer-conditionat-split-de-perete'..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { products(first: 3, where: { category: \"aer-conditionat-split-de-perete\" }) { nodes { name ... on SimpleProduct { attributes { nodes { name label options ... on GlobalProductAttribute { terms { nodes { name slug } } } } } } } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"
